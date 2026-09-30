import Link from "next/link";
import { Pill, TempPill } from "@/components/admin/ui";
import { fmtDate, phonePretty, timeAgo, nowMs } from "@/lib/format";
import { adminGate } from "@/lib/crm/admin";
import { loadBoard } from "@/lib/crm/store";
import { LEAD_STATUSES } from "@/lib/crm/types";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!(await adminGate())) return null;
  const p = await searchParams;
  const q = one(p.q).toLowerCase(), temp = one(p.temp), status = one(p.status), sort = one(p.sort) || "activity";
  const { rows } = await loadBoard();
  const list = rows
    .filter((r) => !q || `${r.lead.firstName} ${r.lead.lastName} ${r.lead.email} ${r.lead.phone ?? ""}`.toLowerCase().includes(q))
    .filter((r) => !temp || r.score.temp === temp)
    .filter((r) => !status || r.lead.status === status)
    .sort((a, b) => sort === "score" ? b.score.points - a.score.points
      : sort === "joined" ? b.lead.createdAt.localeCompare(a.lead.createdAt)
      : (b.score.lastActivity ?? "").localeCompare(a.score.lastActivity ?? ""));
  const now = nowMs();

  return (
    <>
      <h1 className="text-3xl font-semibold">Leads <span className="text-lg font-normal text-ink-soft">({list.length}{list.length !== rows.length ? ` of ${rows.length}` : ""})</span></h1>
      <form className="mt-5 flex flex-wrap gap-2">
        <input name="q" defaultValue={one(p.q)} placeholder="Search name, email or phone" className="field !w-64" aria-label="Search" />
        <select name="temp" defaultValue={temp} className="field !w-auto" aria-label="Temperature"><option value="">Any temperature</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cool">Cool</option></select>
        <select name="status" defaultValue={status} className="field !w-auto capitalize" aria-label="Status"><option value="">Any status</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select name="sort" defaultValue={sort} className="field !w-auto" aria-label="Sort"><option value="activity">Latest activity</option><option value="score">Hottest first</option><option value="joined">Newest signups</option></select>
        <button className="btn btn-brand !py-2">Filter</button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
            <tr><th className="p-3">Lead</th><th className="p-3">Contact</th><th className="p-3">Status</th><th className="p-3">Temperature</th><th className="p-3">Homes viewed</th><th className="p-3">Showings</th><th className="p-3">Last activity</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-ink-soft">No leads match.</td></tr>}
            {list.map(({ lead, score, tours, openTours }) => (
              <tr key={lead.id} className="hover:bg-paper/60">
                <td className="p-3"><Link href={`/admin/leads/${lead.id}`} className="font-semibold hover:underline">{lead.firstName} {lead.lastName}</Link><p className="text-xs text-ink-soft">Joined {fmtDate(lead.createdAt)} · {lead.source === "google" ? "Google" : "Email"}</p></td>
                <td className="p-3"><a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a><br /><a href={`tel:${lead.phone ?? ""}`} className="text-ink-soft hover:underline">{phonePretty(lead.phone)}</a></td>
                <td className="p-3"><Pill kind={lead.status} /></td>
                <td className="p-3"><TempPill temp={score.temp} /></td>
                <td className="p-3">{score.homesViewed}</td>
                <td className="p-3">{tours.length}{openTours ? <span className="ml-1 text-xs font-semibold text-accent-deep">({openTours} open)</span> : null}</td>
                <td className="p-3 text-ink-soft">{timeAgo(score.lastActivity, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
