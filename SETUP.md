# Setup Guide — Supabase, Gemini & Vercel

The site runs without any of this (portfolio + empty product board). The product
feature comes alive once you complete these steps.

## 0. Local development (no cloud account needed)

A full Supabase stack can run locally in Docker:

```bash
npx supabase start    # starts Postgres/Auth/Storage; prints URL + keys
npx supabase stop     # stops it (data is kept)
```

Put the printed `API URL`, `anon key`, and `service_role key` into `.env.local`
(same variable names as below). The schema, storage bucket, and a local admin
user (`admin@local.test` / `admin123`) are already provisioned. Local data
never leaves your machine — cloud setup (below) is only needed for deployment.

## 1. Supabase (database + auth + image storage)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **Auth → Sign In / Providers**: keep Email enabled, but **disable "Allow new
   users to sign up"**. Then **Auth → Users → Add user** — create YOUR admin
   account (email + password). Because signups are off, any authenticated user
   is the admin; that's what the RLS policies assume.
3. **Storage → New bucket**: name `product-images`, set it **Public**. In the
   bucket settings add a file size limit (e.g. 2 MB) and restrict MIME types to
   `image/*` — visitors can upload, so keep limits tight.
4. **SQL Editor**: paste and run the whole of [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `products` and `search_tips` tables, all Row Level Security
   policies, and the atomic click/view counter functions.
5. **Project Settings → API**: copy into `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — this one
     must NEVER get a `NEXT_PUBLIC_` prefix)

## 2. Gemini (AI tips)

1. Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Put it in `.env.local` as `GOOGLE_GENERATIVE_AI_API_KEY` — the
   `@ai-sdk/google` provider reads that variable automatically.

Where AI is used (both cached — approving a product or searching a new term
costs one Gemini call ever, then it's a plain Postgres read):
- **Product tip**: generated once inside the Approve server action
  (`src/features/admin/actions.js`), stored in `products.ai_tip`.
- **Search tip**: `/api/search-tip` checks the `search_tips` table first.

## 3. Run locally

```bash
npm run dev
```

Full verification loop:
1. `/suggest` → submit something (with an image) → check the row appears as
   `pending` in Supabase and is NOT on `/products`.
2. `/admin` → redirected to login → sign in with your admin user.
3. Approve the suggestion → it appears on `/products` with an AI tip on its
   detail page.
4. Click **Buy** → `clicks` increments → it shows in the Trending chart.
5. Search a term like `dumbbell` → Quick tip appears; search it again →
   served from cache (a row exists in `search_tips`).

## 4. Deploy to Vercel

1. Push this folder to a new GitHub repo:
   ```bash
   git add -A && git commit -m "Portfolio migration + product suggestion board"
   git remote add origin https://github.com/<you>/rdg-react-website-next.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Next.js is auto-detected — no build settings needed.
3. Before the first deploy, add the Environment Variables (Production +
   Preview): everything from `.env.local` —
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`.
4. Deploy, then in Supabase **Auth → URL Configuration** add your
   `https://<project>.vercel.app` domain to the redirect allow list.
5. Re-run the verification loop on the live URL.

## Notes

- The contact form's EmailJS keys stay hardcoded like in the original site —
  EmailJS public keys are designed to be public.
- `.env.local` is gitignored; `.env.example` documents the required variables.
