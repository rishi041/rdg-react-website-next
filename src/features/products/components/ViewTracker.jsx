"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// 📘 Renders nothing — exists only to count a page view from the browser.
// Client-side so router prefetching doesn't inflate counts, with a ref guard
// because React StrictMode double-runs effects in dev.
export default function ViewTracker({ productId }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const supabase = createClient();
    supabase.rpc("increment_views", { product_id: productId }).then(() => {});
  }, [productId]);

  return null;
}
