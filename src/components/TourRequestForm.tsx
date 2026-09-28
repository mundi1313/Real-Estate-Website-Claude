"use client";
import { useActionState } from "react";
import { requestTour, type TourState } from "@/app/actions";

const initial: TourState = { ok: false, message: "" };

export default function TourRequestForm({ mls }: { mls: string }) {
  const [state, action, pending] = useActionState(requestTour, initial);
  const field = "w-full rounded border px-2 py-1";
  return (
    <form action={action} className="space-y-2 rounded-lg border bg-white p-4 text-sm">
      <h2 className="font-semibold">Schedule a tour</h2>
      <input type="hidden" name="mls" value={mls} />
      <input name="name" placeholder="Full name" className={field} required />
      <input name="email" type="email" placeholder="Email" className={field} required />
      <input name="phone" type="tel" placeholder="Phone" className={field} required />
      <label className="flex gap-2 text-xs">
        <input type="checkbox" name="consent" /> I agree to the Terms of Use and Privacy Policy.
      </label>
      <button disabled={pending} className="w-full rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-60">
        {pending ? "Sending…" : "Request showing"}
      </button>
      {state.message && <p className={state.ok ? "text-green-700" : "text-red-700"} role="status">{state.message}</p>}
    </form>
  );
}
