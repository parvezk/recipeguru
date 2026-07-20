# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Early scaffolding. The `apps/` workspaces (`apps/api`, `apps/web`) do not exist yet — they will be created as the first vertical slice lands. The authoritative product spec is [`spec-recipeguru.md`](./spec-recipeguru.md).

## Architecture

```
Browser → Next.js (App Router) → Express API → Aurora PostgreSQL
```

- Next.js calls Express via `fetch` using `NEXT_PUBLIC_API_URL` — the browser never holds DB credentials.
- Express owns all DB access using an Aurora IAM/OIDC pool (`pg` + `@aws-sdk/rds-signer` + `@vercel/functions`).
- Drizzle ORM wraps that pool; all queries go through typed Drizzle calls or `sql` templates — no ad-hoc string SQL in route handlers.
- Migrations are managed with `drizzle-kit` and committed to git.

## Repository layout (target)

```
recipeguru/
  apps/
    api/       # Express + pg + Drizzle + RDS IAM pool
    web/       # Next.js App Router + Tailwind + shadcn/ui
  docs/        # DB CLI guides
```

## Dev commands (once apps/ are scaffolded)

```bash
# API (terminal 1)
cd apps/api
vercel link && vercel env pull   # one-time: pull Aurora env into .env.local
npm run dev                      # Express on http://localhost:4001

# Web (terminal 2)
cd apps/web
npm run dev                      # Next.js on http://localhost:3000

# Database migrations
cd apps/api
npx drizzle-kit generate         # generate migration from schema changes
npx drizzle-kit migrate          # apply pending migrations
npx drizzle-kit studio           # optional row browser
```

## Environment variables

**`apps/api`** (from `vercel env pull`):
- `AWS_ROLE_ARN`, `AWS_REGION`
- `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`
- `VERCEL_OIDC_TOKEN` (on Vercel), `CORS_ORIGIN`, `PORT` (default `4001` locally)

**`apps/web`**:
- `NEXT_PUBLIC_API_URL` — base URL of the Express API (e.g. `http://localhost:4001`)

**Optional observability**:
- Sentry DSNs (separate for Next and Node)
- `NEXT_PUBLIC_POSTHOG_KEY` and PostHog host (web)

## Data model

Core tables: `recipes`, `recipes_photos`, `ingredients`, `recipe_ingredients`.

## API contracts

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/recipes/search` | List recipes: `recipe_id`, `title`, poster `url` |
| GET | `/api/recipes/:id` | Single recipe: `title`, `body`, `photos[]`, `ingredients[]` |
| GET | `/api/ingredients` (backlog) | By type or paginated search (5 rows/page + `total_count`) |

## Key tech choices

| Concern | Choice |
|---------|--------|
| Validation | Zod — query/body params and `process.env` in the API |
| HTTP (web → api) | Native `fetch` |
| Quality | ESLint + Prettier (or Biome); TypeScript `strict` |
| Tests | Vitest for units |
| Logging | `pino` / `pino-http` on Express |

## Local Postgres (dev alternative to Aurora)

```bash
docker run -e POSTGRES_PASSWORD=postgres --name=recipeguru-pg -p 5432:5432 -d postgres:16
docker exec -it recipeguru-pg psql -U postgres
# then: CREATE DATABASE recipeguru; \c recipeguru
```

See [`docs/database-cli-guide-recipeguru.md`](./docs/database-cli-guide-recipeguru.md) and [`docs/database-cli-guide-shared.md`](./docs/database-cli-guide-shared.md) for psql meta-commands, `EXPLAIN`, and safe experimentation patterns.

## Non-goals (v1)

- User auth
- Mixing this DB with any other project's dataset — Aurora instance is isolated to RecipeGuru only
