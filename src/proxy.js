import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 📘 Next 16 renamed `middleware.js` to `proxy.js` — same job: run on the
// server before a request completes. Here it (1) refreshes the Supabase auth
// session cookie and (2) redirects logged-out visitors away from /admin.
export async function proxy(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Supabase not configured yet (fresh clone) — don't block the site.
  // http:// is accepted for the local Docker stack.
  if (!url || !url.startsWith("http")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session if expired — required for server components to see it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (
    !user &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
