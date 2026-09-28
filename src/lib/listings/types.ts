// Normalized listing shape used by the UI. The real Bridge (RESO Web API)
// field mapping is confirmed once test-feed access is granted; the raw
// compliance flags below are kept so filtering happens in ONE place.
export interface RawListing {
  mlsNumber: string;
  status: "Active";
  price: number;
  bedrooms: number;
  bathrooms: number; // never round or alter (compliance)
  sqft: number;
  propertyType: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  description: string;
  photos: string[];
  yearBuilt?: number;
  listingBrokerage: string;
  // Compliance flags
  internetDisplay: boolean; // false => must be suppressed entirely
  displayAddress: boolean; // false => show postal code/municipality only
  privateRemarks?: string; // never rendered
  sellerContact?: string; // never rendered
  modifiedAt: string; // ISO
}

export interface Listing {
  mlsNumber: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: string;
  addressLabel: string; // full address, or postal code/municipality if hidden
  addressHidden: boolean;
  city: string;
  lat: number;
  lng: number;
  description: string;
  photos: string[];
  yearBuilt?: number;
  listingBrokerage: string;
  modifiedAt: string;
}

export interface SearchFilters {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  type?: string;
  sort?: "price-asc" | "price-desc" | "newest";
  page?: number;
}

export interface SearchResult {
  listings: Listing[];
  total: number;
  page: number;
  pageCount: number;
  lastUpdated: string; // ISO; rendered in viewer's time zone
}

export interface ListingProvider {
  search(filters: SearchFilters): Promise<SearchResult>;
  getByMls(mlsNumber: string): Promise<Listing | null>;
  similar(listing: Listing, limit?: number): Promise<Listing[]>;
}
