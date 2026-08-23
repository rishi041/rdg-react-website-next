import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";

// 📘 generateText (not streamText): both tips are generated ONCE and cached in
// Postgres, then re-read forever. Streaming only improves UX when a human is
// watching tokens arrive (chat UIs — that's where useChat/streamText shine).
// Primary model first. The Gemini FREE tier caps requests PER DAY PER MODEL
// (20/day on each), so when the primary answers 429 RESOURCE_EXHAUSTED we
// retry the same prompt on the next sibling — every cached one-shot below
// goes through generate(), so none of them needs to know about this.
const MODEL_IDS = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];
const model = google(MODEL_IDS[0]);
// Exported for the chat route — the one place we DO stream (a human is
// watching tokens arrive), unlike the cached one-shot tips below.
export { model as chatModel };

// Transient provider errors worth trying the NEXT model for: 429 (quota /
// rate limit) and 500/503 (Google's "model is experiencing high demand" —
// overload is per model too). The AI SDK may wrap the APICallError in a
// RetryError whose .lastError carries the status, so look at both.
function isTransientError(err) {
  const inner = err?.lastError ?? err;
  return (
    [429, 500, 503].includes(inner?.statusCode) ||
    /RESOURCE_EXHAUSTED|UNAVAILABLE|high demand|exceeded your current quota/i.test(
      err?.message ?? "",
    )
  );
}

// Remember which models just failed so the next call skips straight to a
// working one instead of paying a slow 429 on every request (in-memory, per
// server instance — a restart simply re-probes).
const MODEL_COOLDOWN_MS = 10 * 60 * 1000;
const modelUnavailableUntil = new Map(); // model id → timestamp

// generateText with model fallback. `maxRetries: 1` per model: a daily cap
// or an overloaded model won't clear by hammering it, so move on quickly.
async function generate(opts, { fallback = true } = {}) {
  const now = Date.now();
  const healthy = MODEL_IDS.filter(
    (id) => (modelUnavailableUntil.get(id) ?? 0) <= now,
  );
  // if every model is on cooldown, probe them all again rather than give up
  const pool = healthy.length ? healthy : MODEL_IDS;
  // fallback: false → primary model only, fail fast (used where the quota is
  // per KEY, e.g. Google Search grounding — trying 5 models just adds delay)
  const candidates = fallback ? pool : [MODEL_IDS[0]];
  let lastErr;
  for (const id of candidates) {
    try {
      return await generateText({ model: google(id), maxRetries: 1, ...opts });
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err)) throw err; // a real error — don't mask it
      modelUnavailableUntil.set(id, Date.now() + MODEL_COOLDOWN_MS);
      console.warn(
        `[ai] ${id} unavailable (${(err.lastError ?? err).statusCode ?? "?"}), falling back to next model`,
      );
    }
  }
  throw lastErr;
}

// streamText with the same model fallback — for the chat. Streaming can't
// "retry after the fact", so we PEEK: start the stream on one model and read
// its first meaningful part on a teed branch (the AI SDK tees streams, the
// response branch is untouched). An error part with 429/503 → mark the model,
// try the next one; any real error → hand that stream to the client as-is so
// the normal error path shows. Returns a StreamTextResult either way.
export async function streamWithFallback(opts) {
  const now = Date.now();
  const healthy = MODEL_IDS.filter(
    (id) => (modelUnavailableUntil.get(id) ?? 0) <= now,
  );
  const candidates = healthy.length ? healthy : MODEL_IDS;
  let last = null;
  for (const id of candidates) {
    const result = streamText({ model: google(id), maxRetries: 1, ...opts });
    let failure = null;
    try {
      for await (const part of result.fullStream) {
        if (part.type === "error") {
          failure = part.error ?? new Error("stream error");
          break;
        }
        // first real content → this model is answering, commit to it
        if (
          part.type === "text-start" ||
          part.type === "text-delta" ||
          part.type === "reasoning-delta" ||
          part.type === "tool-call" ||
          part.type === "finish"
        ) {
          break;
        }
      }
    } catch (err) {
      failure = err;
    }
    if (!failure) return result;
    last = result;
    if (!isTransientError(failure)) return result; // real error — show it
    modelUnavailableUntil.set(id, Date.now() + MODEL_COOLDOWN_MS);
    console.warn(
      `[ai] chat: ${id} unavailable (${(failure.lastError ?? failure).statusCode ?? "?"}), trying next model`,
    );
  }
  return last; // every model failed → client sees the error part
}

// 📘 "DB first, AI once, keep the last good data" — the contract every cached
// AI feature follows (tips, trends, market pulse, picks, digests):
//   1. stored + fresh  → serve from Postgres, no AI call
//   2. stored + stale  → try ONE refresh; on failure serve the stored data
//   3. nothing stored  → try once; on failure show nothing (never fabricate)
// After a failed refresh we don't re-hit Gemini on every visit: callers mark
// the feature key failed and skip AI for a while (the visitor gets the stored
// data instantly instead of waiting on a call that will 429 again).
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000;
const refreshFailedAt = new Map(); // feature key → timestamp
export function recentlyFailed(key) {
  return Date.now() - (refreshFailedAt.get(key) ?? 0) < REFRESH_COOLDOWN_MS;
}
export function markFailed(key) {
  refreshFailedAt.set(key, Date.now());
}
export function clearFailed(key) {
  refreshFailedAt.delete(key);
}

// True once the user replaced the ".env.local" placeholder with a real key.
export function hasGeminiKey() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return Boolean(key) && !key.startsWith("your-");
}

// 📘 Gemini has no clock. Any prompt that says "now", "currently" or "this
// month" must be told the date, or the model guesses (the market-pulse chart
// once ended at "Apr" in August). Everything is anchored to India time.
const IST_MONTH_YEAR = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "long",
  year: "numeric",
});
const IST_MONTH_SHORT = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "short",
});
export const currentIndiaDate = (d = new Date()) => IST_MONTH_YEAR.format(d); // "August 2026"
// ["Mar","Apr","May","Jun","Jul","Aug"] — oldest first, ending this month
export function lastSixMonthLabels(d = new Date()) {
  const labels = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 15));
    labels.push(IST_MONTH_SHORT.format(dt));
  }
  return labels;
}

export async function generateProductTip(product) {
  const { text } = await generate({
    prompt: `Write one practical, friendly 1-2 sentence tip for someone buying or using this product. No preamble, no markdown.
Product: ${product.name}
Category: ${product.category}
Description: ${product.description || "n/a"}`,
  });
  return text.trim();
}

export async function generateSearchTip(term) {
  const { text } = await generate({
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
  const result = await generate(
    {
      // the tool MUST be named google_search for Gemini grounding
      tools: { google_search: google.tools.googleSearch({}) },
      prompt: `Using Google Search, summarize in 2-4 plain-text sentences what buyers commonly say about "${subject}": the most common praise and the most common complaints. No markdown, no bullet lists, no invented specifics, and do not present anything as a direct quote or testimonial.`,
    },
    { fallback: false }, // grounding quota is per key — fail fast, don't loop models
  );

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
    throw new Error(
      "No grounded sources returned — refusing to store an ungrounded digest",
    );
  }
  return { summary, sources };
}

// Weekly "AI trending" picks — market-trending product IDEAS (not our DB data).
// Returns [{name, category, reason}] or throws; the caller caches the result
// in the ai_trends table so this runs at most once a week.
export async function generateTrendingPicks(categories) {
  const { text } = await generate({
    prompt: `Today is ${currentIndiaDate()}. List 6 consumer products that are trending in the Indian market right now.
Respond with ONLY a JSON array (no markdown fences, no prose). Each element:
{"name": "<short product name>", "category": "<one of: ${categories.join(", ")}>", "reason": "<one sentence on why it's trending>"}`,
  });
  // the model occasionally wraps JSON in ``` fences — strip before parsing
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");
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
  const { text } = await generate({
    prompt: `Today is ${currentIndiaDate()}. A shopper in India searched for "${term}". List ${Math.max(4, count - 2)} to ${count} real, well-known, currently available products that match this search.
Respond with ONLY a JSON array (no markdown fences, no prose). Each element:
{"name": "<exact product name incl. model>", "brand": "<brand>", "priceHint": "<typical Indian street price range in INR, e.g. ₹35,000–45,000>", "category": "<one of: ${categories.join(", ")}, Other>", "reason": "<one sentence on who it's best for>"}`,
  });
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");
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
  const months = lastSixMonthLabels(); // computed by us, not guessed by the model
  const { text } = await generate({
    prompt: `Today is ${currentIndiaDate()}. You are a retail market analyst for India. Give your best ESTIMATES of current consumer buying interest for these product categories: ${categories.join(", ")}.
Respond with ONLY a JSON object (no markdown fences, no prose) of this exact shape:
{"demand":[{"category":"<one of the categories>","score":<integer 0-100, relative buying interest this month>}],
 "trend":[{"month":"<month label>","index":<integer 0-100>}],
 "highlights":[{"category":"<one of the categories>","value":"<short headline stat, e.g. +18% MoM or Peak in Oct>","label":"<3-5 word stat name, e.g. Festive demand surge>","note":"<one short sentence on what is driving this category right now>"}]}
Rules: "demand" has exactly one entry per category listed. "trend" has exactly 6 entries — overall consumer-product buying interest in India for these months, in this exact order (oldest first, ending this month): ${months.join(", ")}. "highlights" has exactly one entry PER CATEGORY listed (same order as the categories), each giving that category's single most notable current-market stat relevant to ${currentIndiaDate()}.`,
  });
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");
  const raw = JSON.parse(cleaned);

  const demand = (Array.isArray(raw.demand) ? raw.demand : [])
    .filter((d) => d && typeof d.category === "string")
    .map((d) => ({ category: d.category, score: clamp100(d.score) }));
  // Month labels are OURS: relabel positionally (last entry = this month) so
  // the chart's x-axis is always right even if the model mislabels.
  const rawTrend = (Array.isArray(raw.trend) ? raw.trend : [])
    .filter((t) => t && t.index !== undefined)
    .slice(-6);
  const trend = rawTrend.map((t, i) => ({
    month: months[months.length - rawTrend.length + i],
    index: clamp100(t.index),
  }));
  // One highlight tile per admin category, kept in the admin's order; any
  // category the model skipped is simply absent (never invented here).
  const rawHighlights = (Array.isArray(raw.highlights) ? raw.highlights : [])
    .filter((h) => h && typeof h.category === "string");
  const highlights = categories
    .map((c) => rawHighlights.find((h) => h.category.toLowerCase() === c.toLowerCase()))
    .filter(Boolean)
    .map((h, i, arr) => ({
      category: categories.find((c) => c.toLowerCase() === h.category.toLowerCase()) ?? h.category,
      label: typeof h.label === "string" ? h.label : "",
      value: String(h.value ?? ""),
      note: typeof h.note === "string" ? h.note : "",
    }));

  if (!demand.length) throw new Error("AI market insights missing demand data");
  // `categories` = the admin list this payload was generated FOR — the board
  // compares it with the current list and regenerates when categories change.
  return { demand, trend, highlights, categories: [...categories] };
}
