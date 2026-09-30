"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { completeProfileAction, googleAction, signInAction, signUpAction } from "@/app/auth/actions";
import { MARKETING_TEXT, TERMS_TEXT } from "@/lib/auth/consent";
import { isEmail } from "@/lib/auth/rules";
import type { AuthUser } from "@/lib/auth/types";

export type Step = "start" | "details" | "login" | "verify" | "complete";

interface Props {
  step: Step; setStep: (s: Step) => void; onClose: () => void; onDone: () => void;
  mode: "supabase" | "demo"; notice: string; user: AuthUser | null;
}

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

export default function AuthModal({ step, setStep, onClose, onDone, mode, notice, user }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState(notice);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<"signup" | "login">("signup");
  const [f, setF] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: "", website: "" });
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const go = (s: Step) => { setError(""); setStep(s); };
  const run = (fn: () => Promise<{ ok: boolean; error?: string; needsVerification?: boolean; url?: string }>, then: (r: { needsVerification?: boolean; url?: string }) => void) =>
    start(async () => {
      setError("");
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong. Please try again.");
      else then(r);
    });

  const title = step === "login" ? "Welcome back" : step === "verify" ? "Check your email" : step === "complete" ? "One last step" : "Continue Your Home Search";

  const consent = (
    <div className="space-y-2.5 text-xs leading-relaxed text-ink-soft">
      <label className="flex gap-2"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 shrink-0" required />
        <span>{TERMS_TEXT.replace("Terms of Use and Privacy Policy.", "")}<Link href="/terms" target="_blank" className="underline">Terms of Use</Link> and <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>. <span className="text-red-700">*</span></span></label>
      <label className="flex gap-2"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 shrink-0" />
        <span>{MARKETING_TEXT}</span></label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-deep/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative my-8 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-ink-soft hover:bg-paper">✕</button>
        <div className="px-7 pb-7 pt-8">
          <h2 className="pr-6 text-center text-2xl font-semibold">{title}</h2>
          {step === "start" && <p className="mt-1 text-center text-sm text-ink-soft">Free account — save homes, book tours and get updates.</p>}
          {mode === "demo" && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-center text-[11px] text-amber-800">Demo mode: accounts are stored locally and sign-in links are skipped.</p>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {step === "start" && (
            <div className="mt-6 space-y-4">
              <button type="button" disabled={pending} onClick={() => run(() => googleAction(window.location.pathname + window.location.search), (r) => { if (r.url) window.location.href = r.url; })}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white py-3 text-sm font-semibold shadow-sm transition hover:bg-paper disabled:opacity-60">
                <GoogleG /> Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-ink-soft"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
              <form onSubmit={(e) => { e.preventDefault(); if (!isEmail(email)) return setError("Please enter a valid email address."); go("details"); }} className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@website.com" className="field" aria-label="Email" autoComplete="email" required />
                <button className="btn btn-brand w-full">Continue with email →</button>
              </form>
              <p className="text-center text-sm text-ink-soft">Returning user? <button onClick={() => go("login")} className="font-semibold text-brand underline">Log in here</button></p>
            </div>
          )}

          {step === "details" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => {
              e.preventDefault();
              run(() => signUpAction({ email, ...f, acceptTerms: terms, marketingConsent: marketing }), (r) => { if (r.needsVerification) { setSent("signup"); go("verify"); } else onDone(); });
            }}>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium">First name *<input value={f.firstName} onChange={set("firstName")} className="field mt-1" autoComplete="given-name" required /></label>
                <label className="text-xs font-medium">Last name *<input value={f.lastName} onChange={set("lastName")} className="field mt-1" autoComplete="family-name" required /></label>
              </div>
              <label className="block text-xs font-medium">Email *<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1" autoComplete="email" required /></label>
              <label className="block text-xs font-medium">Phone *<input type="tel" value={f.phone} onChange={set("phone")} placeholder="(780) 555-0123" className="field mt-1" autoComplete="tel" required /></label>
              <input name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              {consent}
              <button disabled={pending} className="btn btn-accent w-full disabled:opacity-60">{pending ? "Creating account…" : "Create my account"}</button>
              <p className="text-center text-sm text-ink-soft"><button type="button" onClick={() => go("start")} className="underline">← Back</button></p>
            </form>
          )}

          {step === "login" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => signInAction({ email }), (r) => { if (r.needsVerification) { setSent("login"); go("verify"); } else onDone(); }); }}>
              <p className="text-center text-sm text-ink-soft">Enter your email and we&apos;ll send you a link to sign in — no password needed. New here? We&apos;ll set up your free account when you open the link.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="field" autoComplete="email" required />
              <button disabled={pending} className="btn btn-brand w-full disabled:opacity-60">{pending ? "Sending…" : "Email me a sign-in link"}</button>
              <p className="text-center text-sm text-ink-soft">New here? <button type="button" onClick={() => go("start")} className="font-semibold text-brand underline">Create an account</button></p>
            </form>
          )}

          {step === "verify" && (
            <div className="mt-6 space-y-3 text-center text-sm text-ink-soft">
              <p>We sent a {sent === "signup" ? "verification" : "sign-in"} link to <b className="text-ink">{email}</b>.</p>
              <p>Open it on this device to {sent === "signup" ? "activate your account and sign in" : "sign in"}. If you don&apos;t see it, check your spam folder.</p>
              <button onClick={onClose} className="btn btn-brand mt-2">Got it</button>
            </div>
          )}

          {step === "complete" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => completeProfileAction({ phone: f.phone, acceptTerms: terms, marketingConsent: marketing, firstName: f.firstName, lastName: f.lastName }), onDone); }}>
              <p className="text-center text-sm text-ink-soft">Welcome{user?.firstName ? `, ${user.firstName}` : ""}! {user?.firstName ? "We just need your phone number" : "We just need your name and phone number"} so Arman can reach you about tours.</p>
              {!user?.firstName && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium">First name *<input value={f.firstName} onChange={set("firstName")} className="field mt-1" autoComplete="given-name" required /></label>
                  <label className="text-xs font-medium">Last name *<input value={f.lastName} onChange={set("lastName")} className="field mt-1" autoComplete="family-name" required /></label>
                </div>
              )}
              <label className="block text-xs font-medium">Phone *<input type="tel" value={f.phone} onChange={set("phone")} placeholder="(780) 555-0123" className="field mt-1" autoComplete="tel" required /></label>
              {consent}
              <button disabled={pending} className="btn btn-accent w-full disabled:opacity-60">{pending ? "Saving…" : "Continue"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
