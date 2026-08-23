import { Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateProductTip,
  hasGeminiKey,
  recentlyFailed,
  markFailed,
  clearFailed,
} from "@/lib/ai";

// The "AI tip" card on a product page.
//
// 📘 Async SERVER component. products.ai_tip is a plain column read; when it
// is null (approval never calls Gemini — see approveProduct), the FIRST
// visitor triggers one generation here and the result is written to the DB,
// so every later visit is a read again ("DB first, AI once"). If Gemini is
// down we render nothing and won't retry for a while (cooldown) — so the
// page never stalls on a call that will fail again.
//
// Render it inside <Suspense>: the rest of the page streams to the browser
// immediately and this card pops in when ready (only on that first visit).
export default async function AiTipCard({ product, className = "" }) {
  let tip = product.ai_tip ?? null;

  if (
    !tip &&
    hasGeminiKey() &&
    !recentlyFailed(`tip:product:${product.id}`) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    try {
      tip = await generateProductTip(product);
      const { error } = await createAdminClient()
        .from("products")
        .update({ ai_tip: tip })
        .eq("id", product.id);
      if (error) throw new Error(`ai_tip update failed: ${error.message}`);
      clearFailed(`tip:product:${product.id}`);
    } catch (err) {
      console.error("AI tip backfill failed:", err.message);
      markFailed(`tip:product:${product.id}`);
      tip = null;
    }
  }

  if (!tip) return null;
  return (
    <Card className={`flex items-start gap-3 border-l-4 border-l-accent ${className}`}>
      <i className="uil uil-robot mt-0.5 text-xl text-accent" />
      <div>
        <div className="mb-1 text-sm font-semibold text-title">AI tip</div>
        <p className="text-sm text-body">{tip}</p>
      </div>
    </Card>
  );
}
