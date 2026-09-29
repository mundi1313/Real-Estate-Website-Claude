import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { MARKETING_TEXT } from "./consent";
import { TERMS_VERSION } from "./rules";
import type { AuthBackend, AuthUser } from "./types";

// DEMO BACKEND — local development only. Stores users in .data/demo-auth.json so the whole
// flow can be tried before Supabase is set up. Disabled (no accounts) in production.
const FILE = join(process.cwd(), ".data", "demo-auth.json");
const COOKIE = "demo_session";

interface DemoUser {
  id: string; email: string; firstName: string; lastName: string; phone: string | null;
  termsAt: string | null; marketingAt: string | null; marketingText: string | null; createdAt: string;
}
interface Db { users: DemoUser[]; events: unknown[]; audit: unknown[]; tours: unknown[] }

const off = () => process.env.NODE_ENV === "production";
const UNAVAILABLE = { ok: false, error: "Accounts aren't available yet — please check back soon." } as const;

function load(): Db {
  const empty: Db = { users: [], events: [], audit: [], tours: [] };
  return existsSync(FILE) ? { ...empty, ...(JSON.parse(readFileSync(FILE, "utf8")) as Db) } : empty;
}
function save(db: Db) {
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}
const toUser = (u: DemoUser): AuthUser => ({
  id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, phone: u.phone,
  profileComplete: !!u.phone && !!u.termsAt,
});
const audit = (db: Db, userId: string | null, action: string, ctx: { ip: string | null; userAgent: string | null }) =>
  db.audit.push({ userId, action, ip: ctx.ip, userAgent: ctx.userAgent, at: new Date().toISOString() });
const session = async (id: string) => (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
const currentId = async () => (await cookies()).get(COOKIE)?.value;

export const demoBackend: AuthBackend = {
  mode: "demo",

  async signUp(i, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const email = i.email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email === email);
    if (existing) { audit(db, existing.id, "login", ctx); save(db); await session(existing.id); return { ok: true }; }
    const now = new Date().toISOString();
    const user: DemoUser = {
      id: randomBytes(8).toString("hex"), email, firstName: i.firstName, lastName: i.lastName, phone: i.phone,
      termsAt: now, marketingAt: i.marketingConsent ? now : null, marketingText: i.marketingConsent ? MARKETING_TEXT : null, createdAt: now,
    };
    db.users.push(user);
    db.events.push({ userId: user.id, type: "signup", termsVersion: TERMS_VERSION, at: now });
    audit(db, user.id, "register", ctx);
    save(db);
    await session(user.id); // demo mode skips the emailed link
    return { ok: true };
  },

  async signIn(email, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const u = db.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u) { audit(db, null, "login_failed", ctx); save(db); return { ok: false, error: "No account with that email yet — please sign up first." }; }
    audit(db, u.id, "login", ctx); save(db);
    await session(u.id);
    return { ok: true };
  },

  async signOut(ctx) {
    if (off()) return;
    const store = await cookies();
    const db = load(); audit(db, store.get(COOKIE)?.value ?? null, "logout", ctx); save(db);
    store.delete(COOKIE);
  },

  async getUser() {
    if (off()) return null;
    const id = await currentId();
    const u = id ? load().users.find((x) => x.id === id) : undefined;
    return u ? toUser(u) : null;
  },

  async completeProfile(i, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const id = await currentId();
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

  async createTour(i, ctx) {
    if (off()) return UNAVAILABLE;
    const id = await currentId();
    const db = load();
    const u = db.users.find((x) => x.id === id);
    if (!u || !u.phone) return { ok: false, error: "Please sign in to book a showing." };
    db.tours.push({ userId: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, phone: u.phone, ...i, at: new Date().toISOString() });
    db.events.push({ userId: u.id, type: "tour_requested", mls: i.mls, at: new Date().toISOString() });
    audit(db, u.id, "tour_requested", ctx); save(db);
    return { ok: true };
  },

  async track(type, mls) {
    if (off()) return;
    const id = await currentId();
    if (!id) return;
    const db = load(); db.events.push({ userId: id, type, mls, at: new Date().toISOString() }); save(db);
  },
};
