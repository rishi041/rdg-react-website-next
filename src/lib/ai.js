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
