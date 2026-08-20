import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateSearchTip } from "@/lib/ai";

// 📘 Route Handler — the App Router version of an API endpoint.
// GET /api/search-tip?term=dumbbell
// Cache-first: each term costs at most ONE Gemini call ever; afterwards it's a
// plain Postgres read. The cache row is written with the service-role client
// (server-only) because RLS gives visitors no INSERT on search_tips — that
// prevents anyone from poisoning the cache with their own text.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const term = (searchParams.get("term") ?? "").trim().toLowerCase();

  if (term.length < 2 || term.length > 60 || !isSupabaseConfigured()) {
    return NextResponse.json({ tip: null });
  }

  const supabase = await createClient();

  // 1. cache hit?
  const { data: cached } = await supabase
    .from("search_tips")
    .select("tip")
    .eq("term", term)
    .maybeSingle();
  if (cached) {
    return NextResponse.json({ tip: cached.tip, cached: true });
  }

  // 2. miss → generate once and store
  let tip = null;
  try {
    tip = await generateSearchTip(term);
  } catch (err) {
    console.error("search-tip generation failed:", err.message);
    return NextResponse.json({ tip: null });
  }

  if (tip && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    // upsert: two visitors racing on the same new term is fine
    await admin.from("search_tips").upsert({ term, tip });
  }

  return NextResponse.json({ tip, cached: false });
}
