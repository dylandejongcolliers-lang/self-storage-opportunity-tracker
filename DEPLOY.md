# Deploy

The app auto-deploys to Vercel on every push to `main`.
Live: https://self-storage-opportunity-tracker.vercel.app/

## Phase 2 — connect the database and password

The `/dashboard` pages need four environment variables. Add them in
**Vercel → Project → Settings → Environment Variables** (set each for
Production, Preview, and Development), then redeploy.

| Variable       | Value                                                                 |
| -------------- | ------------------------------------------------------------------- |
| `DATABASE_URL` | Neon **pooled** connection string (host has `-pooler`), with `?sslmode=require&pgbouncer=true` |
| `DIRECT_URL`   | Neon **direct** connection string (same, without `-pooler`), with `?sslmode=require` |
| `APP_PASSWORD` | The shared team password for signing in                            |
| `AUTH_SECRET`  | A random 40+ character string (cookie signing)                     |

Use the same values that are in your local `.env` (the `AUTH_SECRET` there was
generated for you; pick a real `APP_PASSWORD` before going live).

### How migrations reach production

`package.json` build script is:

```
prisma generate && prisma migrate deploy && next build
```

So every deploy applies any new database migrations automatically. If the
database can't be reached during a build, the build fails on purpose rather
than shipping a broken app.

### Local development

```bash
npm install          # also runs `prisma generate`
npm run db:migrate    # create/apply migrations against your Neon dev branch
npm run dev           # http://localhost:3000
```

`npm run db:studio` opens Prisma Studio to browse/edit rows directly.

## Later phases — no new setup expected

Phases 3–5 add more tables; each will ship as a new Prisma migration that the
build applies on deploy. No new environment variables are anticipated until we
add automated ingestion.
