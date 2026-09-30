"use server";
import { revalidatePath } from "next/cache";
import { auth, requestCtx } from "@/lib/auth";
import { isEmail, normalizePhone } from "@/lib/auth/rules";
import type { AuthResult } from "@/lib/auth/types";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string): AuthResult => ({ ok: false, error });
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

export async function signUpAction(f: {
  email: string; firstName: string; lastName: string; phone: string;
  acceptTerms: boolean; marketingConsent: boolean; website?: string;
}): Promise<AuthResult> {
  if (f.website) return { ok: true }; // honeypot: bots fill hidden fields
  const email = str(f.email), firstName = str(f.firstName), lastName = str(f.lastName);
  const phone = normalizePhone(str(f.phone));
  if (!firstName || !lastName) return fail("Please enter your first and last name.");
  if (!isEmail(email)) return fail("Please enter a valid email address.");
  if (!phone) return fail("Please enter a valid 10-digit phone number.");
  if (!f.acceptTerms) return fail("Please agree to the Terms of Use and Privacy Policy to continue.");
  const res = await auth.signUp({ email, firstName, lastName, phone, marketingConsent: !!f.marketingConsent }, await requestCtx());
  revalidatePath("/", "layout");
  return res;
}

export async function signInAction(f: { email: string }): Promise<AuthResult> {
  if (!isEmail(str(f.email))) return fail("Please enter a valid email address.");
  const res = await auth.signIn(str(f.email), await requestCtx());
  revalidatePath("/", "layout");
  return res;
}

export async function signOutAction(): Promise<void> {
  await auth.signOut(await requestCtx());
  revalidatePath("/", "layout");
}

export async function completeProfileAction(f: { phone: string; acceptTerms: boolean; marketingConsent: boolean; firstName?: string; lastName?: string }): Promise<AuthResult> {
  const user = await auth.getUser();
  if (!user) return fail("Please sign in first.");
  const phone = normalizePhone(str(f.phone));
  if (!phone) return fail("Please enter a valid 10-digit phone number.");
  const firstName = str(f.firstName), lastName = str(f.lastName);
  if (!user.firstName && (!firstName || !lastName)) return fail("Please enter your first and last name.");
  if (!f.acceptTerms) return fail("Please agree to the Terms of Use and Privacy Policy to continue.");
  const res = await auth.completeProfile({ phone, marketingConsent: !!f.marketingConsent, ...(user.firstName ? {} : { firstName, lastName }) }, await requestCtx());
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

export async function requestTourAction(f: { mls: string; date: string; time: string; message: string }): Promise<AuthResult> {
  if (!/^[A-Za-z0-9-]{3,20}$/.test(f.mls)) return fail("Sorry, that listing could not be found.");
  const date = str(f.date), time = str(f.time), message = str(f.message).slice(0, 1000);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Please choose a preferred date.");
  if (!["Morning", "Afternoon", "Evening"].includes(time)) return fail("Please choose a preferred time of day.");
  return auth.createTour({ mls: f.mls, preferredTimes: `${date} · ${time}`, message }, await requestCtx());
}
