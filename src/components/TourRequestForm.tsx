"use client";
import { useActionState } from "react";
import { requestTour, type TourState } from "@/app/actions";

const initial: TourState = { ok: false, message: "" };

export default function TourRequestForm({ mls }: { mls: string }) {
  const [state, action, pending] = useActionState(requestTour, initial);
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_40px_-24px_rgb(14_34_56/.4)]">
      <h2 className="text-xl font-semibold">Schedule a tour</h2>
      <p className="text-sm text-ink-soft">Tell us when you&apos;re free and Arman will confirm your showing.</p>
      <input type="hidden" name="mls" value={mls} />
      <input name="name" placeholder="Full name" className="field" required />
      <input name="email" type="email" placeholder="Email" className="field" required />
      <input name="phone" type="tel" placeholder="Phone" className="field" required />
      <label className="flex gap-2 text-xs text-ink-soft">
        <input type="checkbox" name="consent" className="mt-0.5" /> I agree to the Terms of Use and Privacy Policy.
      </label>
      <button disabled={pending} className="btn btn-accent w-full disabled:opacity-60">{pending ? "Sending…" : "Request a showing"}</button>
      {state.message && <p className={state.ok ? "text-sm text-green-700" : "text-sm text-red-700"} role="status">{state.message}</p>}
    </form>
  );
}
