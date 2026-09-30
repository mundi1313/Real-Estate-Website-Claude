import Link from "next/link";
import { notFound } from "next/navigation";
import { addNoteAction, setLeadStatusAction, setTourStatusAction } from "@/app/admin/actions";
import ActionSelect from "@/components/admin/ActionSelect";
import NoteForm from "@/components/admin/NoteForm";
import { Card, Pill, Stat, TempPill, eventLabel } from "@/components/admin/ui";
import { fmtDate, fmtDateTime, money, phonePretty, timeAgo, nowMs } from "@/lib/format";
import { getProvider } from "@/lib/listings/provider";
import { scoreLead } from "@/lib/crm/score";
import { adminGate } from "@/lib/crm/admin";
import { crm } from "@/lib/crm/store";
import { LEAD_STATUSES, TOUR_STATUSES } from "@/lib/crm/types";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await adminGate())) return null;
  const { id } = await params;
  const lead = await crm.lead(id);
  if (!lead) notFound();
  const [events, tours, notes] = await Promise.all([crm.events(id), crm.tours(id), crm.notes(id)]);
  const score = scoreLead(events, tours);
  const now = nowMs();
  const provider = getProvider();

  const viewCounts = new Map<string, { n: number; last: string }>();
  for (const e of events) if (e.type === "listing_view" && e.mls) {
    const c = viewCounts.get(e.mls); viewCounts.set(e.mls, { n: (c?.n ?? 0) + 1, last: !c || e.at > c.last ? e.at : c.last });
  }
  const mlsList = [...new Set([...viewCounts.keys(), ...tours.map((t) => t.mls)])];
  const listings = new Map(await Promise.all(mlsList.map(async (m) => [m, await provider.getByMls(m)] as const)));
  const viewed = [...viewCounts.entries()].sort((a, b) => b[1].n - a[1].n || b[1].last.localeCompare(a[1].last));
  const prices = viewed.map(([m]) => listings.get(m)?.price).filter((x): x is number => !!x);
  const types = [...new Set(viewed.map(([m]) => listings.get(m)?.propertyType).filter(Boolean))];
  const label = (m: string) => { const l = listings.get(m); return l ? `${l.addressLabel} · ${money(l.price)}` : `MLS® ${m}`; };
  const timeline = [...events].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <Link href="/admin/leads" className="text-sm text-ink-soft hover:text-ink">← All leads</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{lead.firstName} {lead.lastName}</h1>
        <TempPill temp={score.temp} />
        <div className="ml-auto flex items-center gap-2 text-sm"><span className="text-ink-soft">Stage</span>
          <ActionSelect label="Lead stage" value={lead.status} options={LEAD_STATUSES} action={setLeadStatusAction.bind(null, lead.id)} />
        </div>
      </div>
      {score.reasons.length > 0 && <p className="mt-2 text-sm text-ink-soft">Why {score.temp}: {score.reasons.join(" · ")}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Homes viewed" value={score.homesViewed} hint={prices.length ? `${money(Math.min(...prices))} – ${money(Math.max(...prices))}${types.length ? ` · ${types.join(", ")}` : ""}` : undefined} />
        <Stat label="Showing requests" value={tours.length} />
        <Stat label="Last activity" value={timeAgo(score.lastActivity, now)} hint={score.lastActivity ? fmtDateTime(score.lastActivity) : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Showings">
            {tours.length === 0 ? <p className="text-sm text-ink-soft">No showing requests yet.</p> : (
              <ul className="divide-y divide-line">
                {tours.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold">{label(t.mls)}</p>
                      <p>Wants <b>{t.preferredTimes}</b> · requested {timeAgo(t.createdAt, now)}</p>
                      {t.message && <p className="mt-1 rounded-lg bg-paper p-2 text-ink-soft">“{t.message}”</p>}
                    </div>
                    <ActionSelect label="Showing status" value={t.status} options={TOUR_STATUSES} action={setTourStatusAction.bind(null, t.id)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Notes">
            <NoteForm action={addNoteAction.bind(null, lead.id)} />
            {notes.length > 0 && (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-paper p-3 text-sm"><p className="whitespace-pre-wrap">{n.note}</p><p className="mt-1 text-xs text-ink-soft">{fmtDateTime(n.createdAt)}</p></li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Activity timeline">
            {timeline.length === 0 ? <p className="text-sm text-ink-soft">No activity recorded.</p> : (
              <ol className="space-y-3 border-l-2 border-line pl-4">
                {timeline.map((e) => (
                  <li key={`${e.id}-${e.at}`} className="relative text-sm">
                    <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                    <span className="font-medium">{eventLabel[e.type] ?? e.type}</span>
                    {e.mls && <span className="text-ink-soft"> — {label(e.mls)}</span>}
                    <p className="text-xs text-ink-soft">{fmtDateTime(e.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Contact">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-ink-soft">Email</dt><dd><a href={`mailto:${lead.email}`} className="underline">{lead.email}</a></dd></div>
              <div><dt className="text-xs text-ink-soft">Phone</dt><dd>{lead.phone ? <a href={`tel:${lead.phone}`} className="underline">{phonePretty(lead.phone)}</a> : <Pill kind="new">Not provided yet</Pill>}</dd></div>
              <div><dt className="text-xs text-ink-soft">Signed up</dt><dd>{fmtDateTime(lead.createdAt)} via {lead.source === "google" ? "Google" : "email"}</dd></div>
            </dl>
          </Card>
          <Card title="Consent on file">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-ink-soft">Terms of Use & Privacy Policy</dt><dd>{lead.termsAt ? `Agreed ${fmtDate(lead.termsAt)}` : "Not yet"}</dd></div>
              <div><dt className="text-xs text-ink-soft">Calls, texts & email marketing</dt>
                <dd>{lead.marketingAt ? <>Agreed {fmtDate(lead.marketingAt)}</> : <span className="text-amber-800">No marketing consent — only reply to their own requests</span>}</dd></div>
            </dl>
            {lead.marketingText && <details className="mt-3 text-xs text-ink-soft"><summary className="cursor-pointer">Exact wording they agreed to</summary><p className="mt-2">{lead.marketingText}</p></details>}
          </Card>
          <Card title="Homes they looked at">
            {viewed.length === 0 ? <p className="text-sm text-ink-soft">None yet.</p> : (
              <ul className="space-y-2 text-sm">
                {viewed.map(([m, c]) => <li key={m}><Link href={`/listings/${m}`} className="hover:underline">{label(m)}</Link><span className="ml-1 text-xs text-ink-soft">{c.n > 1 ? `· viewed ${c.n}×` : ""}</span></li>)}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
