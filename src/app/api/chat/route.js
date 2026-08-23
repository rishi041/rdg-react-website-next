import { convertToModelMessages } from "ai";
import { streamWithFallback, hasGeminiKey } from "@/lib/ai";
import { getApprovedProducts } from "@/features/products/queries";

// Stop generation after 30s no matter what (protects serverless bills).
export const maxDuration = 30;

// 📘 The chat endpoint is the one place we use streamText instead of
// generateText: a human is watching, so tokens should appear as they're
// generated (Server-Sent Events over a ReadableStream — open the Network tab
// and watch the "chat" request receive chunks one at a time).
export async function POST(req) {
  if (!hasGeminiKey()) {
    return new Response("AI is not configured", { status: 503 });
  }

  // useChat POSTs the full message history as UIMessages on every turn —
  // the server is stateless, no conversation is stored anywhere.
  // Validate the shape: it's a public endpoint, so cap size and keep only
  // text parts (no files/tool parts are ever forwarded to Gemini).
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!Array.isArray(body?.messages)) {
    return new Response("Bad request", { status: 400 });
  }
  const MAX_MESSAGES = 30;
  const MAX_CHARS = 8000;
  let budget = MAX_CHARS;
  const messages = body.messages
    .slice(-MAX_MESSAGES)
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({
      ...m,
      parts: (Array.isArray(m.parts) ? m.parts : [])
        .filter((p) => p?.type === "text" && typeof p.text === "string")
        .map((p) => {
          const text = p.text.slice(0, Math.max(0, budget));
          budget -= text.length;
          return { type: "text", text };
        }),
    }))
    .filter((m) => m.parts.length > 0);
  if (!messages.length) {
    return new Response("Bad request", { status: 400 });
  }

  // Ground the assistant in the REAL board: fetch the approved products on
  // every request so new approvals are instantly part of its knowledge.
  const products = await getApprovedProducts();
  const catalog = products
    .map(
      (p) =>
        `- ${p.name} (${p.category}${p.location ? ", from " + p.location : ""}): ${
          p.description || "no description"
        } [id: ${p.id}]`
    )
    .join("\n");

  // 📘 same model fallback as the cached features, streaming-aware: if the
  // primary model is out of daily free quota (429) or overloaded (503) the
  // reply streams from the next model instead of failing the message.
  const result = await streamWithFallback({
    system: `You are the friendly shopping assistant for a small community product board.

Products currently on the board:
${catalog || "(the board is empty right now)"}

Rules:
- If a board product fits what the visitor wants, recommend it by name and link it as [Product Name](/products/<its id from the catalog>).
- When you recommend a product that is NOT on the board, give the visitor a direct link to find it: [Product Name](https://www.google.com/search?q=Product+Name) — URL-encode the query.
- Links must use exactly that [text](url) form, and ONLY those two URL shapes — never invent store or website URLs.
- Otherwise give brief, practical buying advice (ask 1-2 clarifying questions max), and mention they can add ideas via the Suggest page.
- Keep replies short — 2 to 5 sentences. No markdown other than links, no bullet lists.`,
    messages: await convertToModelMessages(messages),
    // 📘 Forward the request's abort signal: when the visitor hits Stop (or
    // closes the widget mid-stream), fetch aborts and generation stops on the
    // server too instead of running to completion in the background.
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
