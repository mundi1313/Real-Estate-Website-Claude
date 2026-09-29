import { headers } from "next/headers";
import { demoBackend } from "./demo";
import { supabaseBackend } from "./supabase";
import type { AuthBackend, RequestCtx } from "./types";

// Real auth once Supabase keys exist; otherwise a local demo backend (never in production).
export const auth: AuthBackend = process.env.NEXT_PUBLIC_SUPABASE_URL ? supabaseBackend : demoBackend;

export async function requestCtx(): Promise<RequestCtx> {
  const h = await headers();
  return {
    ip: h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}
