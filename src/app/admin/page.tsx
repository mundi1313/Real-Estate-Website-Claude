import Link from "next/link";
import { Card, Pill, Stat, TempPill, eventLabel } from "@/components/admin/ui";
import { fmtDateTime, money, phonePretty, timeAgo, nowMs } from "@/lib/format";
import { getProvider } from "@/lib/listings/provider";
import { adminGate } from "@/lib/crm/admin";
import { loadBoard } from "@/lib/crm/store";

export default async function Overview() {
  if (!(await adminGate())) return null;
  const { rows, events, tours } = await loadBoard();
  const now = nowMs();
  const week = now - 7 * 86_400_000;
  const byId = new Map(rows.map((r) => [r.lead.id, r.lead]));
  const provider = getProvider();
  const openTours = tours.filter((t) => t.status === "new" || t.status === "contacted");
  const newTours = tours.filter((t) => t.status === "new");
  const hot = rows.filter((r) => r.score.temp === "hot").sort((a, b) => b.score.points - a.score.points);
  const recent = events.filter((e) => e.type !== "login").sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  const listings = new Map(await Promise.all([...new Set([...newTours.map((t) => t.mls), ...recent.map((e) => e.mls).filter(Boolean) as string[]])]
    .map(async (m) => [m, await provider.getByMls(m)] as const)));

  return (
    <>
      <h1 className="text-3xl font-semibold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total leads" value={rows.length} />
        <Stat label="New this week" value={rows.filter((r) => Date.parse(r.lead.createdAt) > week).length} />
        <Stat label="Hot leads" value={hot.length} hint="Likely ready to talk" />
        <Stat label="Showings to handle" value={openTours.length} hint={`${newTours.length} brand new`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Showing requests to confirm" action={<Link href="/admin/showings" className="text-sm underline">All showings</Link>}>
          {newTours.length === 0 ? <p className="text-sm text-ink-soft">Nothing waiting. 🎉</p> : (
            <ul className="divide-y divide-line">
              {newTours.slice(0, 6).map((t) => {
                const l = listings.get(t.mls);
                return (
                  <li key={t.id} className="py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={t.userId ? `/admin/leads/${t.userId}` : "/admin/showings"} className="font-semibold underline-offset-2 hover:underline">{t.name}</Link>
                      <span className="text-xs text-ink-soft">{timeAgo(t.createdAt, now)}</span>
                    </div>
                    <p className="text-ink-soft">{l ? `${l.addressLabel} · ${money(l.price)}` : `MLS® ${t.mls}`}</p>
                    <p>Wants: <b>{t.preferredTimes}</b> · <a href={`tel:${t.phone}`} className="underline">{phonePretty(t.phone)}</a></p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Hot leads" action={<Link href="/admin/leads?temp=hot" className="text-sm underline">View all</Link>}>
          {hot.length === 0 ? <p className="text-sm text-ink-soft">No hot leads yet — they appear when someone requests a showing or keeps coming back to homes.</p> : (
            <ul className="divide-y divide-line">
              {hot.slice(0, 6).map((r) => (
                <li key={r.lead.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/admin/leads/${r.lead.id}`} className="font-semibold hover:underline">{r.lead.firstName} {r.lead.lastName}</Link>
                    <TempPill temp={r.score.temp} />
                  </div>
                  <p className="text-ink-soft">{r.score.reasons.slice(0, 3).join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Recent activity">
          {recent.length === 0 ? <p className="text-sm text-ink-soft">No activity yet.</p> : (
            <ul className="divide-y divide-line">
              {recent.map((e) => {
                const lead = byId.get(e.userId); const l = e.mls ? listings.get(e.mls) : null;
                return (
                  <li key={`${e.id}-${e.at}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                    <Link href={`/admin/leads/${e.userId}`} className="font-semibold hover:underline">{lead ? `${lead.firstName} ${lead.lastName}` : "Unknown"}</Link>
                    <Pill kind={e.type === "tour_requested" ? "scheduled" : "cool"}>{eventLabel[e.type] ?? e.type}</Pill>
                    {e.mls && <span className="text-ink-soft">{l ? `${l.addressLabel} · ${money(l.price)}` : `MLS® ${e.mls}`}</span>}
                    <span className="ml-auto text-xs text-ink-soft" title={fmtDateTime(e.at)}>{timeAgo(e.at, now)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
