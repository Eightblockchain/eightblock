# eightblock

Open-source platform for the Cardano community featuring a collaborative blog, educational resources, contributor-friendly processes, and a modern Jamstack + API architecture. This repository contains both the public-facing Next.js site and the Express + Prisma backend that powers content workflows.

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

### Quick Start (Recommended - With Docker)

Requirements: Node.js 20+, pnpm 9+, Docker Desktop

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env
   # Edit .env if needed - default values work with Docker setup
   ```

3. **Start everything** (PostgreSQL + Redis + Backend + Frontend)

   ```bash
   pnpm dev
   ```

   This single command will:
   - Start PostgreSQL and Redis in Docker containers
   - Run database migrations automatically
   - Start the backend API (port 5000)
   - Start the frontend (port 3000)

4. **Seed the database** (first time only)

   ```bash
   cd backend
   pnpm prisma db seed
   ```

5. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - API Docs: http://localhost:5000/api/docs

### Manual Setup (Without Docker)

Requirements: Node.js 20+, pnpm 9+, PostgreSQL 15+, Redis 7+

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start PostgreSQL and Redis manually**

   ```bash
   # macOS
   brew install postgresql@15 redis
   brew services start postgresql@15
   brew services start redis

   # Ubuntu
   sudo apt install postgresql redis-server
   sudo systemctl start postgresql redis-server
   ```

3. **Environment variables**

   ```bash
   cp .env.example .env
   # Update DATABASE_URL with your PostgreSQL credentials
   ```

4. **Database setup**

   ```bash
   cd backend
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

5. **Run the app**
   ```bash
   pnpm dev  # Starts frontend + backend (but not DB/Redis)
   ```

### Useful Commands

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `pnpm dev`            | Start all services (Docker + Frontend + Backend) |
| `pnpm services:start` | Start only Docker services (PostgreSQL + Redis)  |
| `pnpm services:stop`  | Stop Docker services                             |
| `pnpm services:logs`  | View Docker service logs                         |
| `pnpm dev:frontend`   | Start only the frontend                          |
| `pnpm dev:backend`    | Start only the backend                           |

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
