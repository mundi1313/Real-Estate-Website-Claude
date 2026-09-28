import { notFound } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import MlsNotice from "@/components/MlsNotice";
import MortgageCalculator from "@/components/MortgageCalculator";
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
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="flex h-72 items-center justify-center rounded-lg bg-neutral-200 text-neutral-500">Photos</div>
          <h1 className="text-3xl font-bold">{money(l.price)}</h1>
          <p className="text-lg">{l.addressLabel}</p>
          <p className="text-neutral-700">
            {l.bedrooms} bedrooms · {l.bathrooms} bathrooms · {l.sqft.toLocaleString("en-CA")} sqft · {l.propertyType}
            {l.yearBuilt ? ` · Built ${l.yearBuilt}` : ""}
          </p>
          <p className="font-medium">MLS® Number: {l.mlsNumber}</p>
          <p className="text-neutral-800">{l.description}</p>
          <p className="text-xs text-neutral-500">Listing courtesy of {l.listingBrokerage}</p>
          <MortgageCalculator price={l.price} />
          {/* TODO: Walk/Transit/Bike Score — label as third-party (non-MLS®) data with its source */}
        </div>
        <aside className="space-y-4">
          <TourRequestForm mls={l.mlsNumber} />
          <p className="text-sm text-neutral-700">Presented by {site.agent.name}, {site.agent.brokerage}</p>
        </aside>
      </div>
      {similar.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">Similar listings</h2>
          <div className="grid gap-4 sm:grid-cols-3">{similar.map((s) => <ListingCard key={s.mlsNumber} l={s} />)}</div>
        </section>
      )}
      <MlsNotice lastUpdated={new Date().toISOString()} />
    </>
  );
}
