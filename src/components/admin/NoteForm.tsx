"use client";
import { useState, useTransition } from "react";

export default function NoteForm({ action }: { action: (note: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; start(async () => { await action(text); setText(""); }); }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={4000} className="field"
        placeholder="Call notes, budget, timeline, what they're looking for…" aria-label="New note" />
      <button disabled={pending || !text.trim()} className="btn btn-brand disabled:opacity-50">{pending ? "Saving…" : "Add note"}</button>
    </form>
  );
}
