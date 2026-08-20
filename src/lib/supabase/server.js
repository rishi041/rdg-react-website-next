import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// 📘 Server client — used in Server Components, Server Actions, and Route
// Handlers. Auth lives in cookies, and cookies only exist per-request on the
// server, so this client is created fresh for every request.
// Note: cookies() is async in Next 15+ — hence the await.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore, the proxy
            // (src/proxy.js) refreshes sessions instead.
          }
        },
      },
    }
  );
}
