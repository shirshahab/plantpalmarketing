# PlantPal Marketing OS — Supabase Auth

Protect HQ at `hq.getplantpal.com` so only approved team members can sign in.

---

## 1. Supabase Auth setup

### Enable email/password

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers** → **Email**
3. Enable **Email provider**
4. **Authentication** → **Settings**:
   - Turn **OFF** “Enable sign ups” (invite-only / admin-created users)
   - Confirm email can stay on or off (for internal HQ, off is fine for faster first login)

### Create your first admin user

**Option A — Dashboard (recommended)**

1. **Authentication** → **Users** → **Add user**
2. Email: `you@getplantpal.com` (your work email)
3. Password: strong unique password
4. Check **Auto Confirm User** if email confirmation is enabled
5. Click **Create user**

**Option B — SQL Editor**

```sql
-- Only if you prefer SQL; Dashboard is easier
-- Use Supabase Dashboard → Add user instead
```

### Site URL (required for production)

1. **Authentication** → **URL Configuration**
2. **Site URL:** `https://hq.getplantpal.com`
3. **Redirect URLs:** add:
   - `https://hq.getplantpal.com/**`
   - `http://localhost:3000/**` (local dev)

---

## 2. Environment variables

Only public Supabase keys use `NEXT_PUBLIC_`. Never expose service role or API keys.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon public key |
| `CRON_SECRET` | Yes (prod) | Cron route auth — not Supabase Auth |
| `OPENAI_API_KEY` | Yes | Server-only |

**Removed for auth:** `APP_PASSWORD`, `REQUIRE_APP_PASSWORD`, `AUTH_SECRET` — replaced by Supabase Auth.

`.env.local` example:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
CRON_SECRET=your_cron_secret
OPENAI_API_KEY=sk-...
```

---

## 3. How protection works

| Layer | Behavior |
|-------|----------|
| **Middleware** | Refreshes Supabase session; redirects unauthenticated users to `/login` |
| **Public routes** | `/login`, `/api/health`, `/api/cron/*` |
| **Protected** | All dashboard routes: `/`, `/hq`, `/daily-report`, `/integrations`, `/x`, `/debug/database`, etc. |
| **Logout** | Clears Supabase session → `/login` |

API keys (OpenAI, X, SerpAPI, etc.) stay server-only in env vars — never sent to the browser.

---

## 4. Testing checklist

- [ ] Supabase Email provider enabled, sign-ups disabled
- [ ] Admin user created in Supabase → Users
- [ ] `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- [ ] `npm run dev` → visit `http://localhost:3000` → redirected to `/login`
- [ ] Sign in with admin email/password → lands on HQ `/`
- [ ] Sidebar/header shows your email
- [ ] Sign out → back to `/login`
- [ ] `/hq` redirects to `/` when authenticated
- [ ] `/api/health` works without login
- [ ] `/api/cron/agents` still uses `CRON_SECRET` (not Supabase session)
- [ ] Wrong password shows error on login page
- [ ] `npm run build` passes

---

## 5. Deploy to Vercel with auth

1. Push code to GitHub
2. Vercel → **Environment Variables** (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CRON_SECRET`
   - (other server keys as needed)
3. Supabase → **URL Configuration** → Site URL = `https://hq.getplantpal.com`
4. Vercel → add custom domain `hq.getplantpal.com`
5. Deploy → visit domain → login required
6. Verify: `https://hq.getplantpal.com/api/health` (public)
7. Verify: `https://hq.getplantpal.com/` → login wall

### Add team members later

Supabase Dashboard → **Authentication** → **Users** → **Add user** for each approved teammate. No public signup.

---

## 6. Files reference

| File | Role |
|------|------|
| `src/middleware.ts` | Route protection |
| `src/lib/supabase/middleware.ts` | Session refresh |
| `src/lib/supabase/auth-server.ts` | Cookie-based auth client |
| `src/lib/auth/get-user.ts` | Server user lookup |
| `src/lib/actions/auth.ts` | Login / logout actions |
| `src/app/login/page.tsx` | Branded login UI |
| `src/components/auth/user-menu.tsx` | Email display |
| `src/components/auth/logout-button.tsx` | Sign out |
