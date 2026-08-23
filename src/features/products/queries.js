import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// 📘 All reads live server-side (Server Components call these) — the browser
// never talks to Supabase for listing products, and RLS guarantees only
// status='approved' rows are visible to anonymous visitors anyway.

export async function getApprovedProducts({ q, category } = {}) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProductById(id) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();
  return data; // null when not found / not approved
}

export async function getRelatedProducts(category, excludeIds = [], limit = 4) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "approved")
    .eq("category", category)
    .order("clicks", { ascending: false })
    .limit(limit);
  if (excludeIds.length > 0)
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  const { data } = await query;
  return data ?? [];
}

export async function getStats() {
  const products = await getApprovedProducts();
  return {
    totalProducts: products.length,
    totalClicks: products.reduce((sum, p) => sum + p.clicks, 0),
    totalViews: products.reduce((sum, p) => sum + p.views, 0),
    totalCategories: new Set(products.map((p) => p.category)).size,
  };
}

export async function getCategories() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, hue")
    .order("created_at", { ascending: true });
  return data ?? [];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Newest cached AI-trending list. `stale` tells the caller a weekly refresh
// is due; the caller decides whether it CAN refresh (needs the Gemini key).
export async function getAiTrends() {
  if (!isSupabaseConfigured()) return { items: null, stale: false };
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_trends")
    .select("items, generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { items: null, stale: true, generatedAt: null };
  const stale = Date.now() - new Date(data.generated_at).getTime() > WEEK_MS;
  return { items: data.items, stale, generatedAt: data.generated_at };
}

export async function getTrending(limit = 5) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*") // full rows — the trending strip renders real product cards
    .eq("status", "approved")
    .gt("clicks", 0)
    .order("clicks", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Newest cached AI market-pulse payload (see generateMarketInsights). Same
// weekly staleness contract as getAiTrends.
export async function getAiInsights() {
  if (!isSupabaseConfigured()) return { data: null, stale: false, generatedAt: null };
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_insights")
    .select("data, generated_at")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { data: null, stale: true, generatedAt: null };
  const stale = Date.now() - new Date(data.generated_at).getTime() > WEEK_MS;
  return { data: data.data, stale, generatedAt: data.generated_at };
}
