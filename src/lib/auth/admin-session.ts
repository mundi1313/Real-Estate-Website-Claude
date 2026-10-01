import { cookies } from "next/headers";
import { hmacHex, safeEqual } from "@/lib/gate";

// Admin elevation: even a signed-in admin email must ALSO have entered ADMIN_PASSWORD in this browser. This is a separate
// signed cookie (HMAC keyed by the password), so however a session was obtained, /admin still needs the password.
const COOKIE = "admin_ok";
const TTL_HOURS = 12;
const secure = () => process.env.NODE_ENV === "production";

export async function verifyAdminPassword(given: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !given) return false;
  // Compare HMACs of both values so timing doesn't reveal how close a guess was.
  return safeEqual(await hmacHex(given, "admin-pw-check-v1"), await hmacHex(pw, "admin-pw-check-v1"));
}

export async function issueAdminCookie(userId: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return;
  const exp = Date.now() + TTL_HOURS * 3600_000;
  (await cookies()).set(COOKIE, `${exp}.${await hmacHex(pw, `admin-v1|${userId}|${exp}`)}`, {
    httpOnly: true, sameSite: "strict", path: "/", maxAge: TTL_HOURS * 3600, secure: secure(),
  });
}

export async function hasAdminElevation(userId: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!pw || !raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, await hmacHex(pw, `admin-v1|${userId}|${exp}`));
}

export async function clearAdminCookie() { (await cookies()).delete(COOKIE); }
