# eightblock

Open-source platform for the Cardano community featuring a collaborative blog, educational resources, contributor-friendly processes, and a modern Jamstack + API architecture. This repository contains both the public-facing Next.js site and the Express + Prisma backend that powers content workflows.

## Features

- **Education-first blog** with a rich text editor, topics, tags, and featured content
- **Infinite scroll** with React Query for seamless content browsing
- **Redis caching** for fast responses and reduced database load
- **Community engagement** via claps, comments, bookmarks, and newsletter subscriptions
- **Google sign-in** with revocable sessions
- **Separate admin app** (admins only) for analytics, the newsletter, users and the About page portfolio
- **REST API** with Prisma ORM and PostgreSQL storage
- **Open-source readiness** including contribution guidelines, issue/PR templates, linting, tests, and CI

## Monorepo Structure

```
frontend/     # The blog: Next.js + TailwindCSS
admin/        # The admin app (admin.eightblock.dev), only for accounts with the ADMIN role
packages/ui/  # Shared design system: Tailwind preset, global CSS, components, editor
backend/      # Express + Prisma + PostgreSQL REST API
.github/    # Issue/PR templates, CI and deploy workflows
deploy.sh   # Zero-downtime production deploy (run on the server)
```

## Getting Started

Requirements: Node.js 20.9+, pnpm 9+, PostgreSQL 15+ and Redis 7+ (or Docker)

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start PostgreSQL and Redis**

   ```bash
   docker compose up -d        # or run them natively (brew / apt)
   ```

3. **Environment variables**

   ```bash
   cp .env.example backend/.env           # keep the Backend section
   cp .env.example frontend/.env.local    # keep the Frontend section
   cp .env.example admin/.env.local       # keep the Admin app section
   ```

4. **Database setup**

   ```bash
   cd backend
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

5. **Run the app**

   ```bash
   pnpm dev    # blog on http://localhost:3000, admin on http://localhost:3001, API on the backend PORT
   ```

### Useful Commands

| Command             | Description                                         |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Start the blog, admin app and backend in watch mode |
| `pnpm dev:frontend` | Start only the blog                                 |
| `pnpm dev:admin`    | Start only the admin app                            |
| `pnpm dev:backend`  | Start only the backend                              |
| `pnpm lint`         | ESLint for every app                                |
| `pnpm test`         | Vitest suites for every app                         |
| `pnpm format`       | Format files with Prettier                          |

Backend integration tests need a migrated, disposable database: set `TEST_DATABASE_URL` and run
`pnpm --filter ./backend test`. The tests create and remove their own data; without the variable
they are skipped.

## Frontend (Next.js)

- Located in `frontend/` with `app/`, `components/`, `hooks/`, `lib/`, and `styles/`
- TailwindCSS + ShadCN UI pre-configured (see `components.json`)
- `NEXT_PUBLIC_*` variables are inlined at build time; rebuild after changing them

## Admin app (Next.js)

- Located in `admin/`: analytics, newsletter (campaigns, automation, settings), users and roles, and
  the About page portfolio. Writing and editing articles stay on the blog
- Only accounts with the ADMIN role get in; the API enforces the same rule. Emails in `ADMIN_EMAILS`
  become admins when they sign in
- Sign-in goes through the API's Google flow, which returns to the admin app when `returnTo` is on
  `ADMIN_URL`. The session cookie lives on the API domain, so the admin app must be on the same site
  (for example `admin.eightblock.dev` next to `api.eightblock.dev`) and listed in `ALLOWED_ORIGINS`
- Looks identical to the blog because both use `packages/ui` (`@eightblock/ui`) for the Tailwind
  preset, global CSS, fonts and components; change the design there

## Backend (Express API)

- Located in `backend/` with `src/routes`, `controllers`, `middleware`, `utils`, and `prisma`
- REST endpoints are mounted under `/api/*`
- `GET /healthz` is a liveness check; `GET /readyz` checks PostgreSQL and Redis (use it for uptime monitoring)
- The server validates its environment on startup and refuses to boot with a missing or weak config

## Production Deployment

Upgrading the server from the wallet release? Follow [PRODUCTION_UPGRADE.md](./PRODUCTION_UPGRADE.md)
once; after that, deploys are automatic as described below.

Every push to `main` runs CI (lint, typecheck, tests against Postgres + Redis, migration drift
check, both builds). When CI is green, the deploy workflow SSHes into the server and runs
`deploy.sh` on the exact commit that passed. You can also trigger it manually from the Actions tab.

`deploy.sh` never takes the site down:

1. Checks the server (Node 20.9+, pnpm, pm2, env files) and installs the locked dependencies
2. Builds the backend, blog and admin app into staging directories while the old version keeps serving
3. Boots the new builds on spare ports and checks them; a release that cannot start stops here,
   before the database or the live site is touched
4. Backs up the database with `pg_dump`, then applies pending migrations (`backend/scripts/migrate.sh`)
5. Swaps the new builds in and reloads PM2 instance by instance
6. Waits for `/readyz`, the homepage and the admin login page; if any fails, it restores the previous
   build automatically

Roll back to the previous build by hand with `./deploy.sh rollback` (code only, the database is untouched).

### Database migrations

Migrations run automatically during deploy. `migrate.sh` handles every state the database can be in:

- **Up to date:** nothing happens
- **Pending migrations:** takes a backup, then runs `prisma migrate deploy`
- **No migration history** (created with `prisma db push`): baselines it by marking the migrations
  that already exist as applied, then deploys the rest. The newer migrations are written to be
  safe on databases that already have their columns
- **A failed migration:** stops the deploy and prints the exact `prisma migrate resolve` command to run

Backups go to `~/backups/eightblock` (the last 14 are kept). Restore one with
`pg_restore --clean --no-owner -d "$DATABASE_URL" <file>.dump`.

### One-time server setup

Everything below lives on the server only and is never overwritten by a deploy.

1. **Packages:** Node.js 20.9+, pnpm 9, pm2 (`npm i -g pm2`), PostgreSQL client tools (`pg_dump`), git, curl
2. **Code:** clone the repo to `/var/www/eightblock`
3. **`backend/.env`:** the Backend section of `.env.example` with `NODE_ENV=production`, the real
   `DATABASE_URL`, a 64-byte `JWT_SECRET`, `SITE_URL`, `API_URL`, `ADMIN_URL=https://admin.eightblock.dev`,
   `ALLOWED_ORIGINS` (the site and admin origins), Google OAuth
   credentials, `ADMIN_EMAILS`, the Redis connection, and the VPS IP in `RATE_LIMIT_ALLOWLIST`
4. **`frontend/.env.production` and `admin/.env.production`:** both with
   `NEXT_PUBLIC_API_URL=https://api.eightblock.dev/api`, `NEXT_PUBLIC_SITE_URL=https://eightblock.dev`
   and `NEXT_PUBLIC_ADMIN_URL=https://admin.eightblock.dev`
5. **nginx:** proxy the site domain to `127.0.0.1:3006`, `admin.eightblock.dev` to `127.0.0.1:3007` and
   the API domain to `127.0.0.1:<backend PORT>`,
   with `client_max_body_size 10m` for image uploads and TLS from certbot
6. **PM2 on boot:** after the first deploy, run `pm2 startup` (follow its printed command) and `pm2 save`
7. **GitHub secrets:** `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY` (and `VPS_PORT` if not 22)
8. **Monitoring:** point an uptime monitor at `https://api.eightblock.dev/readyz`

Deploy logs are appended to `logs/deploy.log`; app logs are in `logs/` and via `pm2 logs`.

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, ShadCN UI, React Query, Tiptap editor
- **Backend:** Express 4, Prisma ORM, PostgreSQL, Redis (ioredis), Zod validation, Winston logging
- **Auth:** Google OAuth with server-side session revocation
- **Caching:** Redis for API responses with automatic invalidation
- **Tooling:** pnpm workspaces, ESLint, Prettier, Vitest, GitHub Actions (CI + deploy), PM2

## Contribution Flow

1. Fork the repository and create a feature branch.
2. Install dependencies, run `pnpm lint` and `pnpm test`.
3. Add documentation in `README.md` or `/docs` for new features.
4. Submit a PR using the provided PR template; ensure all checks pass.

Please read `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` for detailed expectations.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

MIT © eightblock contributors
