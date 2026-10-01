import { NextResponse, type NextRequest } from "next/server";
import { demoConsumeLink } from "@/lib/auth/demo";

// Local demo mode only: stands in for the link in the sign-in email. Never available in production.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SUPABASE_URL) return new NextResponse("Not found", { status: 404 });
  const ok = await demoConsumeLink(req.nextUrl.searchParams.get("t") ?? "");
  return NextResponse.redirect(new URL(ok ? "/?welcome=1" : "/?auth=failed", req.url));
}
