import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { MARKETING_TEXT } from "./consent";
import { supabaseAnonKey, supabaseServiceKey, supabaseUrl } from "./env";
import { TERMS_VERSION } from "./rules";
import type { AuthBackend, AuthUser, RequestCtx } from "./types";

const url = supabaseUrl;
const anon = supabaseAnonKey;

// RAE: no persistent/auto-login. Dropping maxAge/expires makes auth cookies session cookies,
// so the browser forgets them when it closes.
export const sessionCookie = (o?: CookieOptions): CookieOptions => {
  const { maxAge, expires, ...rest } = o ?? {};
  void maxAge; void expires;
  return rest;
};

async function userClient() {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, sessionCookie(options))); } catch { /* server component: proxy refreshes */ }
      },
    },
  });
}

// Service role: server-only, bypasses RLS. Used for the audit log, lead events and profile completion.
export const admin = () => createClient(url(), supabaseServiceKey(), { auth: { persistSession: false } });

async function audit(userId: string | null, action: string, ctx: RequestCtx, meta: object = {}) {
  await admin().from("audit_log").insert({ user_id: userId, action, ip: ctx.ip, user_agent: ctx.userAgent, meta });
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}


// ---- instant sessions (no email is ever sent) ------------------------------------------------------------------------
/** Signs the visitor in server-side. The caller has already decided that is allowed. */
async function instantSession(email: string): Promise<string | null> {
  const { data, error } = await admin().auth.admin.generateLink({ type: "magiclink", email });
  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) return null;
  const sb = await userClient();
  const { data: v, error: e2 } = await sb.auth.verifyOtp({ token_hash: hashed, type: (data.properties.verification_type as EmailOtpType) ?? "magiclink" });
  return e2 ? null : v.user?.id ?? null;
}

export const supabaseBackend: AuthBackend = {
  mode: "supabase",

  // Instant sign-up: the account is created and the visitor is signed in at once. No email is sent or required.
  async signUp(i, ctx) {
    const email = i.email.trim().toLowerCase();
    const { data: created, error: ce } = await admin().auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: {
        first_name: i.firstName, last_name: i.lastName, phone: i.phone, terms_accepted: true, terms_version: TERMS_VERSION,
        marketing_consent: i.marketingConsent, marketing_consent_text: i.marketingConsent ? MARKETING_TEXT : null,
      },
    });
    if (ce) {
      if (/already|registered|exists/i.test(ce.message)) return supabaseBackend.signIn(email, ctx); // existing email: treat as sign-in
      console.error("[auth] sign-up failed:", ce.message);
      return { ok: false, error: "We couldn't create your account. Please try again in a moment." };
    }
    await audit(created.user.id, "register", ctx);
    await admin().from("lead_events").insert({ user_id: created.user.id, event_type: "signup" });
    const uid = await instantSession(email);
    if (!uid) { console.error("[auth] could not start a session after sign-up"); return { ok: false, error: "Your account was created, but we couldn't sign you in. Please try signing in." }; }
    return { ok: true };
  },

  // Returning visitor: the email alone is enough (admin emails never reach here — the action requires the admin password first).
  async signIn(email, ctx) {
    const e = email.trim().toLowerCase();
    const { data: p } = await admin().from("profiles").select("id").eq("username", e).maybeSingle();
    if (!p) return { ok: false, error: "We couldn't find that email — please sign up.", needsSignup: true };
    const uid = await instantSession(e);
    if (!uid) return { ok: false, error: "We couldn't sign you in right now. Please try again." };
    await audit(uid, "login", ctx);
    await admin().from("lead_events").insert({ user_id: uid, event_type: "login" });
    return { ok: true };
  },

  async signInAsAdmin(email, ctx) {
    const e = email.trim().toLowerCase();
    const { data: p } = await admin().from("profiles").select("id").eq("username", e).maybeSingle();
    if (!p) {
      const { error } = await admin().auth.admin.createUser({ email: e, email_confirm: true, user_metadata: {} });
      if (error && !/already|registered|exists/i.test(error.message)) { console.error("[auth] admin account creation failed:", error.message); return { ok: false, error: "We couldn't sign you in right now." }; }
    }
    const uid = await instantSession(e);
    if (!uid) return { ok: false, error: "We couldn't sign you in right now. Please try again." };
    await audit(uid, "login_admin", ctx);
    return { ok: true };
  },

  async countAdminFailures(ip, windowMs) {
    let q = admin().from("audit_log").select("id", { count: "exact", head: true }).eq("action", "admin_login_failed").gte("created_at", new Date(Date.now() - windowMs).toISOString());
    if (ip) q = q.eq("ip", ip);
    const { count } = await q;
    return count ?? 0;
  },
  async recordAdminFailure(ctx) { await audit(null, "admin_login_failed", ctx); },

  async signOut(ctx) {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    await sb.auth.signOut();
    await audit(data.user?.id ?? null, "logout", ctx);
  },

  async getUser() {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: p } = await admin().from("profiles").select("first_name,last_name,phone,profile_complete").eq("id", data.user.id).maybeSingle();
    return {
      id: data.user.id, email: data.user.email ?? "",
      firstName: p?.first_name ?? "", lastName: p?.last_name ?? "", phone: p?.phone ?? null,
      profileComplete: !!p?.profile_complete,
    } satisfies AuthUser;
  },

  async emailExists(email) {
    const { data } = await admin().from("profiles").select("id").eq("username", email.trim().toLowerCase()).maybeSingle();
    return !!data;
  },

  async completeProfile(i, ctx) {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return { ok: false, error: "Please sign in first." };
    const now = new Date().toISOString();
    const { error } = await admin().from("profiles").update({
      phone: i.phone, terms_accepted_at: now, terms_version: TERMS_VERSION,
      ...(i.firstName && i.lastName ? { first_name: i.firstName, last_name: i.lastName, full_name: `${i.firstName} ${i.lastName}` } : {}),
      ...(i.marketingConsent ? { marketing_consent_at: now, marketing_consent_text: MARKETING_TEXT } : {}),
    }).eq("id", data.user.id);
    if (error) return { ok: false, error: "Could not save your details. Please try again." };
    await audit(data.user.id, "profile_completed", ctx);
    return { ok: true };
  },

  async startGoogle(next) {
    const sb = await userClient();
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    return error || !data.url ? { ok: false, error: "Google sign-in is unavailable right now." } : { ok: true, url: data.url };
  },

  async createTour(i, ctx) {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return { ok: false, error: "Please sign in to book a showing." };
    const { data: p } = await admin().from("profiles").select("first_name,last_name,phone,profile_complete").eq("id", data.user.id).maybeSingle();
    if (!p?.profile_complete) return { ok: false, error: "Please finish your profile first." };
    const { error } = await admin().from("tour_requests").insert({
      user_id: data.user.id, mls_number: i.mls, name: `${p.first_name} ${p.last_name}`.trim(),
      email: data.user.email, phone: p.phone, preferred_times: i.preferredTimes, message: i.message,
    });
    if (error) return { ok: false, error: "Could not send your request. Please try again." };
    await admin().from("lead_events").insert({ user_id: data.user.id, event_type: "tour_requested", mls_number: i.mls });
    await audit(data.user.id, "tour_requested", ctx, { mls: i.mls });
    // TODO: email Arman (Resend) so a tour request is never missed.
    return { ok: true };
  },

  async track(type, mls) {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    if (data.user) await admin().from("lead_events").insert({ user_id: data.user.id, event_type: type, mls_number: mls });
  },
};
