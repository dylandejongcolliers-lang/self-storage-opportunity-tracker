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
| `INGEST_API_TOKEN` | Bearer token for `POST /api/ingest/listings` (see below). Until this is set, the endpoint returns 503. |

Use the same values that are in your local `.env` (the `AUTH_SECRET` and
`INGEST_API_TOKEN` there were generated for you; pick a real `APP_PASSWORD`
before going live).

## Ingestion API

`POST /api/ingest/listings` adds listings programmatically (same fields as the
Bulk Add CSV). Auth is a single bearer token:

```bash
curl -X POST https://self-storage-opportunity-tracker.vercel.app/api/ingest/listings \
  -H "Authorization: Bearer $INGEST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"propertyName":"Example Storage","city":"San Jose","state":"CA","market":"Bay Area","askingPrice":4200000}]'
```

- Body is a JSON **array** of listing objects (max 500 per request).
- `stage` is always forced to `New` server-side — a stage in the payload is ignored.
- `market` matches a market name or slug; omit it and pass `state` to auto-assign.
  If nothing matches, the listing is still created with no market and lands in
  the **Review queue**.
- Set `"flaggedForReview": true` (with optional `"flagReason"`) to route a row
  into the Review queue regardless of market.
- Duplicate rows (same normalized property name + city + state as an existing
  listing) are returned as `skipped_duplicate`, not created.
- The response has a `summary` and a per-row `results` array with one of:
  `created`, `skipped_duplicate`, `needs_market_assignment`, `rejected` (+ reason).

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

## New migrations

Each schema change ships as a Prisma migration that `prisma migrate deploy`
applies during the build. New env vars (when added) are listed in the table
above; keep local `.env` and Vercel in sync.
