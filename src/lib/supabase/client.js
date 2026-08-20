import { createBrowserClient } from "@supabase/ssr";

// 📘 Browser client — used inside "use client" components (forms, login, RPC
// calls). It stores the auth session in cookies so the server can see it too.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
