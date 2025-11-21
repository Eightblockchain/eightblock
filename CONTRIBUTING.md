# Contributing to eightblock

Thanks for helping build the Cardano + blockchain education hub! Contributions of all sizes are welcome—from typo fixes to major features. This document outlines the process to keep everything consistent and beginner-friendly.

## Ground Rules

- Follow our [Code of Conduct](CODE_OF_CONDUCT.md).
- Use pnpm for all install and script commands.
- Write TypeScript for both frontend and backend (no `any` unless justified with comments).
- Keep pull requests focused. Open multiple PRs rather than one gigantic change.
- Document new features (README, MDX content, or inline docs) and add/update tests.

## Development Workflow

1. **Fork & branch**
   ```bash
   git checkout -b feat/amazing-idea
   ```
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Set up environment**
   - Copy `.env.example` to `.env` at the repo root and adjust values.
   - Run `pnpm --filter backend prisma migrate dev` to sync the database.
4. **Run services**
   - Backend: `pnpm --filter backend dev`
   - Frontend: `pnpm --filter frontend dev`
5. **Test & lint**
   ```bash
   pnpm lint
   pnpm test
   ```
6. **Submit PR** using the template under `.github/pull_request_template.md`.

## Commit Style

- Use conventional commit prefixes when possible (`feat:`, `fix:`, `docs:`, `chore:`...)
- Reference issues with `Fixes #123` when applicable.

## Code Quality

- Favor composition and reusable utilities/components.
- Add logging for backend flows that touch external systems.
- Validate all incoming API payloads with Zod schemas.
- Use Prisma migrations instead of editing the database manually.
- Keep Tailwind classes readable (group them logically and avoid duplicates).

## Testing Expectations

- Frontend components: unit tests via Vitest/React Testing Library when logic-heavy.
- Backend routes/controllers: Vitest + Supertest.
- Run `pnpm test` before opening a PR.

## Need Help?

- Open a discussion or draft PR early if you want feedback.
- Ping maintainers in the PR description if something blocks you.

Happy building! 🚀
