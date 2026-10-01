import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { MARKETING_TEXT } from "./consent";
import { DEVICE_COOKIE, deviceCookieOptions, hashToken, newDeviceToken } from "./device";
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


// ---- trusted devices + instant sessions -----------------------------------------------------------------------------
/** Remember this browser for the user (called after signup, an emailed link, or Google). */
export async function trustThisDevice(userId: string) {
  const token = newDeviceToken();
  const h = await headers();
  await admin().from("trusted_devices").insert({ user_id: userId, token_hash: await hashToken(token), user_agent: h.get("user-agent") });
  (await cookies()).set(DEVICE_COOKIE, token, deviceCookieOptions());
}

async function isTrustedDevice(userId: string): Promise<boolean> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return false;
  const { data } = await admin().from("trusted_devices").select("id").eq("user_id", userId).eq("token_hash", await hashToken(token)).maybeSingle();
  return !!data;
}

/** Signs the visitor in server-side without sending an email (the caller has already decided that is allowed). */
async function instantSession(email: string): Promise<string | null> {
  const { data, error } = await admin().auth.admin.generateLink({ type: "magiclink", email });
  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) return null;
  const sb = await userClient();
  const { data: v, error: e2 } = await sb.auth.verifyOtp({ token_hash: hashed, type: (data.properties.verification_type as EmailOtpType) ?? "magiclink" });
  return e2 ? null : v.user?.id ?? null;
}

async function sendLink(email: string) {
  const sb = await userClient();
  return sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${await origin()}/auth/callback` } });
}

export const supabaseBackend: AuthBackend = {
  mode: "supabase",

  // Instant sign-up: the account is created and signed in right away — no email to click. (The email stays "unverified"
  // until the visitor opens an emailed link on some later sign-in from a new device.)
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
    if (uid) { await trustThisDevice(uid); return { ok: true }; }
    // Couldn't start a session directly: fall back to an emailed link.
    const { error } = await sendLink(email);
    if (error) { console.error("[auth] sign-up link failed:", error.message); return { ok: false, error: "Your account was created, but we couldn't sign you in. Please try signing in." }; }
    return { ok: true, needsVerification: true };
  },

  // Returning visitor: on a remembered browser the email alone is enough. Anywhere else they must prove they own the
  // email by opening one emailed link (which then remembers that browser).
  async signIn(email, ctx) {
    const e = email.trim().toLowerCase();
    const { data: p } = await admin().from("profiles").select("id").eq("username", e).maybeSingle();
    if (p && (await isTrustedDevice(p.id))) {
      const uid = await instantSession(e);
      if (uid) {
        await audit(uid, "login_trusted_device", ctx);
        await admin().from("lead_events").insert({ user_id: uid, event_type: "login" });
        return { ok: true };
      }
    }
    const { error } = await sendLink(e);
    if (error) console.error("[auth] sign-in link failed:", error.message); // terminal only; the visitor sees the same message either way
    await audit(p?.id ?? null, error ? "login_link_failed" : "login_link_sent", ctx, { email: e });
    return { ok: true, needsVerification: true }; // same answer either way, so the form can't be used to probe accounts
  },

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
