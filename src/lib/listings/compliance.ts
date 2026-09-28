import { site } from "@/lib/site";
import type { Listing, RawListing } from "./types";

// IDX brokerages that have opted out. Populate from RAE's opt-out list.
export const optedOutBrokerages = new Set<string>([]);

/**
 * The single choke point between raw feed data and anything rendered.
 * - drops Internet Display = 'N' and opted-out brokerage listings
 * - hides address when Display Address = 'N' (postal code / municipality only)
 * - strips private remarks and seller contact info (they are not in `Listing`)
 * - passes numeric values through unchanged (no rounding)
 */
export function toDisplayListings(raw: RawListing[]): Listing[] {
  return raw
    .filter((r) => r.internetDisplay && !optedOutBrokerages.has(r.listingBrokerage))
    .slice(0, site.maxListingsTotal)
    .map(toDisplayListing);
}

export function toDisplayListing(r: RawListing): Listing {
  const hidden = !r.displayAddress;
  return {
    mlsNumber: r.mlsNumber,
    price: r.price,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    sqft: r.sqft,
    propertyType: r.propertyType,
    addressLabel: hidden ? `${r.postalCode.slice(0, 3)} area, ${r.city}` : `${r.street}, ${r.city}`,
    addressHidden: hidden,
    city: r.city,
    // Hidden address => coarse coordinates so the pin cannot reveal the home.
    lat: hidden ? Math.round(r.lat * 50) / 50 : r.lat,
    lng: hidden ? Math.round(r.lng * 50) / 50 : r.lng,
    description: r.description,
    photos: r.photos,
    yearBuilt: r.yearBuilt,
    listingBrokerage: r.listingBrokerage,
    modifiedAt: r.modifiedAt,
  };
}
