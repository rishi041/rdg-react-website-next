"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateProductTip,
  generateReviewDigest,
  generateTrendingPicks,
  generateMarketInsights,
  hasGeminiKey,
} from "@/lib/ai";

// 📘 Server Actions: functions that run ONLY on the server but can be called
// directly from client components like a normal async function — no API route
// needed. The admin's session cookie travels with the call, so RLS authorizes
// these updates (anonymous callers would be rejected by Postgres itself).

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return supabase;
}

function refresh() {
  // 📘 Server Components cache their rendered output — tell Next these pages
  // changed so the next visit shows fresh data. The board lives at "/" now.
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function approveProduct(id) {
  const supabase = await getAuthedClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (!product) throw new Error("Product not found");

  // Generate the tip AND the grounded buyer digest ONCE, in parallel, and
  // cache both on the row. Approval must succeed even if either AI call
  // fails — they're nice-to-haves (the digest also needs Google Search
  // grounding quota, which may not be enabled yet).
  const [tipResult, digestResult] = hasGeminiKey()
    ? await Promise.allSettled([
        generateProductTip(product),
        generateReviewDigest(product.name),
      ])
    : [{ status: "rejected" }, { status: "rejected" }];
  const aiTip = tipResult.status === "fulfilled" ? tipResult.value : null;
  const digest = digestResult.status === "fulfilled" ? digestResult.value : null;
  if (tipResult.status === "rejected" && tipResult.reason)
    console.error("AI tip generation failed:", tipResult.reason.message);
  if (digestResult.status === "rejected" && digestResult.reason)
    console.error("Review digest failed:", digestResult.reason.message);

  const { error } = await supabase
    .from("products")
    .update({
      status: "approved",
      ai_tip: aiTip,
      review_digest: digest?.summary ?? null,
      review_sources: digest?.sources ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

// (Re)generate the grounded buyer digest for one approved product — backfills
// products approved before this feature, and lets the admin retry once Google
// Search grounding quota is available. Throws a readable message on failure.
export async function generateProductDigest(id) {
  const supabase = await getAuthedClient();
  if (!hasGeminiKey())
    throw new Error("No Gemini API key — set GOOGLE_GENERATIVE_AI_API_KEY in .env.local");

  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!product) throw new Error("Product not found");

  let digest;
  try {
    digest = await generateReviewDigest(product.name);
  } catch (err) {
    const quota = /quota|RESOURCE_EXHAUSTED|429/i.test(err.message);
    throw new Error(
      quota
        ? "Google Search grounding isn't available on this Gemini key yet (quota). Enable billing on the key and retry."
        : `Couldn't build a grounded summary: ${err.message}`
    );
  }

  const { error } = await supabase
    .from("products")
    .update({ review_digest: digest.summary, review_sources: digest.sources })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function rejectProduct(id) {
  const supabase = await getAuthedClient();
  const { error } = await supabase
    .from("products")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function addCategory(name) {
  const supabase = await getAuthedClient();
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new Error("Category name is required");
  // random hue = the category's color everywhere (chips, gradients, AI cards)
  const { error } = await supabase
    .from("categories")
    .insert({ name: trimmed, hue: Math.floor(Math.random() * 360) });
  if (error)
    throw new Error(
      error.code === "23505" ? "That category already exists" : error.message
    );
  refreshCategories();
}

export async function deleteCategory(id) {
  const supabase = await getAuthedClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  // products keep their category text — nothing else to clean up
  refreshCategories();
}

function refreshCategories() {
  revalidatePath("/");
  revalidatePath("/suggest");
  revalidatePath("/admin");
}

// Force-refresh the weekly AI-trending picks NOW (instead of waiting for the
// 7-day cache to expire) — e.g. right after adding a new category so the next
// picks can use it. The board reads the newest ai_trends row, so inserting a
// fresh one immediately replaces what visitors see.
export async function regenerateAiTrends() {
  const supabase = await getAuthedClient(); // admin-only, like every action here
  if (!hasGeminiKey())
    throw new Error(
      "No Gemini API key — set GOOGLE_GENERATIVE_AI_API_KEY in .env.local (see SETUP.md)"
    );

  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .order("created_at", { ascending: true });
  const names = (categories ?? []).map((c) => c.name);

  const items = await generateTrendingPicks(names.length ? names : ["Other"]);
  // 📘 service-role client: ai_trends has no insert policy on purpose — only
  // the server may write it, never a browser.
  const admin = createAdminClient();
  const { error } = await admin.from("ai_trends").insert({ items });
  if (error) throw new Error(error.message);
  // also refresh the board's AI market pulse (stats + charts); failure here
  // must not undo the trending refresh that already succeeded
  try {
    const insights = await generateMarketInsights(names.length ? names : ["Other"]);
    await admin.from("ai_insights").insert({ data: insights });
  } catch (err) {
    console.error("AI market pulse refresh failed:", err.message);
  }
  refresh();
  return items.length;
}

export async function updateProduct(id, fields) {
  const supabase = await getAuthedClient();
  // whitelist editable fields — never spread client input straight into a query
  const { name, description, link, location, category } = fields;
  const { error } = await supabase
    .from("products")
    .update({ name, description, link, location, category })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
