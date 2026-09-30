import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/auth/env";
import { sessionCookie } from "@/lib/auth/supabase";
import { GATE_COOKIE, gateToken, isGateOpenPath, safeEqual } from "@/lib/gate";

const noindex = (r: NextResponse) => { r.headers.set("x-robots-tag", "noindex, nofollow"); return r; };

// Runs BEFORE any page renders, so a blocked visitor never triggers a data fetch.
export async function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  const gated = !!password;

  // Fail closed: the live site declares REQUIRE_SITE_PASSWORD. If the secret ever goes missing, show a holding page — never the site.
  if (!gated && process.env.REQUIRE_SITE_PASSWORD && !isGateOpenPath(request.nextUrl.pathname)) {
    return new NextResponse("This site is being set up. Please check back soon.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex, nofollow", "retry-after": "600" } });
  }

  if (gated && !isGateOpenPath(request.nextUrl.pathname)) {
    const cookie = request.cookies.get(GATE_COOKIE)?.value;
    if (!cookie || !safeEqual(cookie, await gateToken(password))) {
      const url = request.nextUrl.clone();
      url.pathname = "/unlock";
      url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
      return noindex(NextResponse.redirect(url, 303));
    }
  }

  // Keep the Supabase session fresh on each request. No-op in demo mode.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return gated ? noindex(NextResponse.next()) : NextResponse.next();
  let response = NextResponse.next({ request });
  const sb = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionCookie(options)));
      },
    },
  });
  await sb.auth.getUser();
  return gated ? noindex(response) : response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
