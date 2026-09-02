import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  generateShoppingPicks,
  hasGeminiKey,
  recentlyFailed,
  markFailed,
  clearFailed,
} from "@/lib/ai";
import { getCategories } from "@/features/products/queries";
import {
  getTopic,
  isFreshToday,
  TOPIC_PICK_COUNT,
} from "@/features/products/picks-topics";

// a cache-miss generation (with model fallbacks) can exceed the default timeout
export const maxDuration = 60;

// GET /api/shop-picks?term=laptop          → "picks from the web" for a
//                                            search with NO board matches
//                                            (cached forever per term)
// GET /api/shop-picks?topic=trending-today → preset "Top picks in India"
//                                            topic for the main board
//                                            (10 picks, one generation per
//                                            IST calendar day)
//
// 📘 Cache-first, DB as the source of truth:
//   1. stored + fresh  → serve from Postgres (no AI call)
//   2. stored + stale  → try ONE AI refresh; on failure (quota etc.) serve
//                        the latest stored list, flagged stale: true
//   3. nothing stored  → try AI; on failure { items: null } (UI hides)
// After a failed refresh we don't re-hit Gemini on every visit — the shared
// cooldown (lib/ai recentlyFailed/markFailed) serves the stored list instantly.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const topic = getTopic(searchParams.get("topic") ?? "");
  // what we ask Gemini for
  const term = topic
    ? topic.term
    : (searchParams.get("term") ?? "").trim().toLowerCase();
  // what we store it under — topics get their own key so a visitor searching
  // the exact topic phrase can never overwrite/shadow the 10-item topic list
  const cacheKey = topic ? `topic:${topic.key}` : term;
  const count = topic ? TOPIC_PICK_COUNT : 6;

  if (term.length < 2 || term.length > 60 || !isSupabaseConfigured()) {
    return NextResponse.json({ items: null });
  }

  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("search_picks")
    .select("items, created_at")
    .eq("term", cacheKey)
    .maybeSingle();

  // searched terms never expire; topics are fresh only for today (IST)
  const fresh = cached && (!topic || isFreshToday(cached.created_at));
  const stored = cached
    ? { items: cached.items, generatedAt: cached.created_at }
    : null;

  if (fresh) {
    return NextResponse.json({ ...stored, cached: true, stale: false });
  }

  // Stale/missing. Can we (and should we) ask Gemini right now?
  if (!hasGeminiKey() || recentlyFailed(`picks:${cacheKey}`)) {
    return NextResponse.json(
      stored ? { ...stored, cached: true, stale: true } : { items: null }
    );
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
      const { error } = await createAdminClient()
        .from("search_picks")
        .upsert({ term: cacheKey, items, created_at: now });
      if (error) throw new Error(`search_picks upsert failed: ${error.message}`);
    }
    clearFailed(`picks:${cacheKey}`);
    return NextResponse.json({
      items,
      generatedAt: now,
      cached: false,
      stale: false,
    });
  } catch (err) {
    console.error("shop-picks generation failed:", err.message);
    markFailed(`picks:${cacheKey}`); // never cache failures in the DB
    return NextResponse.json(
      stored ? { ...stored, cached: true, stale: true } : { items: null }
    );
  }
}
