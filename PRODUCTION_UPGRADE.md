# Production upgrade: wallet release → Google sign-in release + admin app

This is the runbook for replacing the blog and API that are live today with this release, and for
putting the admin app online for the first time. Follow it top to bottom. Every step says where it
runs: **your computer**, **the server** (SSH), a **web console** (Google, Resend, DNS, GitHub).

Domains used below: `eightblock.dev` (blog), `api.eightblock.dev` (API), `admin.eightblock.dev`
(admin, new), `news.eightblock.dev` (email sending domain). Replace `YOUR_VPS_IP` and
`you@gmail.com` with the real values.

## What changes

|                                                      | Today             | After this release                                       |
| ---------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| Blog (`eightblock-frontend`, port 3006)              | Wallet sign-in    | Google sign-in, new design, newsletter pages             |
| API (`eightblock-backend`, port from `backend/.env`) | Wallet signatures | Google OAuth, analytics, newsletter, roles               |
| Admin (`eightblock-admin`, port 3007)                | does not exist    | **new**: dashboards, newsletter, users, portfolio        |
| Database                                             | 7 migrations      | 11 more migrations, applied automatically after a backup |

- **Downtime:** none for the blog. On this first deploy the API restarts once because its PM2
  definition changed, a few seconds.
- **Wallet sign-in is removed.** Existing accounts, articles, comments and bookmarks are kept.
  A wallet-era account can be reached with Google only if its `email` matches the Google address
  (step B3). Do that for every author **before** they sign in.
- **Merging to `main` deploys automatically** (CI, then the deploy workflow). Finish phases A and B
  before you merge.

---

## Phase A: accounts and DNS (web consoles)

### A1. DNS for the admin app

At your DNS provider, add:

| Type | Name    | Value                                                                   |
| ---- | ------- | ----------------------------------------------------------------------- |
| A    | `admin` | `YOUR_VPS_IP`                                                           |
| AAAA | `admin` | the VPS IPv6 address, only if `eightblock.dev` already has AAAA records |

If the domain goes through Cloudflare's proxy (orange cloud), keep `admin` on **DNS only** until
certbot has issued the certificate in B6.

Check from your computer: `dig +short admin.eightblock.dev` prints `YOUR_VPS_IP`.

### A2. Google sign-in (Google Cloud Console)

1. <https://console.cloud.google.com/> → create or select a project (for example "Eightblock").
2. **APIs & Services → OAuth consent screen** (called "Google Auth Platform" in newer consoles):
   - User type **External**
   - App name `Eightblock`, support email. Skip the logo: uploading one triggers a Google brand
     review that can take days
   - App domain: home page `https://eightblock.dev`, privacy policy `https://eightblock.dev/privacy`,
     terms `https://eightblock.dev/terms`
   - Authorized domains: `eightblock.dev`
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` (non-sensitive,
     no Google review needed)
   - **Publish the app** (Audience → Publish app → "In production"). While it stays in "Testing",
     only listed test users can sign in and their sessions expire after 7 days.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type **Web application**, name `Eightblock production`
   - Authorized redirect URI, exactly: `https://api.eightblock.dev/api/auth/google/callback`
   - Authorized JavaScript origins: not needed (sign-in runs through the API)
4. Copy the **Client ID** and **Client secret** for B4.

### A3. Email sending (Resend)

1. <https://resend.com> → sign in → **Domains → Add domain** → `news.eightblock.dev`
   (a subdomain keeps newsletter reputation separate from your main domain).
2. Add **exactly the DNS records Resend shows** (typically an MX and an SPF TXT record on
   `send.news`, and a DKIM TXT record on `resend._domainkey.news`). Also add, once, for the root
   domain:

   | Type | Name     | Value                                        |
   | ---- | -------- | -------------------------------------------- |
   | TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:you@gmail.com` |

3. Wait until Resend shows the domain as **Verified** (minutes to a few hours).
4. **API Keys → Create API key**, permission "Sending access", domain `news.eightblock.dev`.
   Copy it (`re_...`) for B4.
5. **Webhooks → Add endpoint**:
   - URL `https://api.eightblock.dev/api/webhooks/resend`
   - Events: `email.bounced` and `email.complained`
   - Copy the **signing secret** (`whsec_...`) for B4. The endpoint only starts answering after
     the deploy; that is fine.
6. Check that your Resend plan's daily and monthly limits cover your subscriber count. The free
   plan allows 100 emails a day.

### A4. GitHub

Repository → **Settings → Secrets and variables → Actions**. These already exist if the current
production was deployed by GitHub Actions; confirm them:

| Secret         | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| `VPS_HOST`     | `YOUR_VPS_IP`                                                            |
| `VPS_USERNAME` | the deploy user (for example `deploy`)                                   |
| `VPS_SSH_KEY`  | private key whose public half is in that user's `~/.ssh/authorized_keys` |
| `VPS_PORT`     | only if SSH is not on port 22                                            |

---

## Phase B: prepare the server (SSH)

```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/eightblock
```

### B1. Check the tools

```bash
node -v                      # v24.15+ or v22.22+ (see B1 below if older)
pnpm -v                      # 9.x   (if missing or older: corepack enable && corepack prepare pnpm@9 --activate)
pm2 -v                       # any recent version (npm i -g pm2)
pg_dump --version            # must be >= the PostgreSQL server version below
psql "$(sed -n 's/^DATABASE_URL=//p' backend/.env | tr -d '"' | sed 's/?.*//')" -Atc 'show server_version'
redis-cli -a "$(sed -n 's/^REDIS_PASSWORD=//p' backend/.env | tr -d '"')" ping   # PONG
df -h /var/www               # at least 5 GB free (two builds side by side + DB backups)
free -h                      # 4 GB RAM or 2 GB + swap; Next.js builds need about 1.5 GB
git status --short           # local edits on the server are discarded by the deploy
```

- `pg_dump` missing or too old: `sudo apt install postgresql-client-<server major version>`
  (for example `postgresql-client-16`; add the PostgreSQL apt repository if your Ubuntu does not
  ship that version). Without it the deploy stops before migrating, on purpose.
- Redis must be running: the new API rejects sessions while Redis is unreachable.
- Node older than 24.15 (or 22.22): the blog's build needs it. Upgrade to Node 24 LTS, then make
  PM2 and pnpm use it:

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt install -y nodejs
  node -v                                   # v24.x
  sudo npm i -g pm2 && pm2 update           # restarts the running apps on the new Node
  sudo corepack enable && corepack prepare pnpm@9 --activate
  ```

### B2. Take your own backups

The deploy takes a database backup by itself before migrating; this one is yours to keep.

```bash
mkdir -p ~/backups/pre-upgrade
DB="$(sed -n 's/^DATABASE_URL=//p' backend/.env | tr -d '"' | sed 's/?.*//')"
pg_dump --format=custom --no-owner --file ~/backups/pre-upgrade/db-$(date +%F).dump "$DB"
tar czf ~/backups/pre-upgrade/uploads-$(date +%F).tgz -C backend uploads
cp backend/.env ~/backups/pre-upgrade/backend.env
cp frontend/.env.production ~/backups/pre-upgrade/frontend.env.production 2>/dev/null || true
ls -lh ~/backups/pre-upgrade
```

### B3. Link existing authors to their Google accounts

Google sign-in attaches to an existing account only when the account's `email` equals the Google
address (lowercase). Otherwise it creates a new, empty account.

```bash
psql "$DB"
```

```sql
-- Who has articles, and which email each account has today
SELECT u.id, u.name, u.email, u.role, left(u."walletAddress", 16) AS wallet, count(a.id) AS articles
FROM "User" u LEFT JOIN "Article" a ON a."authorId" = u.id
GROUP BY u.id ORDER BY articles DESC, u."createdAt";

-- For each author: set the Google address they will sign in with (lowercase)
UPDATE "User" SET email = lower('you@gmail.com') WHERE id = '<id from the list>';

-- Test content you do not want public (look at titles and slugs)
SELECT id, slug, title, status FROM "Article" ORDER BY "createdAt";
-- DELETE FROM "Article" WHERE id = '<id>';   -- only for real test articles
\q
```

If the `UPDATE` fails with a unique-constraint error, another account already uses that email;
decide which one to keep before continuing.

### B4. `backend/.env`

Open it with `nano backend/.env` and make it contain **all** of the following. Keep your current
`DATABASE_URL`, `REDIS_*`, `PORT` and `JWT_SECRET` (if it is 32+ characters). Remove the old
`CORS_ORIGIN` and `UPLOAD_DIR` lines; they are no longer read.

```env
NODE_ENV=production
PORT=5000                       # keep the current value; nginx proxies api.eightblock.dev to it

DATABASE_URL=postgresql://...   # keep
JWT_SECRET=...                  # keep if >= 32 chars, otherwise: openssl rand -base64 64

SITE_URL=https://eightblock.dev
API_URL=https://api.eightblock.dev
ADMIN_URL=https://admin.eightblock.dev
ALLOWED_ORIGINS=https://eightblock.dev,https://www.eightblock.dev,https://admin.eightblock.dev
TRUST_PROXY=1                   # 1 = nginx only; 2 if Cloudflare's proxy is in front of nginx
RATE_LIMIT_ALLOWLIST=YOUR_VPS_IP

GOOGLE_CLIENT_ID=...apps.googleusercontent.com      # from A2
GOOGLE_CLIENT_SECRET=...                            # from A2
ADMIN_EMAILS=you@gmail.com                          # comma-separated; these become admins at sign-in

EMAIL_PROVIDER_API_KEY=re_...                       # from A3
EMAIL_FROM=Eightblock <newsletter@news.eightblock.dev>
EMAIL_TRANSACTIONAL_FROM=Eightblock <noreply@news.eightblock.dev>
EMAIL_REPLY_TO=you@gmail.com                        # optional
EMAIL_POSTAL_ADDRESS=                               # optional, shown in the email footer
RESEND_WEBHOOK_SECRET=whsec_...                     # from A3

REDIS_HOST=localhost            # keep
REDIS_PORT=6379                 # keep
REDIS_PASSWORD=...              # keep
```

`ALLOWED_ORIGINS` entries are bare origins: no path, no trailing slash. Drop the `www` entry if
`www.eightblock.dev` does not exist. The deploy validates this file and stops, without touching
anything, if a required value is missing or malformed.

### B5. Blog and admin build settings

These are baked into the builds, so they must exist before the deploy.

```bash
cat > frontend/.env.production <<'EOF'
NEXT_PUBLIC_API_URL=https://api.eightblock.dev/api
NEXT_PUBLIC_SITE_URL=https://eightblock.dev
NEXT_PUBLIC_ADMIN_URL=https://admin.eightblock.dev
EOF
mkdir -p admin && cp frontend/.env.production admin/.env.production
```

The `admin/` folder arrives with the deploy; creating it now is fine (env files are ignored by git
and survive the checkout).

`NEXT_PUBLIC_API_URL` ends with `/api`. The old `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are no
longer used; the command above removes them.

### B6. nginx

**Admin (new).** `sudo nano /etc/nginx/sites-available/admin.eightblock.dev`:

```nginx
server {
    listen 80;
    server_name admin.eightblock.dev;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/admin.eightblock.dev /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d admin.eightblock.dev      # choose "redirect HTTP to HTTPS"
```

**API (update).** In the `api.eightblock.dev` config, check that:

- `proxy_pass` points to `127.0.0.1:<PORT from backend/.env>`
- `client_max_body_size` is at least `10M` (image uploads)
- `proxy_set_header X-Forwarded-For` and `X-Forwarded-Proto` are set (rate limits and secure
  cookies depend on them)

Optionally add the flood protection from `VPS_DEPLOYMENT_GUIDE.md` (the `geo`/`map`/`limit_req_zone`
block above the `server` block, `limit_req` inside it). If you do, put `YOUR_VPS_IP` in the `geo`
list, or server-rendered pages get rate limited.

**Blog.** Its `proxy_pass` must point to `127.0.0.1:3006` (same as today).

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://admin.eightblock.dev | head -1   # 502 is expected until the deploy
```

---

## Phase C: deploy

### C1. Push and open the pull request (your computer)

```bash
git push origin fix/seo-og-images-port
gh pr create --base main --head fix/seo-og-images-port \
  --title "Google sign-in release and admin app" \
  --body "See PRODUCTION_UPGRADE.md"
```

Wait for the **CI** check on the pull request to pass: lint, typecheck, tests against Postgres and
Redis, all migrations on an empty database, the schema drift check, and the three builds. Fix
anything red before going on.

### C2. Merge

Merge the pull request (a merge commit or squash, either works). This starts, in order:

1. **CI** on `main`
2. **Deploy to VPS** (only if CI passed), which SSHes in, checks out the exact commit, and runs
   `./deploy.sh`

Watch it under **GitHub → Actions → Deploy to VPS**. It takes about 5 to 10 minutes. The steps you
will see:

| Step                                        | If it fails                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Preflight (tools, env files)                | Nothing changed. Fix what it names, re-run the workflow                  |
| Installing dependencies, building backend   | Nothing changed                                                          |
| Checking backend configuration              | Nothing changed. It lists the `.env` errors                              |
| Building frontend, building admin app       | Nothing changed                                                          |
| Starting the new build next to the live one | Nothing changed. The logs of the new build are printed                   |
| Migrating the database                      | Backup first, then 11 migrations. A failure prints the exact fix command |
| Switching to the new build, Verifying       | If unhealthy, the previous code is restored automatically (see Phase E)  |

To re-run it: **Actions → Deploy to VPS → Run workflow** (deploys the current `main`).

**Manual alternative** (instead of waiting for Actions, or if Actions cannot reach the server):

```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/eightblock
git fetch --prune origin && git checkout -f main && git reset --hard origin/main
bash ./deploy.sh
```

---

## Phase D: verify (right after the deploy)

### D1. Server

```bash
pm2 status                                           # eightblock-backend (2), eightblock-frontend (2), eightblock-admin (1), all online
curl -s http://127.0.0.1:5000/readyz; echo           # use your backend PORT; database and redis both true
tail -n 20 logs/deploy.log
pm2 logs --nostream --lines 30 eightblock-backend    # no "config:" errors
pm2 save                                             # the deploy does this too; harmless
```

If PM2 was never set to start on boot: `pm2 startup`, run the command it prints, then `pm2 save`.

### D2. Blog, as a visitor

- [ ] `https://eightblock.dev` loads, light and dark theme, on mobile too
- [ ] An existing article opens; a made-up URL shows the "not on the chain" 404 page
- [ ] `https://eightblock.dev/sitemap.xml` and `/robots.txt` load
- [ ] Old links redirect: `/profile` → `/settings`, `/articles` → `/writing`
- [ ] Paste an article URL into <https://www.opengraph.xyz> and see the image and title

### D3. Sign-in and admin

- [ ] Blog → **Sign in** → Google → back on the blog, signed in (no `redirect_uri_mismatch`)
- [ ] Your old articles show under **My articles** (if not: B3, then sign out and in again)
- [ ] `https://admin.eightblock.dev` → sign in with the `ADMIN_EMAILS` account → overview loads
- [ ] **Users:** give the other authors the **Writer** (or Editor) role. New accounts start as Reader
- [ ] **Portfolio:** fill in the About page, save, check `https://eightblock.dev/about`

### D4. Writing

- [ ] Write an article, upload a cover image, publish; it appears on the home page within a minute
- [ ] Post a comment, clap, bookmark it
- [ ] Delete the test article afterwards

### D5. Email and newsletter

- [ ] Admin → **Newsletter → Settings**: check senders, double opt-in on, digest schedule,
      "draft on publish", then save
- [ ] Admin → Newsletter → write a short message → **Send test to me** → it arrives, not in spam
- [ ] Blog → subscribe with a second address → confirmation email → confirm → welcome email
- [ ] The unsubscribe link in that email works
- [ ] Webhook reachable and configured:
      `curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.eightblock.dev/api/webhooks/resend`
      prints `401` (unsigned request rejected, as it should). `503` means `RESEND_WEBHOOK_SECRET`
      is missing; `404` means nginx does not reach the new API

### D6. Analytics

- [ ] Admin → **Analytics**: the realtime card shows your own visit within a minute

### D7. Outside tools

- [ ] Google Search Console: resubmit `https://eightblock.dev/sitemap.xml`
- [ ] An uptime monitor (UptimeRobot, Better Stack...) on `https://api.eightblock.dev/readyz`,
      `https://eightblock.dev` and `https://admin.eightblock.dev/login`

---

## Phase E: if something goes wrong

**The deploy stopped before "Switching to the new build".** The live site and the database are
unchanged (if it stopped during migration, PostgreSQL rolled that migration back). Read the error,
fix it, re-run the workflow. Logs: `logs/deploy.log`, `logs/smoke-*.log`.

**The new build failed its health check.** `deploy.sh` restores the previous code by itself. The
database has already been migrated, and the old wallet-era code does not work with the new schema
(for example, the old view tracker's table is gone). So restore the database too:

```bash
cd /var/www/eightblock
pm2 stop eightblock-backend
DB="$(sed -n 's/^DATABASE_URL=//p' backend/.env | tr -d '"' | sed 's/?.*//')"
LATEST=$(ls -t ~/backups/eightblock/eightblock-*.dump | head -1); echo "$LATEST"
pg_restore --clean --if-exists --no-owner -d "$DB" "$LATEST"
pm2 start eightblock-backend
```

Then find the cause in `pm2 logs`, fix it, and deploy again.

**Going back later by hand:** `./deploy.sh rollback` swaps the code back (run it again to undo).
It never touches the database, so after this release, pair it with the restore above.

| Symptom                                                     | Cause and fix                                                                                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Deploy: `ADMIN_URL is not set` (or another `.env` error)    | Complete `backend/.env` (B4)                                                                                                                   |
| Deploy: `pg_dump not found` or a version mismatch           | Install the right `postgresql-client` (B1)                                                                                                     |
| Deploy: `Migration ... failed`                              | Run the `prisma migrate resolve` command it prints, then re-run                                                                                |
| Google: `redirect_uri_mismatch`                             | The redirect URI in A2 must be exactly `https://api.eightblock.dev/api/auth/google/callback`                                                   |
| Google: "Access blocked: app is in testing"                 | Publish the consent screen (A2 step 2)                                                                                                         |
| Signed in, but the admin app says you are not an admin      | Email not in `ADMIN_EMAILS`, or the Google email is unverified. Fix `.env`, `pm2 reload eightblock-backend`, sign out and in                   |
| Browser console shows CORS errors, or saving fails with 403 | The page's origin is missing from `ALLOWED_ORIGINS`                                                                                            |
| Pages load slowly or show errors, API logs show 429         | `RATE_LIMIT_ALLOWLIST` and the nginx `geo` list need `YOUR_VPS_IP`                                                                             |
| Test email not sent                                         | Domain not verified in Resend, wrong API key, or `EMAIL_FROM` not on `news.eightblock.dev`                                                     |
| An author sees an empty account                             | B3 was skipped. Move the articles: `UPDATE "Article" SET "authorId" = '<old id>' WHERE "authorId" = '<new id>';` then delete the empty account |

---

## Phase F: after launch

- [ ] Remove `~/backups/pre-upgrade` once you are confident (keep at least a week)
- [ ] Log rotation for `/var/www/eightblock/logs/*.log` (see `DEPLOYMENT_CHECKLIST.md`, step 26)
- [ ] Decide whether writers may publish without an editor's review (today they can)
- [ ] Known limits worth planning: search covers the latest 30 articles; `/writing` and author pages
      render in the browser; the article list API returns full content; images are served without
      Next.js optimisation; old PageView rows are never pruned; the admin subscriber list is not
      paginated
- [ ] Upgrade the development tooling flagged by `pnpm audit` (Vitest 2 in the admin app, ESLint
      dependencies). None of it ships to production

From now on, every merge to `main` deploys the same way, with no manual steps.
