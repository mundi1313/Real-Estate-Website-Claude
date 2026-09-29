import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { MARKETING_TEXT } from "./consent";
import { TERMS_VERSION } from "./rules";
import type { AuthBackend, AuthUser } from "./types";

// DEMO BACKEND — local development only. Stores users in .data/demo-auth.json so the whole
// signup flow can be tried before Supabase is set up. Refuses to run in production.
const FILE = join(process.cwd(), ".data", "demo-auth.json");
const COOKIE = "demo_session";

interface DemoUser {
  id: string; email: string; firstName: string; lastName: string; phone: string | null;
  hash: string; termsAt: string | null; marketingAt: string | null; marketingText: string | null;
  passwordChangedAt: string; createdAt: string;
}
interface Db { users: DemoUser[]; events: unknown[]; audit: unknown[] }

// In production the demo store is disabled (no accounts) rather than crashing the site.
const off = () => process.env.NODE_ENV === "production";
const UNAVAILABLE = { ok: false, error: "Accounts aren't available yet — please check back soon." } as const;
function guard() {
  if (off()) throw new Error("Demo auth backend cannot run in production.");
}
function load(): Db {
  guard();
  return existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as Db) : { users: [], events: [], audit: [] };
}
function save(db: Db) {
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}
const hash = (pw: string) => { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`; };
const verify = (pw: string, h: string) => {
  const [salt, key] = h.split(":");
  return timingSafeEqual(Buffer.from(key, "hex"), scryptSync(pw, salt, 32));
};
const toUser = (u: DemoUser): AuthUser => ({
  id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, phone: u.phone,
  profileComplete: !!u.phone && !!u.termsAt,
});
const audit = (db: Db, userId: string | null, action: string, ctx: { ip: string | null; userAgent: string | null }) =>
  db.audit.push({ userId, action, ip: ctx.ip, userAgent: ctx.userAgent, at: new Date().toISOString() });

export const demoBackend: AuthBackend = {
  mode: "demo",
  async signUp(i, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const email = i.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) return { ok: false, error: "An account with this email already exists. Please sign in." };
    const now = new Date().toISOString();
    const user: DemoUser = {
      id: randomBytes(8).toString("hex"), email, firstName: i.firstName, lastName: i.lastName, phone: i.phone,
      hash: hash(i.password), termsAt: now, marketingAt: i.marketingConsent ? now : null,
      marketingText: i.marketingConsent ? MARKETING_TEXT : null, passwordChangedAt: now, createdAt: now,
    };
    db.users.push(user);
    db.events.push({ userId: user.id, type: "signup", termsVersion: TERMS_VERSION, at: now });
    audit(db, user.id, "register", ctx);
    save(db);
    // Demo mode skips email verification and signs the user straight in.
    (await cookies()).set(COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
    return { ok: true };
  },
  async signIn(email, password, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const u = db.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u || !verify(password, u.hash)) { audit(db, u?.id ?? null, "login_failed", ctx); save(db); return { ok: false, error: "Incorrect email or password." }; }
    audit(db, u.id, "login", ctx); save(db);
    (await cookies()).set(COOKIE, u.id, { httpOnly: true, sameSite: "lax", path: "/" });
    return { ok: true };
  },
  async signOut(ctx) {
    if (off()) return;
    const store = await cookies();
    const id = store.get(COOKIE)?.value ?? null;
    const db = load(); audit(db, id, "logout", ctx); save(db);
    store.delete(COOKIE);
  },
  async getUser() {
    if (off()) return null;
    const id = (await cookies()).get(COOKIE)?.value;
    if (!id) return null;
    const u = load().users.find((x) => x.id === id);
    return u ? toUser(u) : null;
  },
  async completeProfile(i, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const id = (await cookies()).get(COOKIE)?.value;
    const u = db.users.find((x) => x.id === id);
    if (!u) return { ok: false, error: "Please sign in first." };
    const now = new Date().toISOString();
    u.phone = i.phone; u.termsAt = now;
    if (i.marketingConsent) { u.marketingAt = now; u.marketingText = MARKETING_TEXT; }
    audit(db, u.id, "profile_completed", ctx); save(db);
    return { ok: true };
  },
  async startGoogle() {
    return { ok: false, error: "Google sign-in needs the Supabase keys (see docs/AUTH_SETUP.md). Demo mode supports email signup only." };
  },
  async track(type, mls) {
    if (off()) return;
    const id = (await cookies()).get(COOKIE)?.value;
    if (!id) return;
    const db = load(); db.events.push({ userId: id, type, mls, at: new Date().toISOString() }); save(db);
  },
};
