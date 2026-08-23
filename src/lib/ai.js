import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// 📘 generateText (not streamText): both tips are generated ONCE and cached in
// Postgres, then re-read forever. Streaming only improves UX when a human is
// watching tokens arrive (chat UIs — that's where useChat/streamText shine).
const model = google("gemini-3.6-flash");
// Exported for the chat route — the one place we DO stream (a human is
// watching tokens arrive), unlike the cached one-shot tips below.
export { model as chatModel };

// True once the user replaced the ".env.local" placeholder with a real key.
export function hasGeminiKey() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return Boolean(key) && !key.startsWith("your-");
}

export async function generateProductTip(product) {
  const { text } = await generateText({
    model,
    prompt: `Write one practical, friendly 1-2 sentence tip for someone buying or using this product. No preamble, no markdown.
Product: ${product.name}
Category: ${product.category}
Description: ${product.description || "n/a"}`,
  });
  return text.trim();
}

export async function generateSearchTip(term) {
  const { text } = await generateText({
    model,
    prompt: `A visitor searched a product board for "${term}". Write one helpful 1-2 sentence quick tip related to "${term}" (e.g. for "dumbbell", a short exercise tip). No preamble, no markdown.`,
  });
  return text.trim();
}

// Grounded "What buyers are saying" digest — uses Google Search grounding so
// the summary reflects REAL web results, and returns the citations Gemini
// used. Strict rule: no sources → throw, so callers never store or show a
// summary that isn't backed by real pages (plain prompts would happily
// invent plausible "reviews" — not acceptable for this feature).
// 📘 Returns { summary, sources: [{ title, url }] }. Cached by callers
// (products.review_digest / search_digests) so it runs once per subject.
export async function generateReviewDigest(subject) {
  const result = await generateText({
    model,
    // the tool MUST be named google_search for Gemini grounding
    tools: { google_search: google.tools.googleSearch({}) },
    // a quota-blocked key fails fast instead of stalling approval on retries
    maxRetries: 1,
    prompt: `Using Google Search, summarize in 2-4 plain-text sentences what buyers commonly say about "${subject}": the most common praise and the most common complaints. No markdown, no bullet lists, no invented specifics, and do not present anything as a direct quote or testimonial.`,
  });

  // Primary: the SDK's normalized citations
  let sources = (result.sources ?? [])
    .filter((s) => s.sourceType === "url" && s.url)
    .map((s) => ({ title: s.title ?? "", url: s.url }));

  // Backup: raw grounding chunks from provider metadata
  if (!sources.length) {
    const chunks =
      result.providerMetadata?.google?.groundingMetadata?.groundingChunks ?? [];
    sources = chunks
      .map((c) => c.web)
      .filter((w) => w?.uri)
      .map((w) => ({ title: w.title ?? "", url: w.uri }));
  }

  // dedupe by url, keep at most 5
  const seen = new Set();
  sources = sources
    .filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)))
    .slice(0, 5);

  const summary = result.text.trim();
  if (!summary || !sources.length) {
    throw new Error("No grounded sources returned — refusing to store an ungrounded digest");
  }
  return { summary, sources };
}

// Weekly "AI trending" picks — market-trending product IDEAS (not our DB data).
// Returns [{name, category, reason}] or throws; the caller caches the result
// in the ai_trends table so this runs at most once a week.
export async function generateTrendingPicks(categories) {
  const { text } = await generateText({
    model,
    prompt: `List 6 consumer products that are trending in the Indian market right now.
Respond with ONLY a JSON array (no markdown fences, no prose). Each element:
{"name": "<short product name>", "category": "<one of: ${categories.join(", ")}>", "reason": "<one sentence on why it's trending>"}`,
  });
  // the model occasionally wraps JSON in ``` fences — strip before parsing
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const items = JSON.parse(cleaned);
  if (!Array.isArray(items)) throw new Error("AI returned non-array");
  return items
    .filter((i) => i && typeof i.name === "string")
    .slice(0, 6)
    .map((i) => ({
      name: i.name,
      category: typeof i.category === "string" ? i.category : "Other",
      reason: typeof i.reason === "string" ? i.reason : "",
    }));
}

// "Picks from the web" — when a search has NO matches on the board, ask
// Gemini for 4–6 real, well-known products for the term. Each pick links to
// Google Shopping search (deterministic, never an invented store URL); the
// price hint is an explicit estimate. Cached per term in search_picks.
// `count` = how many picks to ask for (6 for searches, 10 for the board's
// preset "Top picks in India" topics).
export async function generateShoppingPicks(term, categories, count = 6) {
  const { text } = await generateText({
    model,
    prompt: `A shopper in India searched for "${term}". List ${Math.max(4, count - 2)} to ${count} real, well-known, currently available products that match this search.
Respond with ONLY a JSON array (no markdown fences, no prose). Each element:
{"name": "<exact product name incl. model>", "brand": "<brand>", "priceHint": "<typical Indian street price range in INR, e.g. ₹35,000–45,000>", "category": "<one of: ${categories.join(", ")}, Other>", "reason": "<one sentence on who it's best for>"}`,
  });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const items = JSON.parse(cleaned);
  if (!Array.isArray(items)) throw new Error("AI returned non-array");
  const picks = items
    .filter((i) => i && typeof i.name === "string" && i.name.trim())
    .slice(0, count)
    .map((i) => ({
      name: i.name.trim(),
      brand: typeof i.brand === "string" ? i.brand : "",
      priceHint: typeof i.priceHint === "string" ? i.priceHint : "",
      category: typeof i.category === "string" ? i.category : "Other",
      reason: typeof i.reason === "string" ? i.reason : "",
    }));
  if (!picks.length) throw new Error("AI returned no shopping picks");
  return picks;
}

// Weekly "AI market pulse" — Gemini's ESTIMATES of buying interest for the
// board's categories (0–100), a 6-month overall interest index, and 4
// headline stats. These are estimates from general market knowledge, NOT
// measurements — the UI labels them as such. Cached in ai_insights so this
// runs once a week (same lazy-refresh pattern as the trending picks).
const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export async function generateMarketInsights(categories) {
  const { text } = await generateText({
    model,
    prompt: `You are a retail market analyst for India. Give your best ESTIMATES of current consumer buying interest for these product categories: ${categories.join(", ")}.
Respond with ONLY a JSON object (no markdown fences, no prose) of this exact shape:
{"demand":[{"category":"<one of the categories>","score":<integer 0-100, relative buying interest this month>}],
 "trend":[{"month":"<short month name, e.g. Mar>","index":<integer 0-100>}],
 "highlights":[{"label":"<short stat label>","value":"<short value, e.g. Fitness or +18%>","note":"<one short sentence>"}]}
Rules: "demand" has exactly one entry per category listed. "trend" has exactly 6 entries — overall consumer-product buying interest for the last 6 months ending this month, oldest first. "highlights" has exactly 4 entries (e.g. fastest-growing category, busiest shopping month, most searched category, peak discount season).`,
  });
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const raw = JSON.parse(cleaned);

  const demand = (Array.isArray(raw.demand) ? raw.demand : [])
    .filter((d) => d && typeof d.category === "string")
    .map((d) => ({ category: d.category, score: clamp100(d.score) }));
  const trend = (Array.isArray(raw.trend) ? raw.trend : [])
    .filter((t) => t && typeof t.month === "string")
    .slice(0, 12)
    .map((t) => ({ month: t.month, index: clamp100(t.index) }));
  const highlights = (Array.isArray(raw.highlights) ? raw.highlights : [])
    .filter((h) => h && typeof h.label === "string")
    .slice(0, 4)
    .map((h) => ({
      label: h.label,
      value: String(h.value ?? ""),
      note: typeof h.note === "string" ? h.note : "",
    }));

  if (!demand.length) throw new Error("AI market insights missing demand data");
  return { demand, trend, highlights };
}
