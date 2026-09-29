"use client";
import { useState, useTransition } from "react";
import { requestTourAction } from "@/app/auth/actions";
import { useAuth } from "./AuthProvider";

const today = () => new Date().toISOString().slice(0, 10);

export default function TourRequestForm({ mls }: { mls: string }) {
  const { user, open } = useAuth();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ date: "", time: "Afternoon", message: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_40px_-24px_rgb(14_34_56/.4)]">
      <h2 className="text-xl font-semibold">Schedule a tour</h2>
      {!user || !user.profileComplete ? (
        <>
          <p className="text-sm text-ink-soft">A free account takes about 10 seconds — then booking is one tap.</p>
          <button onClick={() => open(user ? "complete" : "start")} className="btn btn-accent w-full">Sign up to book a showing</button>
        </>
      ) : msg?.ok ? (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{msg.text}</p>
      ) : (
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault(); setMsg(null);
          start(async () => {
            const r = await requestTourAction({ mls, ...f });
            setMsg(r.ok ? { ok: true, text: "Thanks! Arman will contact you to confirm your showing." } : { ok: false, text: r.error });
          });
        }}>
          <p className="rounded-xl bg-paper p-3 text-sm">
            Booking as <b>{user.firstName} {user.lastName}</b><br />
            <span className="text-ink-soft">{user.email}{user.phone ? ` · ${user.phone.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3")}` : ""}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium">Preferred date
              <input type="date" min={today()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="field mt-1" required /></label>
            <label className="text-xs font-medium">Time of day
              <select value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className="field mt-1">
                <option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
          </div>
          <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={2} maxLength={1000}
            placeholder="Anything Arman should know? (optional)" className="field" />
          <button disabled={pending} className="btn btn-accent w-full disabled:opacity-60">{pending ? "Sending…" : "Request a showing"}</button>
          {msg && !msg.ok && <p role="alert" className="text-sm text-red-700">{msg.text}</p>}
        </form>
      )}
    </section>
  );
}
