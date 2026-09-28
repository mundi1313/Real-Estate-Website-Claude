import { site } from "@/lib/site";
import { toDisplayListing, toDisplayListings } from "./compliance";
import type { Listing, ListingProvider, RawListing, SearchFilters, SearchResult } from "./types";

// SAMPLE DATA ONLY — fictional listings for development until the RAE/Bridge
// test feed is available. Never shown in production (see provider.ts).
const streets = ["Jasper Ave", "104 St NW", "82 Ave NW", "Whyte Ave", "124 St NW", "Rabbit Hill Rd", "Ellerslie Rd", "137 Ave NW"];
const cities = ["Edmonton", "St. Albert", "Sherwood Park", "Leduc"];
const types = ["Detached", "Condo", "Townhouse", "Duplex"];
const postal = ["T5J", "T6E", "T5K", "T6G", "T5P", "T6R", "T6W", "T5X"];

const raw: RawListing[] = Array.from({ length: 36 }, (_, i) => ({
  mlsNumber: `E${4500000 + i * 137}`,
  status: "Active",
  price: 189000 + ((i * 47311) % 700000),
  bedrooms: 1 + (i % 5),
  bathrooms: [1, 1.5, 2, 2.5, 3][i % 5],
  sqft: 650 + ((i * 173) % 2400),
  propertyType: types[i % 4],
  street: `${1000 + i * 37} ${streets[i % streets.length]}`,
  city: cities[i % cities.length],
  province: "AB",
  postalCode: `${postal[i % postal.length]} ${1 + (i % 9)}A${1 + (i % 9)}`,
  lat: 53.4 + ((i * 0.013) % 0.25),
  lng: -113.7 + ((i * 0.021) % 0.4),
  description: "Sample listing description for development purposes only. Bright open layout, updated kitchen, close to transit and shopping.",
  photos: [],
  yearBuilt: 1960 + ((i * 7) % 64),
  listingBrokerage: "Sample Realty",
  internetDisplay: i !== 5, // exercised by the compliance filter
  displayAddress: i % 9 !== 4,
  privateRemarks: "Combo 1234 — never shown",
  sellerContact: "Seller 780-555-0100 — never shown",
  modifiedAt: new Date().toISOString(),
}));

function matches(l: Listing, f: SearchFilters) {
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!`${l.addressLabel} ${l.mlsNumber} ${l.city}`.toLowerCase().includes(q)) return false;
  }
  if (f.minPrice && l.price < f.minPrice) return false;
  if (f.maxPrice && l.price > f.maxPrice) return false;
  if (f.beds && l.bedrooms < f.beds) return false;
  if (f.baths && l.bathrooms < f.baths) return false;
  if (f.type && l.propertyType !== f.type) return false;
  return true;
}

export const mockProvider: ListingProvider = {
  async search(f) {
    const all = toDisplayListings(raw).filter((l) => matches(l, f));
    if (f.sort === "price-asc") all.sort((a, b) => a.price - b.price);
    else if (f.sort === "price-desc") all.sort((a, b) => b.price - a.price);
    const page = Math.max(1, f.page ?? 1);
    const pageCount = Math.max(1, Math.ceil(all.length / site.pageSize));
    return {
      listings: all.slice((page - 1) * site.pageSize, page * site.pageSize),
      total: all.length,
      page,
      pageCount,
      lastUpdated: new Date().toISOString(),
    } satisfies SearchResult;
  },
  async getByMls(mls) {
    const r = raw.find((x) => x.mlsNumber === mls && x.internetDisplay);
    return r ? toDisplayListing(r) : null;
  },
  async similar(l, limit = 3) {
    return toDisplayListings(raw)
      .filter((x) => x.mlsNumber !== l.mlsNumber && x.propertyType === l.propertyType)
      .sort((a, b) => Math.abs(a.price - l.price) - Math.abs(b.price - l.price))
      .slice(0, limit);
  },
};
