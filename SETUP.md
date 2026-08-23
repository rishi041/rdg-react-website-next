# Setup Guide — Supabase, Gemini & Vercel

The site runs without any of this (portfolio + empty product board). The board
features come alive once you complete these steps. `README.md` explains what
every feature does and how the AI layer behaves; this file is only about
getting the services connected.

## 0. Local development (no cloud account needed)

A full Supabase stack runs locally in Docker:

```bash
npx supabase start     # Postgres/Auth/Storage; prints API URL + anon/service_role keys
npx supabase db reset  # fresh DB: applies supabase/migrations/* (= schema.sql) + supabase/seed.sql (bucket)
npx supabase stop      # stops it (data is kept)
```

Then:
1. Put the printed `API URL`, `anon key`, `service_role key` into `.env.local`
   (same variable names as §1). The standard local demo keys are already there.
2. Create the local admin user once in Studio (http://localhost:54323 →
   Authentication → Users → Add user), e.g. `admin@local.test` / `admin123`.
   Self-signup is disabled in `supabase/config.toml`, so any authenticated user
   is the admin (that's what the RLS policies assume).
3. Schema changes: edit `supabase/schema.sql` (source of truth), mirror it into
   `supabase/migrations/20260823000000_init.sql`, and apply locally with
   `docker exec -i supabase_db_rdg-react-website-next psql -U postgres < supabase/schema.sql`
   (the file is idempotent — safe to re-run).

Local data never leaves your machine — cloud setup (below) is only for deployment.

## 1. Supabase cloud (database + auth + image storage)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **Auth → Sign In / Providers**: keep Email enabled, but **disable "Allow new
   users to sign up"**. Then **Auth → Users → Add user** — create YOUR admin
   account (email + password). Because signups are off, any authenticated user
   is the admin; that's what the RLS policies assume. (No redirect-URL setup is
   needed: the admin login is plain email + password, no magic links/OAuth.)
3. **Storage → New bucket**: name `product-images`, **Public**, file size limit
   2 MB, allowed MIME types `image/*` — visitors can upload, so keep limits tight.
4. **SQL Editor**: paste and run the whole of [`supabase/schema.sql`](supabase/schema.sql).
   It creates all tables (`products`, `categories`, `search_tips`,
   `search_digests`, `search_picks`, `ai_trends`, `ai_insights`), seeds six
   starter categories, every Row Level Security policy, the storage policies,
   and the atomic click/view counter functions. Re-running it later is safe.
5. **Project Settings → API**: copy into `.env.local` / Vercel:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — this one
     must NEVER get a `NEXT_PUBLIC_` prefix; it writes the AI caches)

## 2. Gemini (all AI features)

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Put it in `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY` — the
   `@ai-sdk/google` provider reads that variable automatically. Without a key
   every AI section simply hides itself.

What to expect (details in README §5):
- **Free tier = 20 requests/day per model.** The code falls back across five
  Gemini models automatically and, when everything is exhausted, keeps showing
  the last stored data ("refresh pending…" footnotes). Nothing breaks.
- Every cached feature calls Gemini once and stores the result in Postgres
  (search tips, product tips on first view, web picks, daily "Top picks in
  India", weekly trending + market pulse). Only the chat is live per message.
- **Buyer summaries** ("What buyers are saying") use Google-Search grounding,
  which needs billing enabled on the key — until then that section stays
  hidden and the admin button explains why.

## 3. Run locally & verify

```bash
npm run dev
```

Verification loop:
1. `/suggest` → submit something (with an image) → it is NOT on `/` yet (pending).
2. `/admin` → redirected to login → sign in with your admin user → the
   suggestion is in **Pending queue** → Approve (instant).
3. `/` → it's in **All products**; open it → the **AI tip** appears on the
   first view (generated once, then stored).
4. Click **Buy Now** → `clicks` increments → it shows in **Trending now** and
   the **Clicks leaderboard**.
5. Search `dumbbell` → Quick tip appears; search again → served from cache
   (`search_tips` row). Search something you don't have → "Picks from the web".
6. Admin → **Regenerate now** → "AI trending this week" + "AI market pulse"
   refresh (one call each, ~25 s).

## 4. Deploy to Vercel

1. Push this folder to a new GitHub repo:
   ```bash
   git add -A && git commit -m "OnGoodPicks board + portfolio"
   git remote add origin https://github.com/<you>/rdg-react-website-next.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Next.js is auto-detected — no build settings needed.
3. Before the first deploy, add the Environment Variables (Production +
   Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`.
4. Deploy, then in Supabase **Auth → URL Configuration** set the Site URL to
   your `https://<project>.vercel.app` (only used for auth emails).
5. Re-run the verification loop on the live URL.

## Notes

- The contact form's EmailJS keys stay hardcoded like in the original site —
  EmailJS public keys are designed to be public.
- `.env.local` is gitignored; `.env.example` documents the required variables.
- The public AI endpoints (`/api/search-tip`, `/api/search-digest`,
  `/api/shop-picks`, `/api/chat`) validate and cap their inputs but have no
  per-IP rate limiting; on Vercel add a WAF rule / Vercel Firewall rate limit
  if abuse becomes a concern.
