import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookie } from "@/lib/auth/supabase";

// Landing point for Google sign-in and for the email-verification link.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const store = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: (l) => l.forEach(({ name, value, options }) => store.set(name, value, sessionCookie(options))) },
  });
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  let ok = false;
  if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash) ok = !(await sb.auth.verifyOtp({ token_hash: tokenHash, type: "email" })).error;
  const dest = new URL(ok ? safe : "/?auth=failed", url.origin);
  if (ok) dest.searchParams.set("welcome", "1"); // client opens the phone/consent step if the profile is incomplete
  return NextResponse.redirect(dest);
}
