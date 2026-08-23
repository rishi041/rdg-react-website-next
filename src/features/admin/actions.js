"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
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
  // 📘 The board/admin pages are force-dynamic, so the server always renders
  // fresh data; revalidatePath here mainly busts the client Router Cache so
  // in-app navigations don't show stale pages. (/products/[id] is dynamic too,
  // so edits show there on the next visit without listing it.)
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function approveProduct(id) {
  const supabase = await getAuthedClient();
  // 📘 Approval is a plain, instant DB update. The AI extras are NOT generated
  // here (they made "Approve" wait 20-40s on Gemini):
  //   - the AI tip is generated once on the product's first page view by
  //     AiTipCard (Suspense-streamed, then stored on the row),
  //   - the grounded buyer summary is generated on demand via the admin
  //     "Generate buyer summary" button (needs grounding quota anyway).
  // Reset everything a visitor could have pre-filled on the pending row
  // (RLS also blocks it on insert — belt and braces): counters start at zero
  // and AI fields start empty, so nothing fabricated goes live.
  const { error } = await supabase
    .from("products")
    .update({
      status: "approved",
      clicks: 0,
      views: 0,
      ai_tip: null,
      review_digest: null,
      review_sources: null,
    })
    .eq("id", id)
    .eq("status", "pending");
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

  const cats = names.length ? names : ["Other"];
  // Both generations in PARALLEL (halves the wait); the market pulse is a
  // nice-to-have — its failure must not undo a trending refresh that worked.
  const [trendsResult, insightsResult] = await Promise.allSettled([
    generateTrendingPicks(cats),
    generateMarketInsights(cats),
  ]);
  if (trendsResult.status === "rejected") throw trendsResult.reason;
  const items = trendsResult.value;
  // 📘 service-role client: ai_trends has no insert policy on purpose — only
  // the server may write it, never a browser.
  const admin = createAdminClient();
  const { error } = await admin.from("ai_trends").insert({ items });
  if (error) throw new Error(error.message);
  if (insightsResult.status === "fulfilled") {
    const { error: insightsError } = await admin
      .from("ai_insights")
      .insert({ data: insightsResult.value });
    if (insightsError)
      console.error("ai_insights insert failed:", insightsError.message);
  } else {
    console.error("AI market pulse refresh failed:", insightsResult.reason?.message);
  }
  refresh();
  return items.length;
}

// Admin edit — every field the Suggest form has (name, link, location,
// category, image, note) so an incomplete or wrong suggestion can be fixed
// in place. The image itself is uploaded from the browser (same bucket/path
// rule as the Suggest form); this only stores the resulting URL.
export async function updateProduct(id, fields) {
  const supabase = await getAuthedClient();
  // whitelist editable fields — never spread client input straight into a query
  const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const name = clean(fields.name);
  const link = clean(fields.link);
  if (!name || !link) throw new Error("Product name and purchase link are required.");
  if (!/^https?:\/\//i.test(link)) throw new Error("Purchase link must start with http:// or https://");
  const image_url = clean(fields.image_url);
  if (image_url && !/^https?:\/\//i.test(image_url))
    throw new Error("Image URL must start with http:// or https://");

  const { error } = await supabase
    .from("products")
    .update({
      name,
      link,
      location: clean(fields.location),
      category: clean(fields.category) ?? "Other",
      description: clean(fields.description),
      image_url, // null = no image (admin removed it or none was given)
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
