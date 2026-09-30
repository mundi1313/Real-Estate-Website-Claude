// Site-wide password gate (used while the site is a work in progress).
// Set SITE_PASSWORD to turn it on; remove it to open the site to everyone.
// Uses only Web Crypto so it runs identically in Node and on Cloudflare Workers.
export const GATE_COOKIE = "site_gate";
const enc = new TextEncoder();

/** Cookie value: an HMAC keyed by the password itself, so changing the password logs everyone out. */
export async function gateToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("keys-to-edmonton-site-gate-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const safeNext = (n: string | null | undefined) => (n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/");

/** Paths reachable without the password. Static build assets contain code only, never data. */
export const isGateOpenPath = (p: string) => p === "/unlock" || p === "/robots.txt" || p === "/favicon.ico" || p.startsWith("/_next/");
