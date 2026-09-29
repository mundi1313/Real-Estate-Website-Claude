import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { MARKETING_TEXT } from "./consent";
import { TERMS_VERSION } from "./rules";
import type { AuthBackend, AuthUser, RequestCtx } from "./types";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
const admin = () => createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function audit(userId: string | null, action: string, ctx: RequestCtx, meta: object = {}) {
  await admin().from("audit_log").insert({ user_id: userId, action, ip: ctx.ip, user_agent: ctx.userAgent, meta });
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

export const supabaseBackend: AuthBackend = {
  mode: "supabase",

  // Passwordless: Supabase emails a one-time sign-in link. Creating the user here (with their details as
  // metadata) lets the DB trigger build the profile; the account is confirmed when they open the link.
  async signUp(i, ctx) {
    const sb = await userClient();
    const { data, error } = await sb.auth.signInWithOtp({
      email: i.email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${await origin()}/auth/callback`,
        data: {
          first_name: i.firstName, last_name: i.lastName, phone: i.phone,
          terms_accepted: true, terms_version: TERMS_VERSION,
          marketing_consent: i.marketingConsent, marketing_consent_text: i.marketingConsent ? MARKETING_TEXT : null,
        },
      },
    });
    void data;
    if (error) return { ok: false, error: "We couldn't send your sign-in link. Please try again in a moment." };
    await audit(null, "register_link_sent", ctx, { email: i.email.trim().toLowerCase() });
    return { ok: true, needsVerification: true };
  },

  async signIn(email, ctx) {
    const sb = await userClient();
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: `${await origin()}/auth/callback` },
    });
    // Same answer either way, so the form can't be used to discover who has an account.
    await audit(null, error ? "login_link_failed" : "login_link_sent", ctx, { email: email.trim().toLowerCase() });
    return { ok: true, needsVerification: true };
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

  async completeProfile(i, ctx) {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return { ok: false, error: "Please sign in first." };
    const now = new Date().toISOString();
    const { error } = await admin().from("profiles").update({
      phone: i.phone, terms_accepted_at: now, terms_version: TERMS_VERSION,
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
