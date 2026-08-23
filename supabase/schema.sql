-- Product Suggestion Board — run this once in the Supabase SQL editor.
-- Prerequisites (Dashboard):
--   1. Auth → Sign In / Up: disable new user signups; add your one admin user manually.
--   2. Storage → create a PUBLIC bucket named `product-images`
--      (set a file size limit, e.g. 2MB, and allowed MIME types image/*).

-- ============ Tables ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  link text not null,
  image_url text,
  location text,
  category text not null default 'Other',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  clicks int not null default 0,
  views int not null default 0,
  ai_tip text,
  -- Google-Search-grounded "What buyers are saying" summary + its citations
  -- [{title, url}]; both null when grounding wasn't available at approval
  review_digest text,
  review_sources jsonb,
  submitted_at timestamptz not null default now()
);

create table public.search_tips (
  term text primary key,               -- stored lower(trim(term))
  tip text not null,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.search_tips enable row level security;

-- ============ products policies ============
-- Anyone may suggest, but ONLY as pending (blocks self-approval).
create policy "anon suggest pending" on public.products
  for insert to anon, authenticated
  with check (status = 'pending');

-- The public sees approved products only.
create policy "read approved" on public.products
  for select to anon
  using (status = 'approved');

-- Any authenticated user = the admin (signups are disabled).
create policy "admin read" on public.products
  for select to authenticated using (true);
create policy "admin update" on public.products
  for update to authenticated using (true) with check (true);
create policy "admin delete" on public.products
  for delete to authenticated using (true);

-- ============ search_tips policies ============
-- Readable by all; written ONLY by the server (service role bypasses RLS),
-- so visitors can't poison the AI-tip cache.
create policy "read tips" on public.search_tips
  for select to anon, authenticated using (true);

-- ============ Atomic click/view counters ============
-- SECURITY DEFINER lets anonymous visitors bump counters without any UPDATE
-- policy; the function only ever touches approved rows.
create or replace function public.increment_clicks(product_id uuid)
returns void language sql security definer set search_path = public as
$$ update products set clicks = clicks + 1 where id = product_id and status = 'approved'; $$;

create or replace function public.increment_views(product_id uuid)
returns void language sql security definer set search_path = public as
$$ update products set views = views + 1 where id = product_id and status = 'approved'; $$;

revoke all on function public.increment_clicks(uuid), public.increment_views(uuid) from public;
grant execute on function public.increment_clicks(uuid), public.increment_views(uuid) to anon, authenticated;

-- ============ Storage policies ============
create policy "public read product images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "anon upload product images" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = 'suggestions');

-- ============ Dynamic categories (managed from /admin) ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  -- gradient color used across the UI; new categories get a random hue
  hue integer not null default (floor(random()*360))::int,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "read categories" on public.categories
  for select to anon, authenticated using (true);
create policy "admin manage categories" on public.categories
  for all to authenticated using (true) with check (true);
insert into public.categories (name, hue) values
  ('Fitness',25),('Electronics',265),('Home',190),('Fashion',330),('Books',150),('Other',210);

-- ============ Grounded buyer-sentiment digests per search term ============
-- Same cache-first idea as search_tips, kept separate: different lifecycle
-- (grounding can fail while the plain tip succeeds) and shape (summary +
-- jsonb sources). Written by the server (service role) only.
create table public.search_digests (
  term text primary key,               -- stored lower(trim(term))
  summary text not null,
  sources jsonb not null,              -- [{title, url}]
  created_at timestamptz not null default now()
);
alter table public.search_digests enable row level security;
create policy "read digests" on public.search_digests
  for select to anon, authenticated using (true);
-- no insert policy: only the server writes it (service-role client)

-- ============ AI trending cache (regenerated weekly, server-written) ============
create table public.ai_trends (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,                -- [{name, category, reason}]
  generated_at timestamptz not null default now()
);
alter table public.ai_trends enable row level security;
create policy "read ai trends" on public.ai_trends
  for select to anon, authenticated using (true);
-- no insert policy: only the server writes it (service-role client)

-- ============ AI market pulse cache (weekly, server-written) ============
-- Gemini ESTIMATES of buying interest per category + a 6-month index +
-- 4 headline stats, shown on the board as charts. Clearly labeled estimates.
create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,                 -- {demand:[{category,score}], trend:[{month,index}], highlights:[{label,value,note}]}
  generated_at timestamptz not null default now()
);
alter table public.ai_insights enable row level security;
create policy "read ai insights" on public.ai_insights
  for select to anon, authenticated using (true);
-- no insert policy: only the server writes it (service-role client)

-- ============ "Picks from the web" cache per search term ============
-- When a search has no matches on the board, Gemini suggests real products
-- for the term (each linking to Google Shopping search). Cache-first like
-- search_tips: one AI call per term ever. Server-written (service role).
-- Also holds the board's preset "Top picks in India" topics (rows keyed by
-- the topic's prompt text, 10 items, refreshed daily via created_at).
create table public.search_picks (
  term text primary key,               -- stored lower(trim(term))
  items jsonb not null,                -- [{name, brand, priceHint, category, reason}]
  created_at timestamptz not null default now()
);
alter table public.search_picks enable row level security;
create policy "read picks" on public.search_picks
  for select to anon, authenticated using (true);
-- no insert policy: only the server writes it (service-role client)
