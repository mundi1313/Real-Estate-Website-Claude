import Link from "next/link";
import { setTourStatusAction } from "@/app/admin/actions";
import ActionSelect from "@/components/admin/ActionSelect";
import { Pill } from "@/components/admin/ui";
import { money, phonePretty, timeAgo, nowMs } from "@/lib/format";
import { getProvider } from "@/lib/listings/provider";
import { adminGate } from "@/lib/crm/admin";
import { crm } from "@/lib/crm/store";
import { TOUR_STATUSES } from "@/lib/crm/types";

export default async function Showings({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!(await adminGate())) return null;
  const { show } = await searchParams;
  const all = await crm.tours();
  const open = all.filter((t) => t.status === "new" || t.status === "contacted" || t.status === "scheduled");
  const list = show === "all" ? all : open;
  const provider = getProvider();
  const listings = new Map(await Promise.all([...new Set(list.map((t) => t.mls))].map(async (m) => [m, await provider.getByMls(m)] as const)));
  const now = nowMs();
  const tab = (href: string, on: boolean, text: string) => <Link href={href} className={`rounded-full px-4 py-1.5 text-sm font-medium ${on ? "bg-brand text-white" : "bg-white text-ink-soft"}`}>{text}</Link>;

  return (
    <>
      <h1 className="text-3xl font-semibold">Showing requests</h1>
      <div className="mt-4 flex gap-2">{tab("/admin/showings", show !== "all", `Open (${open.length})`)}{tab("/admin/showings?show=all", show === "all", `All (${all.length})`)}</div>
      <div className="mt-5 space-y-3">
        {list.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">No showing requests here.</p>}
        {list.map((t) => {
          const l = listings.get(t.mls);
          return (
            <article key={t.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{l ? `${l.addressLabel} · ${money(l.price)}` : `MLS® ${t.mls}`}</p>
                  <p className="text-sm text-ink-soft">MLS® {t.mls} · requested {timeAgo(t.createdAt, now)}</p>
                </div>
                <div className="flex items-center gap-2"><Pill kind={t.status} /><ActionSelect label="Showing status" value={t.status} options={TOUR_STATUSES} action={setTourStatusAction.bind(null, t.id)} /></div>
              </div>
              <p className="mt-3 text-sm">Wants <b>{t.preferredTimes}</b></p>
              {t.message && <p className="mt-2 rounded-lg bg-paper p-3 text-sm text-ink-soft">“{t.message}”</p>}
              <p className="mt-3 text-sm">
                {t.userId ? <Link href={`/admin/leads/${t.userId}`} className="font-semibold underline">{t.name}</Link> : <b>{t.name}</b>} ·{" "}
                <a href={`tel:${t.phone}`} className="underline">{phonePretty(t.phone)}</a> · <a href={`mailto:${t.email}`} className="underline">{t.email}</a>
              </p>
            </article>
          );
        })}
      </div>
    </>
  );
}
