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

  async signUp(i, ctx) {
    const sb = await userClient();
    const { data, error } = await sb.auth.signUp({
      email: i.email.trim().toLowerCase(),
      password: i.password,
      options: {
        emailRedirectTo: `${await origin()}/auth/callback`,
        data: {
          first_name: i.firstName, last_name: i.lastName, phone: i.phone,
          terms_accepted: true, terms_version: TERMS_VERSION,
          marketing_consent: i.marketingConsent, marketing_consent_text: i.marketingConsent ? MARKETING_TEXT : null,
        },
      },
    });
    if (error) return { ok: false, error: error.message };
    await audit(data.user?.id ?? null, "register", ctx);
    if (data.user) await admin().from("lead_events").insert({ user_id: data.user.id, event_type: "signup" });
    return { ok: true, needsVerification: !data.session }; // email must be verified before the account is active
  },

  async signIn(email, password, ctx) {
    const sb = await userClient();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) {
      await audit(null, "login_failed", ctx, { email });
      return { ok: false, error: error?.message === "Email not confirmed" ? "Please verify your email first — check your inbox." : "Incorrect email or password." };
    }
    const { data: p } = await admin().from("profiles").select("password_expires_at").eq("id", data.user.id).maybeSingle();
    if (p && new Date(p.password_expires_at) < new Date()) {
      await sb.auth.signOut();
      await audit(data.user.id, "login_blocked_password_expired", ctx);
      return { ok: false, error: "Your password has expired (every 90 days). Please reset it via “Forgot password”." };
    }
    await audit(data.user.id, "login", ctx);
    await admin().from("lead_events").insert({ user_id: data.user.id, event_type: "login" });
    return { ok: true };
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

  async track(type, mls) {
    const sb = await userClient();
    const { data } = await sb.auth.getUser();
    if (data.user) await admin().from("lead_events").insert({ user_id: data.user.id, event_type: type, mls_number: mls });
  },
};
