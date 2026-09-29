import Link from "next/link";
import { money } from "@/lib/format";
import type { Listing } from "@/lib/listings/types";
import PropertyArt from "./PropertyArt";

export default function ListingCard({ l }: { l: Listing }) {
  return (
    <Link href={`/listings/${l.mlsNumber}`} className="card-lift group block overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative aspect-[3/2] overflow-hidden">
        {l.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photos[0]} alt={l.addressLabel} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <PropertyArt seed={l.mlsNumber} type={l.propertyType} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">{l.propertyType}</span>
      </div>
      <div className="p-4">
        <p className="font-display text-2xl font-semibold">{money(l.price)}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-soft">
          <span><b className="text-ink">{l.bedrooms}</b> bd</span>
          <span><b className="text-ink">{l.bathrooms}</b> ba</span>
          <span><b className="text-ink">{l.sqft.toLocaleString("en-CA")}</b> sqft</span>
        </p>
        <p className="mt-2 truncate text-sm font-medium">{l.addressLabel}</p>
        <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-ink-soft">
          MLS® {l.mlsNumber} · Listing courtesy of {l.listingBrokerage}
        </p>
      </div>
    </Link>
  );
}
