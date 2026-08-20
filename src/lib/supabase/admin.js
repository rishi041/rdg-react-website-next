import { createClient } from "@supabase/supabase-js";

// ⚠ Service-role client — BYPASSES Row Level Security. Server-only: the key
// has no NEXT_PUBLIC_ prefix so Next.js never ships it to the browser.
// Used only by /api/search-tip to write the AI tip cache.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
