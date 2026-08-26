# OnGoodPicks + Portfolio — Next.js 16 app

One Next.js project, two faces:

| URL | What | Brand |
|---|---|---|
| `/`, `/suggest`, `/products/[id]`, `/admin` | **OnGoodPicks** — a community product board ("things people actually use"), with AI helpers | OnGoodPicks |
| `/portfolio` | Rushikesh Ganorkar's personal portfolio (migrated verbatim from the old Vite app) | Personal |

Both share one header/footer design (`BoardHeader` / `BoardFooter` with a `brand` prop), the same random accent hue per page load, and the same dark-mode toggle.

> **For AI agents / new contributors:** read this file first, then `SETUP.md` (cloud setup) and `supabase/schema.sql`. Code comments marked **📘** explain *why* something is server vs client — keep adding them; the owner is a React dev learning Next.js.

---

## 1. Stack

- **Next.js 16.3 (App Router, JavaScript, Turbopack dev)** — `src/proxy.js` is the middleware (Next 16 name). `AGENTS.md` is auto-written by `next dev` with Next 16 notes; don't edit it by hand.
- **React 19**, Server Components + Server Actions + Route Handlers.
- **Tailwind v4, utilities only (no preflight)** — `src/app/globals.css`. Preflight would break the untouched portfolio SCSS. Color tokens map to the portfolio's CSS variables (`--first-color`, `--title-color`, …) via `@theme inline`, so random hue + dark mode work everywhere for free. `dark:` variant = `body.dark-theme`.
- **Supabase** (Postgres + Auth + Storage) — local Docker for dev (`npx supabase start`), cloud for deploy. RLS everywhere; service-role client only on the server for AI caches.
- **Vercel AI SDK v6** + `@ai-sdk/google` (Gemini) — `src/lib/ai.js` is the *only* file that talks to Gemini.
- **Recharts** for charts (single accent hue, no animations), **react-toastify**, **Unicons** (`uil-*` icon font from the portfolio).

## 2. Run it locally

```bash
npm install
npx supabase start          # local Postgres/Auth/Storage in Docker
npx supabase db reset       # fresh local DB: applies supabase/migrations/* (= schema.sql) + seed.sql (bucket)
# .env.local → NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (local demo keys)
#             GOOGLE_GENERATIVE_AI_API_KEY (aistudio.google.com/apikey) — AI features hide themselves without it
npm run dev                 # http://localhost:3000
npm run lint                # eslint
npm run build               # ⚠️ never while `npm run dev` is serving — it has hung the dev server before
```

Local admin: create it once in Studio (http://localhost:54323 → Authentication → Add user), e.g. `admin@local.test` / `admin123` — any authenticated user is admin; self-signup is disabled in `supabase/config.toml` (see SETUP.md §0).
Schema: `supabase/schema.sql` is the source of truth (idempotent — safe to re-run); mirror changes into `supabase/migrations/20260823000000_init.sql`; apply locally with `docker exec -i supabase_db_rdg-react-website-next psql -U postgres < supabase/schema.sql`.

## 3. Project layout (feature-based)

```
src/
  app/
    layout.js                 chrome-less root (html/body only)
    (board)/                  OnGoodPicks — BoardHeader/BoardFooter/ScrollUp, title template "%s — OnGoodPicks"
      page.js                 the landing board (search/filter, stats, AI strips, grids)
      suggest/page.js         public suggestion form
      products/page.js        308 → "/" (old URL, params preserved)
      products/[id]/page.js   product detail (image, Buy, AI tip, buyer summary, related)
      admin/page.js           dashboard (stats, charts, categories, AI panel, queues)
      admin/login/page.js
    (portfolio)/portfolio/    personal site, same shared chrome with brand="portfolio"
    api/chat                  streaming shopping assistant
    api/search-tip            cached AI "quick tip" per search term
    api/search-digest         cached grounded "what buyers say" per term
    api/shop-picks            AI product picks: ?term= (search fallback) / ?topic= (daily "Top picks in India")
  features/
    products/components/*     board UI (client islands + server components)
    products/queries.js       all Supabase reads for the board
    products/picks-topics.js  preset topics for "Top picks in India" (+ IST day helpers)
    suggest/components/SuggestForm.jsx
    admin/actions.js          Server Actions (approve/reject/edit/generateProductDigest/categories/regenerateAiTrends)
    admin/components/*        admin UI
    portfolio/                UNTOUCHED migrated portfolio (SCSS kept) — do not restyle
  components/ui/index.js      tiny Tailwind atoms: Button, Input, Textarea, Select, Label, Chip, Card, Badge, Spinner, EmptyState
  lib/ai.js                   Gemini access + fallback + cooldown helpers (see §5)
  lib/supabase/{client,server,admin,config}.js
  proxy.js                    middleware (matches /admin/* only): refreshes the session there, redirects anonymous users to /admin/login
supabase/schema.sql           full schema + RLS, idempotent (run in cloud SQL editor); mirrored in supabase/migrations/, seed.sql creates the local bucket
SETUP.md                      cloud Supabase / Gemini / Vercel steps
```

## 4. Features (what exists, where it lives)

### Board `/` (`src/app/(board)/page.js`)
Default view order: **StatsBar → AI trending this week → Top picks in India → Trending now → AI market pulse → Clicks leaderboard → All products**. Search/filter view: Quick tip → buyer digest → *(no matches only)* "Not on the board yet — picks from the web" → results/empty state → related → clear.

| Feature | Component(s) | Data | Notes |
|---|---|---|---|
| Search + category chips | `SearchFilterBar` | URL `?q=&category=` | chips = admin-managed `categories`; search box fixed width, chips wrap |
| Stats tiles | `StatsBar` | `getStats()` | products / views / buy clicks / categories |
| AI trending this week | `AiTrendingStrip` | `ai_trends` (weekly) | 6 trending product *ideas* (not DB rows) with Amazon search links; "Updated <date>" + stale note |
| Top picks in India | `IndiaPicks` + `PicksGrid` | `search_picks` via `/api/shop-picks?topic=` | tabs: trending-today / daily-use / high-demand; 10 ranked real products → Google Shopping links; one generation per topic per **IST calendar day** |
| Trending now | `TrendingStrip` | approved products by clicks | real board products |
| AI market pulse | `AiMarketPulse` + `TrendingBarChart` + `ColumnChart` | `ai_insights` (weekly, **category-aware**) | one highlight tile per admin category (horizontal strip), "buying interest by category" bars, 6-month index (month labels computed server-side in IST, last = current month); footnote "updated <date>" + stale note |
| Clicks leaderboard | `TrendingBarChart` | products.clicks | real data, never AI |
| All products / results | `ProductGrid`, `ProductCard`, `ProductImage` | products | cards crop (`cover`); detail page shows full image (`fit="contain"`) |
| Quick tip (search) | `SearchTip` | `search_tips` via `/api/search-tip` | shimmer skeleton while loading |
| Buyer digest (search / product) | `SearchDigest`, `ReviewDigestCard` | `search_digests`, `products.review_*` | **Google-Search-grounded**, strict: no sources → nothing stored/shown. Needs grounding quota (billing) — hidden until then |
| Picks from the web (no matches) | `ShoppingPicks` + `PicksGrid` | `search_picks` via `/api/shop-picks?term=` | rule: board has it → show ours only; board doesn't → AI picks with Google Shopping links, shown ABOVE the empty state |
| Shopping assistant chat | `ChatWidget` + `/api/chat` | none (server-side; conversation + open state persist per-tab in `sessionStorage`, key `ogp-chat` — survives navigation/reload, fresh in a new tab) | streaming `useChat`; system prompt = live catalog; links only `/products/<id>` or Google search; launcher has a quiet "live" ring + online dot |
| Buy click / view tracking | `BuyNowButton`, `ViewTracker` | RPCs `increment_clicks/views` | |

### Suggest `/suggest` — `SuggestForm` inserts `status='pending'` with the anon key (RLS allows only that); image via upload to `product-images/suggestions/` or pasted URL.

### Product `/products/[id]` — image (contain), Buy Now, **`AiTipCard`** (reads `products.ai_tip`; if null, back-fills ONCE inside `<Suspense>` and stores it), `ReviewDigestCard`, related row, chat.

### Admin `/admin` (auth via Supabase; `proxy.js` redirects anonymous users to `/admin/login`)
8 stat tiles, submissions/week column chart, approved-by-category bars, `EngagementTable`, `CategoryManager` (add/delete categories — each gets a random `hue` used everywhere), `AiTrendsPanel` ("Regenerate now" = trends + market pulse in parallel), `ProductQueue` pending (Approve/Edit/Reject) and approved (Edit/Unpublish/Generate buyer summary). **Edit form has every Suggest-form field incl. image (Keep / Upload / Paste URL / Remove).** Approve is a plain DB update (no AI in the approve path). Buttons drive their state from the Server Action promise and update the list optimistically; `router.refresh()` runs in the background.

## 5. The AI contract (read before touching `src/lib/ai.js`)

All Gemini access goes through `src/lib/ai.js`:

- `generate(opts, {fallback})` — `generateText` with **model fallback** over `MODEL_IDS` (`gemini-3.6-flash → 3.7-flash → 3.5-flash → 3.5-flash-lite → 3.1-flash-lite`) on 429/500/503 (free tier = **20 requests/day/model**), `maxRetries: 1`, and a 10-min per-model "unavailable" memory. `fallback:false` = primary only (used for the grounded digest — grounding quota is per key).
- `streamWithFallback(opts)` — same idea for the chat: peeks the first chunk on a teed stream, switches model on a quota/overload error.
- **"DB first, AI once, keep the last good data"** — every cached feature: stored+fresh → read DB; stored+stale → try one refresh, on failure serve stored data flagged `stale` (UI shows "refresh pending, showing the latest saved…"); nothing stored → try once, else show nothing. `recentlyFailed/markFailed/clearFailed` give each feature key a 15-min cooldown so a failing key never slows page loads; `singleFlight(key, fn)` makes concurrent visitors share one generation; cache writes are checked (a failed write counts as a failure, so "once" stays once). **Never fabricate**: grounded digests require real sources; charts/tiles are labelled "AI estimates"; approval resets counters/AI fields and RLS forbids visitors from pre-filling them.
- **Dates**: Gemini has no clock. `currentIndiaDate()` ("August 2026") is injected into every "now"-dependent prompt; `lastSixMonthLabels()` supplies the market-pulse month labels (relabelled server-side).
- **Category-aware**: the market pulse stores the category list it was generated for; add/remove a category in admin → next visit regenerates once.
- Chat is the only non-cached AI feature (user decision).

Caches (anon read-only): `search_tips`, `search_digests`, `search_picks` (key = search term, or `topic:<key>` for the daily topics), `ai_trends` (weekly), `ai_insights` (weekly + category set) and `products.ai_tip` are written with the service-role client; `products.review_digest / review_sources` are written by the admin's own (RLS) session from the "Generate buyer summary" action.

## 6. Data model (`supabase/schema.sql`)
`products` (status pending/approved/rejected, clicks, views, ai_tip, review_digest, review_sources, image_url…; CHECK: link/image_url must be `http(s)://`), `categories` (name, hue), `search_tips`, `search_digests`, `search_picks`, `ai_trends`, `ai_insights`, storage bucket `product-images` (public read, anon insert to `suggestions/`), RPCs for click/view counters. RLS: anon can read approved products & caches and insert **pending** products **only with zero counters and empty AI fields**; authenticated (= admin) can read/update/delete products and manage categories; AI cache tables have no client insert policy.

## 7. Conventions & gotchas
- Portfolio code (`features/portfolio`, its SCSS) stays **untouched** — only `'use client'`, asset paths, localStorage guards were changed during migration. New work = Tailwind in `features/*`.
- The portfolio SCSS is *unlayered*, so it outranks Tailwind's layered utilities (e.g. `img { height: auto }` — use `!h-full` when you really need it; `::-webkit-scrollbar` only sets `width`, horizontal bars get `height` from `globals.css`).
- Category colours are never hardcoded: pages build a `{name → hue}` map from `categories` and pass it down.
- Board/product pages are `force-dynamic`; Server Actions call `revalidatePath("/")`, `/suggest`, `/admin`.
- Don't run `next build` while the dev server is serving (hung it once). Don't `pkill -f next-server` — other projects' servers run on this machine.
- Headless Chrome (Puppeteer) reports no `hover` capability and draws overlay scrollbars — verify hover styles/scrollbars with computed styles or the `--blink-settings=primaryHoverType=2,...` flag.
- Free-tier Gemini: expect 429s; everything degrades to stored data. Enabling billing on the key unlocks Google-Search grounding (buyer summaries).
- Public AI routes validate/cap inputs (term 2–60 chars, chat ≤30 messages / 8k chars, text parts only) but have no per-IP rate limiting — add one at the edge (Vercel Firewall) if needed.
- `ProductCard` wraps the whole card in a `Link` with a Buy `button` inside (interactive-in-interactive) — works, but restructure if you ever rework the card.

## 8. Deploy
See `SETUP.md`: cloud Supabase (run the full `schema.sql`, create the bucket, add the admin user, disable signups), env vars on Vercel, Gemini key. `next.config.mjs` whitelists `*.supabase.co` (and `storage.googleapis.com`, currently unused) for `next/image`; every other image host — including the local `127.0.0.1:54321` Supabase — renders via plain `<img>`.
