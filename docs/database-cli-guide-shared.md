# Database CLI & REPL — shared playbook

**Project-specific connection steps:** [RecipeGuru (Aurora)](./database-cli-guide-recipeguru.md) · [ReelingIt (Supabase)](./database-cli-guide-reelingit.md)

Use this alongside personal notes or scratch files. This is a **structured cheat sheet**, not a dump of ad-hoc notes. Copy **this file plus** the matching project guide into each app repo when you split.

---

## Tools at a glance

| Tool | Best for |
|------|----------|
| **`psql`** | Interactive REPL, `\` meta-commands, `EXPLAIN`, quick experiments |
| **Hosted SQL editor** (e.g. Supabase dashboard) | Browser SQL, no local `psql` install |
| **pgAdmin / DBeaver / TablePlus** | Browsing schemas, saved connections |
| **`npx prisma studio`** | Optional row browser if you use Prisma in that repo |

---

## `psql`: generic connect

**Local Postgres:**

```bash
psql -h localhost -p 5432 -U postgres -d postgres
```

**URI form (typical for cloud Postgres):**

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

Project-specific host, database name, and auth are in each **[per-app guide](./database-cli-guide.md)**.

---

## `psql`: essential meta-commands

Backslash commands are client-side (not SQL).

| Command | Meaning |
|---------|---------|
| `\?` | Help for meta-commands |
| `\h` | Help for SQL (`\h SELECT`) |
| `\q` | Quit |
| `\l` | List databases |
| `\c dbname` | Connect to database `dbname` |
| `\dn` | List schemas |
| `\dt` | List tables in search path (often `public`) |
| `\dt schema.*` | Tables in a schema |
| `\d table_name` | Describe columns, indexes, FKs |
| `\d+ table_name` | More detail (storage, description) |
| `\df` | List functions |
| `\timing on` | Show how long each query took |
| `\x on` | Expanded (“vertical”) row display |
| `\e` | Open editor for query buffer (behavior depends on `EDITOR`) |
| `\i /path/to/file.sql` | Execute a SQL file |

**Pager:** Long output uses `less`. Press **`q`** to exit.

---

## SQL patterns for exploration

**Row counts and sampling:**

```sql
SELECT COUNT(*) FROM your_table;

SELECT * FROM your_table LIMIT 5;
```

**Column list from catalog** (replace `your_table`):

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'your_table'
ORDER BY ordinal_position;
```

**Constraints / FKs on a table:**

```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.your_table'::regclass;
```

---

## Plans and performance

```sql
EXPLAIN SELECT * FROM your_table WHERE id = 1;

EXPLAIN ANALYZE SELECT * FROM your_table WHERE id = 1;
```

- **`EXPLAIN`**: planner estimate only.  
- **`EXPLAIN ANALYZE`**: runs the query—fine for **SELECT** on dev data; be careful with DML that mutates data.

---

## Safe experimentation: transactions

```sql
BEGIN;

-- UPDATE ... ; DELETE ... ; etc.

ROLLBACK;   -- discard
-- COMMIT;  -- keep (only when you mean it)
```

---

## Optional: local Postgres in Docker (throwaway dev DB)

For a quick local instance (separate from Aurora or Supabase):

```bash
docker run -e POSTGRES_PASSWORD=postgres --name=recipeguru-pg -p 5432:5432 -d postgres:16
```

```bash
docker exec -it recipeguru-pg psql -U postgres
```

Create a database (e.g. `CREATE DATABASE recipeguru;`), then `\c recipeguru` and `\dt`. Stop/remove the container when done to free port `5432`.

---

## Hygiene

- Do not commit **passwords** or full connection URLs; use `.env.local` (gitignored) and host secrets.  
- Prefer a **read-only** DB user for exploration when available.  
- Keep **`scratch-*`** as your lab notebook; keep these guides as the reusable playbook.
