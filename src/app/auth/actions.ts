"use server";
import { revalidatePath } from "next/cache";
import { auth, requestCtx } from "@/lib/auth";
import { isEmail, normalizePhone, passwordProblem } from "@/lib/auth/rules";
import type { AuthResult } from "@/lib/auth/types";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string): AuthResult => ({ ok: false, error });
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

export async function signUpAction(f: {
  email: string; password: string; firstName: string; lastName: string; phone: string;
  acceptTerms: boolean; marketingConsent: boolean; website?: string;
}): Promise<AuthResult> {
  if (f.website) return { ok: true }; // honeypot: bots fill hidden fields
  const email = str(f.email), firstName = str(f.firstName), lastName = str(f.lastName);
  const phone = normalizePhone(str(f.phone));
  if (!firstName || !lastName) return fail("Please enter your first and last name.");
  if (!isEmail(email)) return fail("Please enter a valid email address.");
  if (!phone) return fail("Please enter a valid 10-digit phone number.");
  const pw = passwordProblem(f.password ?? "");
  if (pw) return fail(pw);
  if (!f.acceptTerms) return fail("Please agree to the Terms of Use and Privacy Policy to continue.");
  const res = await auth.signUp({ email, password: f.password, firstName, lastName, phone, marketingConsent: !!f.marketingConsent }, await requestCtx());
  revalidatePath("/", "layout");
  return res;
}

export async function signInAction(f: { email: string; password: string }): Promise<AuthResult> {
  if (!isEmail(str(f.email)) || !f.password) return fail("Please enter your email and password.");
  const res = await auth.signIn(str(f.email), f.password, await requestCtx());
  revalidatePath("/", "layout");
  return res;
}

export async function signOutAction(): Promise<void> {
  await auth.signOut(await requestCtx());
  revalidatePath("/", "layout");
}

export async function completeProfileAction(f: { phone: string; acceptTerms: boolean; marketingConsent: boolean }): Promise<AuthResult> {
  const phone = normalizePhone(str(f.phone));
  if (!phone) return fail("Please enter a valid 10-digit phone number.");
  if (!f.acceptTerms) return fail("Please agree to the Terms of Use and Privacy Policy to continue.");
  const res = await auth.completeProfile({ phone, marketingConsent: !!f.marketingConsent }, await requestCtx());
  revalidatePath("/", "layout");
  return res;
}

export async function googleAction(next: string): Promise<AuthResult> {
  return auth.startGoogle(safeNext(next));
}

export async function trackAction(type: "listing_view" | "tour_requested", mls: string): Promise<void> {
  if (!/^[A-Za-z0-9-]{3,20}$/.test(mls)) return;
  await auth.track(type, mls);
}
