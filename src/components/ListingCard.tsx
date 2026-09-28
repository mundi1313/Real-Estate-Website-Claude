import Link from "next/link";
import { money } from "@/lib/format";
import type { Listing } from "@/lib/listings/types";

export default function ListingCard({ l }: { l: Listing }) {
  return (
    <Link href={`/listings/${l.mlsNumber}`} className="block rounded-lg border bg-white p-4 shadow-sm hover:shadow">
      <div className="mb-3 flex h-36 items-center justify-center rounded bg-neutral-200 text-xs text-neutral-500">
        {l.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photos[0]} alt={l.addressLabel} className="h-full w-full rounded object-cover" />
        ) : (
          "Photo"
        )}
      </div>
      <p className="text-lg font-semibold">{money(l.price)}</p>
      <p className="text-sm text-neutral-700">
        {l.bedrooms} bd · {l.bathrooms} ba · {l.sqft.toLocaleString("en-CA")} sqft
      </p>
      <p className="text-sm">{l.addressLabel}</p>
      <p className="mt-1 text-xs text-neutral-500">MLS® {l.mlsNumber} · Listing courtesy of {l.listingBrokerage}</p>
    </Link>
  );
}
