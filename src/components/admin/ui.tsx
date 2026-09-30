import type { Temp } from "@/lib/crm/score";

const tones: Record<string, string> = {
  hot: "bg-red-100 text-red-800", warm: "bg-amber-100 text-amber-800", cool: "bg-slate-100 text-slate-600",
  new: "bg-blue-100 text-blue-800", contacted: "bg-indigo-100 text-indigo-800", scheduled: "bg-emerald-100 text-emerald-800",
  nurturing: "bg-violet-100 text-violet-800", client: "bg-green-100 text-green-800", closed: "bg-slate-200 text-slate-600",
  done: "bg-green-100 text-green-800", cancelled: "bg-slate-200 text-slate-500",
};

export function Pill({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tones[kind] ?? tones.cool}`}>{children ?? kind}</span>;
}
export const TempPill = ({ temp }: { temp: Temp }) => <Pill kind={temp}>{temp === "hot" ? "🔥 Hot" : temp === "warm" ? "Warm" : "Cool"}</Pill>;

export function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export const Card = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-2xl border border-line bg-white p-5">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>
    {children}
  </section>
);

export const eventLabel: Record<string, string> = {
  signup: "Signed up", login: "Signed back in", listing_view: "Viewed a home", tour_requested: "Requested a showing",
  listing_saved: "Saved a home", search_saved: "Saved a search", return_visit: "Returned to the site",
};
