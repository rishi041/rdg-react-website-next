"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

// 📘 Client component: it needs onClick. Counts the click via an atomic
// SECURITY DEFINER RPC (see supabase/schema.sql) — anonymous visitors can
// bump the counter but have no UPDATE access to anything else.
export default function BuyNowButton({ product, compact = false }) {
  const handleClick = (e) => {
    e.preventDefault(); // the card wrapping this button is itself a link
    e.stopPropagation();
    const supabase = createClient();
    // fire-and-forget — don't make the visitor wait for the counter
    supabase.rpc("increment_clicks", { product_id: product.id }).then(() => {});
    window.open(product.link, "_blank", "noopener,noreferrer");
  };

  return compact ? (
    <Button onClick={handleClick} className="w-full !px-3 !py-1.5 !text-xs">
      Buy <i className="uil uil-arrow-right" />
    </Button>
  ) : (
    <Button onClick={handleClick} className="px-8 text-base">
      Buy Now <i className="uil uil-shopping-cart" />
    </Button>
  );
}
