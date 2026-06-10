# PlantPal Marketing OS — Supabase Setup (Phase 2)

## Step 1: Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Name it `plantpal-marketing-os` (or reuse your existing PlantPal project)
4. Set a database password and choose a region
5. Wait for the project to finish provisioning (~2 minutes)

## Step 2: Run the SQL migrations

1. Open your project in Supabase
2. Go to **SQL Editor** → **New query**
3. Copy the entire contents of `supabase/migrations/001_marketing_os_schema.sql` and click **Run**
4. Create another query, copy `supabase/migrations/002_marketing_os_seed.sql` and click **Run**

You should see 10 tables in **Table Editor** with sample data.

## Step 3: Add environment variables

1. In Supabase, go to **Project Settings** → **API**
2. Copy **Project URL** and **anon public** key
3. In the project folder, copy the example env file:

```powershell
cd C:\Users\shirm\OneDrive\Desktop\plantpal-marketing-os
Copy-Item .env.local.example .env.local
```

4. Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Install and run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tables created

| Table | Purpose |
|-------|---------|
| `content_ideas` | Content engine ideas |
| `social_posts` | Social media post drafts |
| `image_prompts` | AI image prompts |
| `video_scripts` | Short-form video scripts |
| `community_opportunities` | Community listening items |
| `reply_drafts` | Social reply drafts |
| `creators` | Creator CRM |
| `partnerships` | Partnership tracker |
| `competitor_alerts` | Competitor monitoring |
| `approval_queue` | Human approval workflow |

## Security note

RLS policies are permissive for Phase 2 (internal dashboard, no auth yet). Tighten policies and add Supabase Auth in Phase 3.
