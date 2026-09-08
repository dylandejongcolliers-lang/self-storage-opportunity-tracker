# Deploy

## Phase 1 — prove hosting (do this now)

### 1. Create the GitHub repo and push

```bash
# from the project root
git remote add origin https://github.com/<your-username>/self-storage-opportunity-tracker.git
git push -u origin main
```

(Create the empty repo first at https://github.com/new — name it
`self-storage-opportunity-tracker`, keep it **Private**, don't add a README/.gitignore.)

### 2. Import into Vercel

1. Go to https://vercel.com/new and pick the repo.
2. Framework preset: **Next.js** (auto-detected). Leave build/output settings default.
3. No environment variables are needed for Phase 1.
4. Click **Deploy**. You should get a live URL showing the branded landing page.

Once that URL loads, Phase 1 is done and hosting is proven.

## Later phases — environment variables

These get added in Vercel (Project → Settings → Environment Variables) as we build:

| Variable          | Added in | Purpose                                                        |
| ----------------- | -------- | ------------------------------------------------------------- |
| `DATABASE_URL`    | Phase 2  | Neon pooled connection string (for the app at runtime)       |
| `DIRECT_URL`      | Phase 2  | Neon direct connection string (for Prisma migrations)        |
| `APP_PASSWORD`    | Phase 2  | Shared password for the internal `/dashboard` pages          |
| `AUTH_SECRET`     | Phase 2  | Random string used to sign the session cookie                |

A local `.env` (git-ignored) will hold the same values for development.
