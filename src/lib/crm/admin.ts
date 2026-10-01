import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { hasAdminElevation } from "@/lib/auth/admin-session";
import type { AuthUser } from "@/lib/auth/types";

// Two locks guard /admin:
//  1) the signed-in email must be listed in ADMIN_EMAILS, and
//  2) that browser must have entered ADMIN_PASSWORD (a separate signed cookie).
// Real deployments (Supabase) ALWAYS require both — with no ADMIN_PASSWORD set, nobody gets in (fails closed).
// Local demo mode with no ADMIN_PASSWORD: any signed-in test user (never in production).
export const adminEmails = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
export const isAdminEmail = (email: string) => adminEmails().includes(email.trim().toLowerCase());

export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  if (adminEmails().length) return isAdminEmail(user.email);
  return auth.mode === "demo" && process.env.NODE_ENV !== "production";
}

export const elevationRequired = () => auth.mode === "supabase" || !!process.env.ADMIN_PASSWORD;

export async function isAdminSession(user: AuthUser | null): Promise<boolean> {
  if (!user || !isAdmin(user)) return false;
  return elevationRequired() ? hasAdminElevation(user.id) : true;
}

/** Server actions and route handlers must call this themselves — never rely on the layout alone. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await auth.getUser();
  if (!(await isAdminSession(user))) throw new Error("Not allowed");
  return user!;
}

/**
 * Every admin PAGE must start with `if (!(await adminGate())) return null;`.
 * Next.js renders a page in parallel with its layout, so the layout's check alone does NOT stop the page's data
 * from being fetched (and streamed in the response body). Checking inside the page prevents the fetch.
 */
export async function adminGate(): Promise<boolean> {
  await connection(); // per-request only: an admin page must never be prerendered at build time
  return isAdminSession(await auth.getUser());
}
