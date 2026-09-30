# Security

## Reporting a vulnerability

Please do not open a public issue for security problems. Report them privately through
[GitHub security advisories](https://github.com/Eightblockchain/eightblock/security/advisories/new),
with steps to reproduce and the impact you expect. You should get a reply within a few days, and a
fix or a plan once the report is confirmed. Only the latest `main` branch (what runs on
eightblock.dev) is supported.

## How the platform is protected

**Sign-in and sessions**

- Sign-in is Google OAuth only. The OAuth state is kept in a short-lived httpOnly cookie and checked on the callback.
- The session is a signed JWT in the httpOnly `auth_token` cookie (Secure in production, SameSite=Lax, 7 days). JavaScript cannot read it.
- Signing out revokes the token in Redis. Tokens can also be revoked for every session of a user. While Redis is unreachable, sessions are rejected rather than trusted.
- Accounts listed in `ADMIN_EMAILS` become admins on sign-in. Only admins can use the admin app, and every admin endpoint checks the role on the server.

**Requests**

- Every state-changing request needs a matching `csrf_token` cookie and header (double submit), plus an `Origin` or `Referer` from `ALLOWED_ORIGINS`.
- CORS only allows the origins in `ALLOWED_ORIGINS`, with credentials.
- Rate limits are kept per IP in Redis and shared across API instances. They cover the API as a whole, and set tighter limits on sign-in, claps, analytics and newsletter signups.
- Request bodies are validated with zod.

**Content**

- Article HTML is sanitised with DOMPurify wherever it is rendered, and structured data is escaped before it is written into pages.
- Uploads are limited in size and type, re-encoded with sharp and served with `nosniff`.
- The API sets helmet's security headers, including HSTS and a strict CSP. The blog and admin app send framing, `nosniff`, referrer and HSTS headers, and the admin app is `noindex`.

**Data**

- Analytics stores no IP addresses. Visitors are an anonymous first-party cookie id, and referrers are reduced to a host name.
- Newsletter signups use double opt-in. Unsubscribe links are signed tokens, and the Resend webhook is verified with its signing secret.
- Secrets live only in `backend/.env` on the server. The API refuses to start in production without a strong `JWT_SECRET` and the required URLs (see `backend/src/config/env.ts`).
