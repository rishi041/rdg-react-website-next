import { streamText, convertToModelMessages } from "ai";
import { chatModel, hasGeminiKey } from "@/lib/ai";
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
  const { messages } = await req.json();

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

  const result = streamText({
    model: chatModel,
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
