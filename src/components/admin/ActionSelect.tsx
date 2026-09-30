"use client";
import { useState, useTransition } from "react";

// A dropdown that saves as soon as it changes (used for lead and showing status).
export default function ActionSelect({ value, options, action, label }: {
  value: string; options: readonly string[]; action: (v: string) => Promise<void>; label: string;
}) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  return (
    <select aria-label={label} value={v} disabled={pending} className="field !w-auto !py-1.5 capitalize disabled:opacity-60"
      onChange={(e) => { const next = e.target.value; setV(next); start(async () => { await action(next); }); }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
