import Link from "next/link";
import { notFound } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import MlsNotice from "@/components/MlsNotice";
import MortgageCalculator from "@/components/MortgageCalculator";
import PropertyArt from "@/components/PropertyArt";
import TourRequestForm from "@/components/TourRequestForm";
import { money } from "@/lib/format";
import { getProvider } from "@/lib/listings/provider";
import { site } from "@/lib/site";

export default async function ListingPage({ params }: { params: Promise<{ mls: string }> }) {
  const { mls } = await params;
  const provider = getProvider();
  const l = await provider.getByMls(mls);
  if (!l) notFound();
  const similar = await provider.similar(l);
  const facts: [string, string][] = [
    ["Bedrooms", String(l.bedrooms)],
    ["Bathrooms", String(l.bathrooms)],
    ["Square feet", l.sqft.toLocaleString("en-CA")],
    ["Type", l.propertyType],
    ...(l.yearBuilt ? ([["Year built", String(l.yearBuilt)]] as [string, string][]) : []),
    ["MLS® Number", l.mlsNumber],
  ];
  return (
    <>
      <div className="container-x py-6">
        <Link href="/search" className="text-sm text-ink-soft hover:text-ink">← Back to search</Link>
        <div className="mt-4 grid gap-2 overflow-hidden rounded-3xl md:h-[26rem] md:grid-cols-[2fr_1fr] md:grid-rows-2">
          <PropertyArt seed={l.mlsNumber} type={l.propertyType} className="h-64 w-full md:row-span-2 md:h-full" />
          <PropertyArt seed={l.mlsNumber + "b"} type={l.propertyType} className="hidden h-full w-full md:block" />
          <PropertyArt seed={l.mlsNumber + "c"} type={l.propertyType} className="hidden h-full w-full md:block" />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            <div>
              <p className="font-display text-4xl font-semibold">{money(l.price)}</p>
              <p className="mt-1 text-lg">{l.addressLabel}</p>
              <p className="mt-1 text-sm text-ink-soft">MLS® {l.mlsNumber}</p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k} className="bg-white p-4">
                  <dt className="text-xs text-ink-soft">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <section>
              <h2 className="text-xl font-semibold">About this home</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{l.description}</p>
              <p className="mt-3 text-xs text-ink-soft">Listing courtesy of {l.listingBrokerage}</p>
            </section>
            <MortgageCalculator price={l.price} />
            {/* TODO: Walk/Transit/Bike Score — label as third-party (non-MLS®) data with its source */}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <TourRequestForm mls={l.mlsNumber} />
            <p className="rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft">
              Presented by <b className="text-ink">{site.agent.name}</b>, {site.agent.title}<br />
              {site.agent.team} · {site.agent.brokerage}
            </p>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-semibold">Similar homes</h2>
            <div className="grid gap-6 sm:grid-cols-3">{similar.map((s) => <ListingCard key={s.mlsNumber} l={s} />)}</div>
          </section>
        )}
      </div>
      <MlsNotice lastUpdated={new Date().toISOString()} />
    </>
  );
}
