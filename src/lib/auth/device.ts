// "Trusted device": after a visitor proves they own an email (or creates the account on this browser), we remember this
// browser with a random, HttpOnly cookie. Returning on a remembered browser needs only the email; a new browser needs one
// emailed link. Only a SHA-256 hash of the cookie is stored, so a database leak can't be replayed.
export const DEVICE_COOKIE = "td";
export const DEVICE_DAYS = 180;

export function newDeviceToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashToken(token: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const deviceCookieOptions = () => ({
  httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: DEVICE_DAYS * 86400, secure: process.env.NODE_ENV === "production",
});
