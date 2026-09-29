import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import MlsNotice from "@/components/MlsNotice";
import { getProvider } from "@/lib/listings/provider";
import type { SearchFilters } from "@/lib/listings/types";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const filters: SearchFilters = {
    q: one(p.q) || undefined,
    minPrice: num(p.minPrice),
    maxPrice: num(p.maxPrice),
    beds: num(p.beds),
    baths: num(p.baths),
    type: one(p.type) || undefined,
    sort: (one(p.sort) as SearchFilters["sort"]) || undefined,
    page: num(p.page),
  };
  const res = await getProvider().search(filters);
  const qs = (page: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (typeof v === "string" && k !== "page") u.set(k, v);
    u.set("page", String(page));
    return `/search?${u}`;
  };
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-x py-8">
          <h1 className="text-3xl font-semibold">Homes for sale in Edmonton &amp; area</h1>
          <form className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_.8fr_.8fr_1fr_1fr_auto]">
            <input name="q" defaultValue={filters.q} placeholder="Address, city, or MLS® #" className="field" aria-label="Search" />
            <input name="minPrice" type="number" defaultValue={filters.minPrice} placeholder="Min price" className="field" aria-label="Min price" />
            <input name="maxPrice" type="number" defaultValue={filters.maxPrice} placeholder="Max price" className="field" aria-label="Max price" />
            <select name="beds" defaultValue={filters.beds ?? ""} className="field" aria-label="Bedrooms">
              <option value="">Beds</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
            <select name="baths" defaultValue={filters.baths ?? ""} className="field" aria-label="Bathrooms">
              <option value="">Baths</option>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
            <select name="type" defaultValue={filters.type ?? ""} className="field" aria-label="Property type">
              <option value="">Any type</option>{["Detached", "Condo", "Townhouse", "Duplex"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select name="sort" defaultValue={filters.sort ?? ""} className="field" aria-label="Sort">
              <option value="">Sort by</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
            </select>
            <button className="btn btn-accent">Search</button>
          </form>
        </div>
      </section>
      <div className="container-x py-8">
        <p className="mb-5 text-sm text-ink-soft">
          <b className="text-ink">{res.total}</b> homes · page {res.page} of {res.pageCount}
        </p>
        {/* TODO: map view (Google Maps / Mapbox) */}
        {res.listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <p className="font-display text-xl font-semibold">No homes match those filters</p>
            <p className="mt-1 text-sm text-ink-soft">Try widening the price range or clearing a filter.</p>
            <Link href="/search" className="btn btn-brand mt-5">Clear filters</Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {res.listings.map((l) => <ListingCard key={l.mlsNumber} l={l} />)}
          </div>
        )}
        {res.pageCount > 1 && (
          <nav className="mt-8 flex justify-center gap-3 text-sm">
            {res.page > 1 && <Link href={qs(res.page - 1)} className="btn border border-line bg-white">← Previous</Link>}
            {res.page < res.pageCount && <Link href={qs(res.page + 1)} className="btn border border-line bg-white">Next →</Link>}
          </nav>
        )}
      </div>
      <MlsNotice lastUpdated={res.lastUpdated} />
    </>
  );
}
