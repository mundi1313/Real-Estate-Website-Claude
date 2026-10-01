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
export interface DemoEvent { userId: string; type: string; mls?: string | null; at: string; termsVersion?: string }
export interface DemoTour { id?: string; userId: string; name: string; email: string; phone: string; mls: string; preferredTimes: string; message: string; at: string; status?: string }
export interface DemoNote { id: string; userId: string; note: string; at: string }
export type DemoUserRec = DemoUser & { status?: string; source?: string };
export interface Db { users: DemoUserRec[]; events: DemoEvent[]; audit: unknown[]; tours: DemoTour[]; notes: DemoNote[] }

const off = () => process.env.NODE_ENV === "production";
const UNAVAILABLE = { ok: false, error: "Accounts aren't available yet — please check back soon." } as const;

function load(): Db {
  const empty: Db = { users: [], events: [], audit: [], tours: [], notes: [] };
  return existsSync(FILE) ? { ...empty, ...(JSON.parse(readFileSync(FILE, "utf8")) as Db) } : empty;
}
function save(db: Db) {
  mkdirSync(join(process.cwd(), ".data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}
export const demoDb = { load: () => load(), save: (db: Db) => save(db) };
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
    await session(user.id); // instant sign-up: no email to click
    return { ok: true };
  },

  async signIn(email, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const u = db.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u) return { ok: false, error: "We couldn't find that email — please sign up.", needsSignup: true };
    audit(db, u.id, "login", ctx); save(db);
    await session(u.id);
    return { ok: true };
  },

  async signInAsAdmin(email, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const e = email.trim().toLowerCase();
    let u = db.users.find((x) => x.email === e);
    if (!u) {
      const now = new Date().toISOString();
      u = { id: randomBytes(8).toString("hex"), email: e, firstName: "", lastName: "", phone: null, termsAt: null, marketingAt: null, marketingText: null, createdAt: now };
      db.users.push(u);
    }
    audit(db, u.id, "login_admin", ctx); save(db);
    await session(u.id);
    return { ok: true };
  },

  async countAdminFailures(ip, windowMs) {
    const since = Date.now() - windowMs;
    return (load().audit as { action: string; ip: string | null; at: string }[]).filter((a) => a.action === "admin_login_failed" && Date.parse(a.at) >= since && (!ip || a.ip === ip)).length;
  },
  async recordAdminFailure(ctx) { const db = load(); audit(db, null, "admin_login_failed", ctx); save(db); },

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

  async emailExists(email) {
    if (off()) return false;
    return load().users.some((u) => u.email === email.trim().toLowerCase());
  },

  async completeProfile(i, ctx) {
    if (off()) return UNAVAILABLE;
    const db = load();
    const id = await currentId();
    const u = db.users.find((x) => x.id === id);
    if (!u) return { ok: false, error: "Please sign in first." };
    const now = new Date().toISOString();
    u.phone = i.phone; u.termsAt = now;
    if (i.firstName && i.lastName) { u.firstName = i.firstName; u.lastName = i.lastName; }
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
    db.tours.push({ id: randomBytes(6).toString("hex"), userId: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, phone: u.phone, mls: i.mls, preferredTimes: i.preferredTimes, message: i.message, at: new Date().toISOString(), status: "new" });
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
