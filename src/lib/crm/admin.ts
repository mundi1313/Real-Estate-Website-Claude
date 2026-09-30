import { connection } from "next/server";
import { auth } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth/types";

// Who may open /admin: emails listed in ADMIN_EMAILS (comma-separated).
// Local demo mode with no list set: any signed-in test user (never in production).
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  const list = (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length) return list.includes(user.email.toLowerCase());
  return auth.mode === "demo" && process.env.NODE_ENV !== "production";
}

/** Server actions and route handlers must call this themselves — never rely on the layout alone. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await auth.getUser();
  if (!isAdmin(user)) throw new Error("Not allowed");
  return user!;
}

/**
 * Every admin PAGE must start with `if (!(await adminGate())) return null;`.
 * Next.js renders a page in parallel with its layout, so the layout's check alone does NOT stop the page's data
 * from being fetched (and streamed in the response body). Checking inside the page prevents the fetch.
 */
export async function adminGate(): Promise<boolean> {
  await connection(); // per-request only: an admin page must never be prerendered at build time
  return isAdmin(await auth.getUser());
}
