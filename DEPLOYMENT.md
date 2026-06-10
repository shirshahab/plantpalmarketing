# PlantPal Marketing OS — Deployment Guide (Phase 23)

Deploy the private HQ to **Vercel** with **Supabase** as the production database. This guide covers GitHub, Vercel, environment variables, password protection, mobile HQ, and post-deploy verification.

---

## Prerequisites

| Tool | Purpose |
|------|---------|
| [Git](https://git-scm.com/) | Version control |
| [GitHub](https://github.com) account | Remote repository |
| [Vercel](https://vercel.com) account | Hosting + Cron |
| [Supabase](https://supabase.com) project | Production database |

Optional CLIs (install if you prefer terminal deploy):

```powershell
# GitHub CLI — https://cli.github.com/
winget install GitHub.cli

# Vercel CLI — https://vercel.com/docs/cli
npm i -g vercel
```

---

## Part 1 — GitHub setup

### 1.1 Initialize the repository (if not already)

```powershell
cd C:\Users\shirm\OneDrive\Desktop\plantpal-marketing-os
git init
git add .
git commit -m "Prepare PlantPal Marketing OS for Vercel deployment"
```

### 1.2 Create the GitHub repository

**Option A — GitHub website**

1. Go to [github.com/new](https://github.com/new)
2. Name: `plantpal-marketing-os` (or your preference)
3. Visibility: **Private** (recommended — internal marketing OS)
4. Do **not** add README, .gitignore, or license (already in project)
5. Copy the remote URL

```powershell
git remote add origin https://github.com/YOUR_USERNAME/plantpal-marketing-os.git
git branch -M main
git push -u origin main
```

**Option B — GitHub CLI**

```powershell
gh auth login
gh repo create plantpal-marketing-os --private --source=. --remote=origin --push
```

### 1.3 What must never be committed

- `.env.local` — contains secrets (already in `.gitignore`)
- API keys, passwords, or `CRON_SECRET`
- `node_modules/`, `.next/`

---

## Part 2 — Supabase production connection

### 2.1 Use your Supabase project

You can use your **existing dev Supabase project** for production (simplest) or create a separate production project later.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Project Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Only URL + anon key are safe with the `NEXT_PUBLIC_` prefix. Never expose the **service role** key to Vercel client env or the browser.

### 2.2 Run all SQL migrations

In **SQL Editor**, run migrations in numeric order from `supabase/migrations/`:

| Range | What it adds |
|-------|----------------|
| `001`–`002` | Core marketing tables + seed |
| `003`–`037` | Agents, HQ, integrations, daily reports, worker cron |

**Minimum for full HQ (if starting fresh):** run `001` through `037` in order.

After each migration (or batch), confirm no errors. Migrations `035`–`037` end with:

```sql
NOTIFY pgrst, 'reload schema';
```

See `supabase/MIGRATIONS.md` for the full ordered list.

### 2.3 Verify tables in production

In **Table Editor**, confirm these exist:

- Core: `content_ideas`, `social_posts`, `approval_queue`, …
- HQ: `agent_messages`, `agent_tasks`, `agent_events`
- Workers: `agent_schedules`, `agent_runs`, `agent_health`
- Reports: `daily_reports`, `workflow_runs`

---

## Part 3 — Environment variables

Copy `.env.local.example` as reference. Set the **same keys** in Vercel.

### 3.1 Required for production

| Variable | Where to set | Notes |
|----------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel → Production | Public-safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel → Production | Public-safe |
| `APP_PASSWORD` | Vercel → Production | **Founder login password** — server-only |
| `CRON_SECRET` | Vercel → Production | Random 32+ char string — server-only |
| `OPENAI_API_KEY` | Vercel → Production | Required for AI agents & daily report |

Generate secrets locally:

```powershell
node scripts/generate-secrets.mjs
```

### 3.2 Recommended

| Variable | Purpose |
|----------|---------|
| `REQUIRE_APP_PASSWORD=true` | Blocks deploy if `APP_PASSWORD` missing (503) |
| `AUTH_SECRET` | Optional separate cookie signing secret |

### 3.3 Optional integrations

Set only what you use — agents degrade gracefully without them:

`OPENWEATHER_API_KEY`, `PLANTNET_API_KEY`, `PERENUAL_API_KEY`, `SERPAPI_KEY`, `X_BEARER_TOKEN`, `X_API_KEY`, `X_API_SECRET`

### 3.4 Vercel env setup steps

1. Vercel → **Project → Settings → Environment Variables**
2. Add each variable for **Production** (and Preview if you want staging)
3. **Redeploy** after adding or changing env vars

### 3.5 Never do this

- Do **not** prefix secrets with `NEXT_PUBLIC_`
- Do **not** commit `.env.local`
- Do **not** put `CRON_SECRET` or `APP_PASSWORD` in client code

---

## Part 4 — Vercel setup

### 4.1 Import from GitHub

1. [vercel.com/new](https://vercel.com/new)
2. **Import** your `plantpal-marketing-os` repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (project root)
5. Build command: `npm run build` (default)
6. Output: Next.js default
7. Add environment variables (Part 3) **before** first deploy, or immediately after

### 4.2 Cron jobs

`vercel.json` already configures hourly agent workers:

```json
{
  "crons": [{ "path": "/api/cron/agents", "schedule": "0 * * * *" }]
}
```

Requirements:

- `CRON_SECRET` must be set in Vercel env
- **Vercel Pro** (or higher) is required for Cron on production — Hobby has limited cron
- Cron route: `GET/POST /api/cron/agents` with `Authorization: Bearer <CRON_SECRET>`

### 4.3 Security headers

`vercel.json` sets `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` on all routes.

### 4.4 Deploy

**Dashboard:** Vercel → Deployments → Redeploy

**CLI:**

```powershell
cd C:\Users\shirm\OneDrive\Desktop\plantpal-marketing-os
vercel login
vercel link
vercel env pull .env.vercel.local   # optional — preview pulled env
vercel --prod
```

---

## Part 5 — Password protection

The app uses **middleware-based app password** (not Supabase Auth).

| Env | Behavior |
|-----|----------|
| `APP_PASSWORD` set | All routes except `/login`, `/api/health`, `/api/cron/*` require login |
| `APP_PASSWORD` unset (dev) | Open access locally |
| `REQUIRE_APP_PASSWORD=true` + no password in production | Returns **503** |

### Flow

1. User visits `https://your-app.vercel.app`
2. Redirected to `/login`
3. Enters `APP_PASSWORD` value
4. Session cookie (`plantpal_session`) set for 30 days

### Public endpoints (no login)

- `/api/health` — deploy verification
- `/api/cron/agents` — Vercel Cron only (requires `CRON_SECRET`)

---

## Part 6 — Mobile responsive HQ

HQ is optimized for phone and tablet:

| Feature | Mobile behavior |
|---------|-----------------|
| **Garden / Activity tabs** | Toggle full-width panels (`plantpal-hq.tsx`) |
| **Living world** | `min-h-[48dvh]`, touch pan, pinch-zoom via controls |
| **World controls** | Bottom bar — zoom, sound, season badge |
| **Activity feed** | Full-width when Activity tab selected |
| **Agent drawer** | Overlay drawer on tap |
| **Viewport** | `device-width`, `theme-color: #2d6a4f` |

**Test on device:** open production URL on iPhone/Android → sign in → switch Garden/Activity tabs → tap an agent.

---

## Part 7 — Deployment checklist

Use this before and after go-live.

### Pre-deploy

- [ ] All Supabase migrations `001`–`037` applied without errors
- [ ] `npm run build` passes locally
- [ ] `npm run verify:production` passes (with production env in Vercel, run after deploy)
- [ ] `.env.local` is **not** committed
- [ ] GitHub repo is **private**
- [ ] `APP_PASSWORD` chosen (strong, unique)
- [ ] `CRON_SECRET` generated (32+ random chars)
- [ ] `OPENAI_API_KEY` set in Vercel
- [ ] Supabase URL + anon key set in Vercel

### Vercel project

- [ ] Repo imported and linked
- [ ] Production env vars saved
- [ ] First deploy succeeded (green)
- [ ] Custom domain added (optional)

### Post-deploy verification

- [ ] `GET https://YOUR_APP.vercel.app/api/health` returns `"ok": true`
- [ ] Health checks: `auth: true`, `cron: true`, `supabase: true`
- [ ] `/login` loads; wrong password rejected
- [ ] Correct password → HQ loads with living garden
- [ ] Mobile: Garden/Activity tabs work
- [ ] `/agent-operations` shows agent schedules
- [ ] `/daily-report` page loads
- [ ] Cron: after 1 hour, check Vercel → Logs or `/agent-operations` for run history

### Safety (must remain true)

- [ ] `autoPostDisabled: true` on `/api/health`
- [ ] `approvalGatesEnforced: true` on `/api/health`
- [ ] No secrets in `NEXT_PUBLIC_*` vars
- [ ] `robots: noindex` — not indexed by search engines

---

## Part 8 — Troubleshooting

### Build fails on Vercel

| Symptom | Fix |
|---------|-----|
| TypeScript errors | Run `npm run build` locally; fix errors; push |
| Missing module | Ensure `package.json` committed; run `npm install` locally |
| Env needed at build time | Only `NEXT_PUBLIC_*` are available at build — keep secrets server-only |

### `503` on every page

- `REQUIRE_APP_PASSWORD=true` but `APP_PASSWORD` not set in Vercel
- **Fix:** Add `APP_PASSWORD` or remove `REQUIRE_APP_PASSWORD`

### Login loop / instant redirect to login

- `APP_PASSWORD` in Vercel does not match what you type
- Cookie blocked (rare) — try another browser
- **Fix:** Redeploy after changing `APP_PASSWORD`; clear cookies for the domain

### `/api/health` shows warnings

| Warning | Fix |
|---------|-----|
| `APP_PASSWORD not set` | Add `APP_PASSWORD` to Vercel Production env |
| `CRON_SECRET not set` | Add `CRON_SECRET` |
| `Supabase not configured` | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `client-side secret exposure` | Remove any `NEXT_PUBLIC_` var that contains API keys |

### Supabase errors in app

| Symptom | Fix |
|---------|-----|
| `relation does not exist` | Run missing migrations in SQL Editor |
| Empty HQ / demo data | Run seed migrations (`002`, `006`, etc.) |
| Schema cache stale | Re-run migration `NOTIFY pgrst, 'reload schema'` or restart Supabase API |

### Cron agents not running

| Symptom | Fix |
|---------|-----|
| 401 on `/api/cron/agents` | `CRON_SECRET` mismatch — redeploy after env change |
| Cron never fires | Vercel Pro required for production cron; check **Settings → Cron Jobs** |
| Agents skip | Check `/agent-operations` — schedules use UTC (`next_run_at`) |
| Timeout | Agent batch has `maxDuration: 300`; reduce per-agent work if needed |

### Mobile HQ issues

| Symptom | Fix |
|---------|-----|
| Can't scroll page | Garden uses `touch-none` for pan — use Activity tab for feed scroll |
| Zoom stuck | Tap **Reset view** (maximize icon) in world controls |
| Drawer won't close | Tap outside or use close button on drawer |

### OpenAI / agent errors

- Verify `OPENAI_API_KEY` in Vercel (not `NEXT_PUBLIC_`)
- Check Vercel **Functions** logs for the failing route
- Daily report and agent workers need valid OpenAI key

### Still stuck?

1. Vercel → Project → **Deployments** → latest → **Functions** / **Build** logs
2. Supabase → **Logs** → API / Postgres
3. Local repro: `npm run build && npm run start` with production-like `.env.local`

---

## Quick reference — URLs after deploy

| URL | Purpose |
|-----|---------|
| `/` | PlantPal HQ (living garden) |
| `/login` | Founder password gate |
| `/api/health` | Deploy & safety verification |
| `/agent-operations` | Background worker status |
| `/daily-report` | Executive daily report |

---

## Local production smoke test

Before pushing:

```powershell
npm run build
npm run start
# Visit http://localhost:3000/api/health
# Visit http://localhost:3000/login (with APP_PASSWORD in .env.local)
```

---

*PlantPal Marketing OS — human approval required for all outbound actions. No auto-posting.*
