import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateReviewDigest, hasGeminiKey, recentlyFailed, markFailed } from "@/lib/ai";

// GET /api/search-digest?term=dumbbell
// Grounded "What buyers are saying" for a search term — same cache-first
// shape as /api/search-tip: each term costs at most ONE grounded Gemini call
// ever, then it's a Postgres read. Written with the service-role client
// (visitors have no INSERT on search_digests). Any failure → { summary: null }
// so the UI shows nothing rather than something fabricated.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const term = (searchParams.get("term") ?? "").trim().toLowerCase();

  if (term.length < 2 || term.length > 60 || !isSupabaseConfigured()) {
    return NextResponse.json({ summary: null });
  }

  const supabase = await createClient();

  // 1. cache hit?
  const { data: cached } = await supabase
    .from("search_digests")
    .select("summary, sources")
    .eq("term", term)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  // 2. miss → one grounded generation, stored for everyone after
  if (!hasGeminiKey() || recentlyFailed(`digest:${term}`)) {
    return NextResponse.json({ summary: null });
  }
  try {
    const { summary, sources } = await generateReviewDigest(term);
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await createAdminClient()
        .from("search_digests")
        .upsert({ term, summary, sources });
      if (error) throw new Error(`search_digests upsert failed: ${error.message}`);
    }
    return NextResponse.json({ summary, sources, cached: false });
  } catch (err) {
    // grounding quota / no sources / network — never cache failures, so a
    // later visit retries once grounding is available
    console.error("search-digest generation failed:", err.message);
    markFailed(`digest:${term}`);
    return NextResponse.json({ summary: null });
  }
}
