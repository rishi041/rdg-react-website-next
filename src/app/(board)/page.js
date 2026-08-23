import Link from "next/link";
import {
  getApprovedProducts,
  getRelatedProducts,
  getStats,
  getTrending,
  getCategories,
  getAiTrends,
  getAiInsights,
} from "@/features/products/queries";
import { generateTrendingPicks, generateMarketInsights, hasGeminiKey } from "@/lib/ai";
import ChatWidget from "@/features/products/components/ChatWidget";
import { createAdminClient } from "@/lib/supabase/admin";
import AiTrendingStrip from "@/features/products/components/AiTrendingStrip";
import AiMarketPulse from "@/features/products/components/AiMarketPulse";
import ProductGrid from "@/features/products/components/ProductGrid";
import StatsBar from "@/features/products/components/StatsBar";
import TrendingStrip from "@/features/products/components/TrendingStrip";
import TrendingBarChart from "@/features/products/components/TrendingBarChart";
import { Card } from "@/components/ui";
import SearchFilterBar from "@/features/products/components/SearchFilterBar";
import SearchTip from "@/features/products/components/SearchTip";
import SearchDigest from "@/features/products/components/SearchDigest";
import ShoppingPicks from "@/features/products/components/ShoppingPicks";
import IndiaPicks from "@/features/products/components/IndiaPicks";
import RelatedRow from "@/features/products/components/RelatedRow";

// title comes from the (board) layout's metadata default

// 📘 The product board IS the landing page. Content changes whenever the
// admin approves something — always render fresh.
export const dynamic = "force-dynamic";

// Lazy weekly refresh of the AI-trending cache: the first visitor after the
// 7-day expiry pays one Gemini call, everyone else reads the cached list.
// Any failure falls back to the previous cache (or hides the section).
async function getAiTrendsWithRefresh(categoryNames) {
  const { items, stale } = await getAiTrends();
  if (!stale || !hasGeminiKey()) return items;
  try {
    const fresh = await generateTrendingPicks(
      categoryNames.length ? categoryNames : ["Other"]
    );
    await createAdminClient().from("ai_trends").insert({ items: fresh });
    return fresh;
  } catch (err) {
    console.error("AI trends refresh failed:", err.message);
    return items; // last cached list, or null → section hidden
  }
}

// Same lazy weekly refresh for the AI market pulse (stats + charts payload).
async function getAiInsightsWithRefresh(categoryNames) {
  const cached = await getAiInsights();
  if (!cached.stale || !hasGeminiKey()) return cached;
  try {
    const fresh = await generateMarketInsights(
      categoryNames.length ? categoryNames : ["Other"]
    );
    await createAdminClient().from("ai_insights").insert({ data: fresh });
    return { data: fresh, generatedAt: new Date().toISOString() };
  } catch (err) {
    console.error("AI insights refresh failed:", err.message);
    return cached; // last cached payload, or null → section hidden
  }
}

export default async function HomePage({ searchParams }) {
  // 📘 Next 15+: searchParams is a Promise — await it.
  const { q = "", category = "" } = await searchParams;
  const isFiltering = Boolean(q || category);

  const [products, categories] = await Promise.all([
    getApprovedProducts({ q, category }),
    getCategories(), // 📘 chips come from the DB now — managed in /admin
  ]);
  const categoryNames = categories.map((c) => c.name);
  // 📘 category → hue map, from the admin-managed table — every card and
  // gradient below colors itself from this, no hardcoded list anywhere.
  const hues = Object.fromEntries(categories.map((c) => [c.name, c.hue]));

  // Default view extras (hidden while searching/filtering)
  const [stats, trending, aiTrends, aiInsights] = isFiltering
    ? [null, null, null, null]
    : await Promise.all([
        getStats(),
        getTrending(),
        getAiTrendsWithRefresh(categoryNames),
        getAiInsightsWithRefresh(categoryNames),
      ]);

  // "Related" row while filtering: same category as the results, results excluded
  const relatedCategory = category || products[0]?.category;
  const related =
    isFiltering && relatedCategory
      ? await getRelatedProducts(
          relatedCategory,
          products.map((p) => p.id),
        )
      : [];

  return (
    <main className="main">
      <section className="section container">
        <div className="mx-auto max-w-5xl pt-4">
          {/* Left-aligned page header (design ref) */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-title">
              Products
            </h1>
            <p className="mt-1 text-sm text-body-light">
              Things people actually use — suggested by visitors, curated for
              you.{" "}
              <Link
                href="/suggest"
                className="text-accent hover:text-accent-alt"
              >
                Suggest one
              </Link>
            </p>
          </div>

          <div className="mb-6">
            <SearchFilterBar categories={categoryNames} />
          </div>

          {isFiltering ? (
            <div className="flex flex-col gap-6">
              <SearchTip term={q} />
              {/* grounded "What buyers are saying" for the search term —
                  only for text searches, hidden when grounding unavailable */}
              <SearchDigest term={q} />
              {/* Board doesn't have it → AI-picked products for the term
                  (each opening Google Shopping) come FIRST; the "No products
                  match" card + Suggest CTA follows below. Board has it → only
                  our results. Only for text searches with ZERO matches. */}
              {q && products.length === 0 && (
                <ShoppingPicks term={q} hues={hues} />
              )}
              <div>
                {products.length > 0 && (
                  <p className="mb-3 text-xs text-body-light">
                    Showing {products.length} result
                    {products.length === 1 ? "" : "s"}
                    {q ? ` for "${q}"` : ""}
                  </p>
                )}
                <ProductGrid
                  products={products}
                  hues={hues}
                  emptyTitle={`No products match "${q || category}"`}
                />
              </div>
              <RelatedRow products={related} hues={hues} />
              <Link
                href="/"
                className="mx-auto flex w-fit items-center gap-1 text-xs text-body-light transition-colors hover:text-accent"
              >
                <i className="uil uil-times" /> Clear search
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <StatsBar stats={stats} />
              <AiTrendingStrip items={aiTrends} hues={hues} />
              {/* "Top picks in India" — the search-fallback picks, but
                  always on: tabbed preset topics, 10 real products each,
                  opening Google Shopping. Client island, fetches per tab. */}
              {hasGeminiKey() && <IndiaPicks hues={hues} />}
              <TrendingStrip products={trending} hues={hues} />
              <AiMarketPulse
                insights={aiInsights?.data}
                generatedAt={aiInsights?.generatedAt}
              />
              {/* 📘 same server-fetch/client-chart pattern as /admin — the
                  page passes plain rows, recharts renders client-side */}
              {trending?.length > 0 && (
                <Card>
                  <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase text-body">
                    <i className="uil uil-chart-bar text-accent" /> Clicks
                    leaderboard
                  </h2>
                  <TrendingBarChart data={trending} />
                </Card>
              )}
              <div>
                <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-body">
                  All products
                </h2>
                <ProductGrid products={products} hues={hues} />
              </div>
            </div>
          )}
        </div>
      </section>
      {/* 📘 server decides whether the AI widget exists at all (key check
          never reaches the browser); the widget itself is a client island */}
      {hasGeminiKey() && <ChatWidget />}
    </main>
  );
}
