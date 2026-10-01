"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminSignInAction, checkEmailAction, completeProfileAction, googleAction, signInAction, signOutAction, signUpAction } from "@/app/auth/actions";
import { MARKETING_TEXT, TERMS_TEXT } from "@/lib/auth/consent";
import { isEmail } from "@/lib/auth/rules";
import type { AuthUser } from "@/lib/auth/types";

export type Step = "start" | "details" | "adminpw" | "complete";

interface Props {
  step: Step; setStep: (s: Step) => void; onClose: () => void; onDone: () => void;
  mode: "supabase" | "demo"; notice: string; user: AuthUser | null; forced: boolean;
}

type Outcome = { ok: boolean; error?: string; next?: "details" | "adminpw" | "done"; url?: string };

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

export default function AuthModal({ step, setStep, onClose, onDone, mode, notice, user, forced }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(notice);
  const [email, setEmail] = useState("");
  const [f, setF] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: "", website: "" });
  const [adminPw, setAdminPw] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !forced) onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, forced]);

  const go = (s: Step) => { setError(""); setStep(s); };
  const run = (fn: () => Promise<Outcome>, then: (o: Outcome) => void) =>
    start(async () => {
      setError("");
      const o = await fn();
      if (!o.ok) setError(o.error ?? "Something went wrong. Please try again.");
      else then(o);
    });
  const route = (o: Outcome) => (o.next === "adminpw" ? go("adminpw") : o.next === "details" ? go("details") : onDone());

  // One entry point for "I typed my email": admin -> password; registered -> signed in; new -> signup form. No emails are sent.
  const continueWithEmail = (): Promise<Outcome> => (async () => {
    if (!isEmail(email)) return { ok: false, error: "Please enter a valid email address." };
    const c = await checkEmailAction(email);
    if (!c.ok) return { ok: false, error: "Please enter a valid email address." };
    if (c.admin) return { ok: true, next: "adminpw" };
    if (!c.exists) return { ok: true, next: "details" };
    const r = await signInAction({ email });
    if (r.ok) return { ok: true, next: "done" };
    if (r.needsPassword) return { ok: true, next: "adminpw" };
    if (r.needsSignup) return { ok: true, next: "details" };
    return { ok: false, error: r.error };
  })();

  const title = step === "adminpw" ? "Admin sign-in" : step === "complete" ? "One last step" : "Continue Your Home Search";

  const consent = (
    <div className="space-y-2.5 text-xs leading-relaxed text-ink-soft">
      <label className="flex gap-2"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 shrink-0" required />
        <span>{TERMS_TEXT.replace("Terms of Use and Privacy Policy.", "")}<Link href="/terms" target="_blank" className="underline">Terms of Use</Link> and <Link href="/privacy" target="_blank" className="underline">Privacy Policy</Link>. <span className="text-red-700">*</span></span></label>
      <label className="flex gap-2"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 shrink-0" />
        <span>{MARKETING_TEXT}</span></label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-deep/70 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (!forced && e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative my-8 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        {!forced && <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-ink-soft hover:bg-paper">✕</button>}
        <div className="px-7 pb-7 pt-8">
          <h2 className="text-center text-2xl font-semibold">{title}</h2>
          {step === "start" && <p className="mt-1 text-center text-sm text-ink-soft">Free account — book tours and get updates. Just your email to get in.</p>}
          {mode === "demo" && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-center text-[11px] text-amber-800">Demo mode: accounts are stored locally on this computer.</p>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {step === "start" && (
            <div className="mt-6 space-y-4">
              <button type="button" disabled={pending} onClick={() => run(async () => { const r = await googleAction(window.location.pathname + window.location.search); if (r.ok && r.url) window.location.href = r.url; return r.ok ? { ok: true } : { ok: false, error: r.error }; }, () => {})}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white py-3 text-sm font-semibold shadow-sm transition hover:bg-paper disabled:opacity-60">
                <GoogleG /> Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-ink-soft"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
              <form onSubmit={(e) => { e.preventDefault(); run(continueWithEmail, route); }} className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@website.com" className="field" aria-label="Email" autoComplete="email" required />
                <button disabled={pending} className="btn btn-brand w-full disabled:opacity-60">{pending ? "One moment…" : "Continue with email →"}</button>
              </form>
              {forced && pathname.startsWith("/listings") && <p className="text-center text-xs"><Link href="/search" className="text-ink-soft underline">← Back to all homes</Link></p>}
            </div>
          )}

          {step === "details" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const r = await signUpAction({ email, ...f, acceptTerms: terms, marketingConsent: marketing });
                if (r.ok) return { ok: true, next: "done" };
                return r.needsPassword ? { ok: true, next: "adminpw" } : { ok: false, error: r.error };
              }, route);
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

          {step === "adminpw" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => {
              e.preventDefault();
              run(async () => { const r = await adminSignInAction({ email, password: adminPw }); return r.ok ? { ok: true, next: "done" } : { ok: false, error: r.error }; },
                () => { onDone(); router.push("/admin"); });
            }}>
              <p className="text-center text-sm text-ink-soft">Enter your admin password to continue.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" aria-label="Admin email" required />
              <input type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} placeholder="Admin password" className="field" autoComplete="current-password" aria-label="Admin password" autoFocus required />
              <button disabled={pending} className="btn btn-brand w-full disabled:opacity-60">{pending ? "Checking…" : "Sign in as admin"}</button>
              <p className="text-center text-sm text-ink-soft"><button type="button" onClick={() => go("start")} className="underline">← Back</button></p>
            </form>
          )}

          {step === "complete" && (
            <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await completeProfileAction({ phone: f.phone, acceptTerms: terms, marketingConsent: marketing, firstName: f.firstName, lastName: f.lastName }); return r.ok ? { ok: true, next: "done" } : { ok: false, error: r.error }; }, route); }}>
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
              {forced && <p className="text-center text-xs text-ink-soft">Not you? <button type="button" onClick={() => start(async () => { await signOutAction(); onDone(); })} className="underline">Sign out</button></p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
