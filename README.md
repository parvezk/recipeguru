# RecipeGuru

A full-stack recipe discovery app backed by Amazon Aurora PostgreSQL.

> See [`spec+design.md`](./spec+design.md) for the full product spec and architecture diagrams.

## Stack

| Layer            | Choice                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Database         | **Amazon Aurora PostgreSQL** via [Vercel Marketplace AWS integration](https://vercel.com/docs/integrations) |
| Schema & queries | **[Drizzle ORM](https://orm.drizzle.team/)** + `drizzle-kit` for migrations                                |
| API              | **Node.js + Express** (`pg` pool + `drizzle-orm/node-postgres`)                                            |
| Web              | **Next.js** (App Router), **Tailwind CSS**, **shadcn/ui**                                                  |

## Architecture & Authentication

`Browser → Next.js → Express API → Aurora PostgreSQL`

- **Browser** never holds DB credentials; **Next.js** calls **Express** via `fetch` (`NEXT_PUBLIC_API_URL`).
- **Express** owns the `pg` connection pool and Drizzle instance.
- **Passwordless DB Auth (OIDC + RDS IAM):**
  1. **Per credential lifetime (~1 hr):** Vercel Function exchanges `VERCEL_OIDC_TOKEN` with **AWS STS** (`AssumeRoleWithWebIdentity`) for temporary AWS credentials.
  2. **Per DB connection (~15 min token cache):** `@aws-sdk/rds-signer` locally signs a short-lived RDS auth token used as the Postgres password; Aurora verifies it via IAM (`rds-db:connect`). No long-lived database secrets are stored in environment variables.

## Getting Started

### 1. Install & pull environment

```bash
npm install
vercel link && vercel env pull   # writes .env.local
```

Required environment variables (see [Vercel Aurora guide](https://vercel.com/kb/guide/connect-next-js-to-amazon-aurora-postgresql-using-vercel-marketplace)):

- **API / DB:** `AWS_ROLE_ARN`, `AWS_REGION`, `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `VERCEL_OIDC_TOKEN` ( plus `CORS_ORIGIN`, `PORT`)
- **Web:** `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4001`)
- **Optional:** Sentry DSNs, `NEXT_PUBLIC_POSTHOG_KEY`

### 2. Database & migrations

Core tables: `recipes`, `recipes_photos`, `ingredients`, `recipe_ingredients`.

```bash
npm run db:test          # verify Aurora OIDC/IAM connection
npm run db:setup         # initialize schema & seed data
npm run db:studio        # inspect database rows
npx drizzle-kit generate # generate migration SQL from schema
npx drizzle-kit migrate  # apply migrations
```

See [`docs/database-cli-guide-recipeguru.md`](./docs/database-cli-guide-recipeguru.md) and [`docs/database-cli-guide-shared.md`](./docs/database-cli-guide-shared.md) for CLI and `psql` usage.

### 3. Run locally

```bash
npm run dev              # Next.js on http://localhost:3000
```

Once the `apps/api` and `apps/web` workspaces are split:

```bash
cd apps/api && npm run dev   # Express on http://localhost:4001
cd apps/web && npm run dev   # Next.js on http://localhost:3000
```

## API Routes

| Method | Path                  | Purpose                                                     |
| ------ | --------------------- | ----------------------------------------------------------- |
| GET    | `/api/recipes/search` | List recipes (`recipe_id`, `title`, poster `url`)           |
| GET    | `/api/recipes/:id`    | Single recipe (`title`, `body`, `photos[]`, `ingredients[]`) |
| GET    | `/api/ingredients`    | *(Backlog)* Filter by type or paginated search (5/page + `total_count`) |

## License

Use the license file at the repository root once added. Attribute third-party code per its own license when vendored or copied.

