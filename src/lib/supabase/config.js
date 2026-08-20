// True once real Supabase credentials are in .env.local (see SETUP.md).
// Lets the app run with friendly fallbacks before the backend is configured.
// http:// is accepted for the local Docker stack (`npx supabase start`).
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && url.startsWith("http"));
}
