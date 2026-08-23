import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateShoppingPicks, hasGeminiKey } from "@/lib/ai";
import { getCategories } from "@/features/products/queries";
import {
  getTopic,
  TOPIC_PICK_COUNT,
  TOPIC_TTL_MS,
} from "@/features/products/picks-topics";

// GET /api/shop-picks?term=laptop          → "picks from the web" for a
//                                            search with NO board matches
//                                            (cached forever per term)
// GET /api/shop-picks?topic=trending-today → preset "Top picks in India"
//                                            topic for the main board
//                                            (10 picks, refreshed daily)
// Same cache-first contract as /api/search-tip: one Gemini call per key,
// then a Postgres read. Failures → { items: null } (section/tab hidden).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topic = getTopic(searchParams.get("topic") ?? "");
  // 📘 the topic KEY is public; the prompt text behind it stays server-side
  const term = topic
    ? topic.term
    : (searchParams.get("term") ?? "").trim().toLowerCase();
  const count = topic ? TOPIC_PICK_COUNT : 6;
  const ttl = topic ? TOPIC_TTL_MS : Infinity;

  if (term.length < 2 || term.length > 60 || !isSupabaseConfigured()) {
    return NextResponse.json({ items: null });
  }

  const supabase = await createClient();

  // 1. cache hit (and, for topics, still fresh)?
  const { data: cached } = await supabase
    .from("search_picks")
    .select("items, created_at")
    .eq("term", term)
    .maybeSingle();
  const fresh =
    cached && Date.now() - new Date(cached.created_at).getTime() < ttl;
  if (fresh) {
    return NextResponse.json({
      items: cached.items,
      cached: true,
      generatedAt: cached.created_at,
    });
  }

  // 2. miss / expired → one generation, stored for everyone after
  if (!hasGeminiKey()) {
    // no key: serve the stale topic list rather than nothing
    return NextResponse.json({ items: cached?.items ?? null });
  }
  try {
    const categories = await getCategories();
    const items = await generateShoppingPicks(
      term,
      categories.map((c) => c.name),
      count
    );
    const now = new Date().toISOString();
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await createAdminClient()
        .from("search_picks")
        .upsert({ term, items, created_at: now });
    }
    return NextResponse.json({ items, cached: false, generatedAt: now });
  } catch (err) {
    console.error("shop-picks generation failed:", err.message);
    // never cache failures; fall back to yesterday's topic list if we have one
    return NextResponse.json({ items: cached?.items ?? null });
  }
}
