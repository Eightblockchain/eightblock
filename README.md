# eightblock

Open-source blockchain and Cardano education hub featuring a collaborative blog, contributor-friendly processes, and a modern Jamstack + API architecture. This repository contains both the public-facing Next.js site and the Express + Prisma backend that powers content workflows.

## Features

- **Education-first blog** with MDX-powered articles, categories, tags, and featured content
- **Infinite scroll** with React Query for seamless content browsing
- **Redis caching** for blazing-fast performance and reduced database load
- **Community engagement** via likes, threaded comments, and newsletter subscriptions
- **Wallet-based authentication** using Cardano wallets (no email/password required)
- **Admin experience** for managing articles, metadata, and reader interactions
- **Stateless REST API** with OpenAPI docs, Prisma ORM, and PostgreSQL storage
- **Open-source readiness** including contribution guidelines, issue/PR templates, linting, tests, and CI

## Monorepo Structure

```
frontend/   # Next.js + TailwindCSS + MDX + ShadCN UI
backend/    # Express + Prisma + PostgreSQL REST API
.github/    # Issue/PR templates and CI workflows
```

## Getting Started

Requirements: Node.js 20+, pnpm 9+, PostgreSQL 15+, Redis 7+ (optional), and OpenSSL for JWT signing.

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Environment variables**
   - Copy `.env.example` to `.env` at the repo root and fill in database + auth secrets (see comments inside the sample file).
   - Frontend uses `NEXT_PUBLIC_API_URL`; backend uses `DATABASE_URL`, `JWT_SECRET`, and optional NextAuth provider keys.
   - For Redis caching, set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` (see `REDIS_SETUP.md`)
3. **Redis setup (optional but recommended)**

   ```bash
   # macOS
   brew install redis && brew services start redis

   # Docker
   docker run -d --name redis -p 6379:6379 redis:latest

   # See REDIS_SETUP.md for detailed instructions
   ```

4. **Database setup**
   ```bash
   cd backend
   pnpm prisma migrate dev
   pnpm prisma db seed # (optional) adds sample content
   ```
5. **Run the backend API**
   ```bash
   cd backend
   pnpm dev
   ```
6. **Run the frontend**

   ```bash
   cd frontend
   pnpm dev
   ```

   ## Frontend (Next.js)
   - Located in `frontend/` with `app/`, `components/`, `lib/`, `styles/`, and MDX `content/`
   - TailwindCSS + ShadCN UI pre-configured (see `components.json`)
   - Contentlayer ingests MDX posts (run `pnpm --filter frontend dev` for hot reload)
   - NextAuth route at `app/api/auth/[...nextauth]` proxies to backend JWT login
   - Sample article lives at `content/welcome-to-eightblock.mdx`

   ## Backend (Express API)
   - Located in `backend/` with `src/routes`, `controllers`, `middleware`, `utils`, and `prisma`
   - Run `pnpm --filter backend dev` to start the server on port 4000
   - Prisma schema models users, articles, comments, likes, tags, and subscriptions
   - Swagger docs exposed at `/api/docs`; REST endpoints mounted under `/api/*`
   - Winston-based logger, Zod validation middleware, and JWT auth helpers included

## Scripts

Root scripts proxy to workspaces via pnpm:

| Script        | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `pnpm lint`   | Runs ESLint + TypeScript checks for frontend and backend          |
| `pnpm test`   | Executes frontend Playwright/unit tests and backend Vitest suites |
| `pnpm format` | Formats files via Prettier                                        |

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, ShadCN UI, React Query, Contentlayer MDX
- **Backend:** Express 5, Prisma ORM, PostgreSQL, Redis (ioredis), Zod validation, Winston logging, Swagger UI
- **Auth:** Cardano wallet-based authentication (MeshSDK)
- **Caching:** Redis for API responses with automatic invalidation
- **Tooling:** pnpm workspaces, ESLint, Prettier, Husky, GitHub Actions (lint & tests)

## Contribution Flow

1. Fork the repository and create a feature branch.
2. Install dependencies, run `pnpm lint`, `pnpm test`, and add/update MDX content if necessary.
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
