"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminElevateAction } from "@/app/auth/actions";

// Shown to a signed-in admin email that has not yet entered the admin password in this browser.
export default function AdminPasswordPrompt() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="container-x py-20">
      <form className="mx-auto w-full max-w-sm space-y-3 rounded-2xl border border-line bg-white p-6 shadow-sm"
        onSubmit={(e) => { e.preventDefault(); setError(""); start(async () => { const r = await adminElevateAction(pw); if (r.ok) router.refresh(); else setError(r.error); }); }}>
        <h1 className="text-2xl font-semibold">Admin password</h1>
        <p className="text-sm text-ink-soft">Enter your admin password to open the dashboard.</p>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" placeholder="Admin password" aria-label="Admin password" autoComplete="current-password" autoFocus required />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={pending} className="btn btn-brand w-full disabled:opacity-60">{pending ? "Checking…" : "Open dashboard"}</button>
      </form>
    </div>
  );
}
