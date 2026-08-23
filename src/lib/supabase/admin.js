import { createClient } from "@supabase/supabase-js";

// ⚠ Service-role client — BYPASSES Row Level Security. Server-only: the key
// has no NEXT_PUBLIC_ prefix so Next.js never ships it to the browser.
// Used server-side only, to write the AI caches (search tips/digests/picks,
// ai_trends, ai_insights, products.ai_tip) that visitors may read but never
// write.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
