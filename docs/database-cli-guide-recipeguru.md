# RecipeGuru — DB CLI & REPL (Aurora)

**Read first:** [shared playbook](./database-cli-guide-shared.md) (`psql` meta-commands, `EXPLAIN`, transactions, optional local Postgres in Docker).

**Product spec:** [spec-recipeguru.md](./spec-recipeguru.md)

---

## Where this database lives

RecipeGuru uses **Amazon Aurora PostgreSQL** provisioned via **Vercel Marketplace**, with **OIDC + RDS IAM** for the app on Vercel (see [Connect Next.js to Amazon Aurora PostgreSQL using Vercel Marketplace](https://vercel.com/kb/guide/connect-next-js-to-amazon-aurora-postgresql-using-vercel-marketplace)).

**CLI from your laptop is separate from that flow.** IAM token auth in Node (`@aws-sdk/rds-signer`) matches the guide; ad-hoc `psql` often uses one of:

- A **master/user password** (if your Aurora user has one and network path allows it), or  
- **AWS RDS IAM DB auth** from a machine that can assume the right IAM role (advanced), or  
- A **jump host / VPN / bastion** your org requires.

Document whatever **you** end up using in this repo’s `README` so future-you is not guessing.

---

## Typical connection shape (`psql`)

Use values from your environment (after `vercel env pull` or AWS console), for example:

```bash
psql "postgresql://USER@HOST:5432/DATABASE?sslmode=require"
```

Or discrete flags:

```bash
psql -h "$PGHOST" -p "${PGPORT:-5432}" -U "$PGUSER" -d "$PGDATABASE" "sslmode=require"
```

Adjust **SSL** to match your cluster (stricter CA verification in production).

---

## What to explore

RecipeGuru’s PostgreSQL schema includes tables such as:

- `recipes`, `recipes_photos`, `ingredients`, `recipe_ingredients`

After connecting:

```sql
\dt
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM ingredients;
```

Use `\d recipes`, `\d recipe_ingredients`, etc., from the [shared guide](./database-cli-guide-shared.md).

---

## Optional GUI

If you use **pgAdmin**, **DBeaver**, or **TablePlus**, create a saved connection using the same host/port/user/database/SSL as above—never commit credentials into the repo.
