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
  const field = "rounded border px-2 py-1 text-sm";
  return (
    <>
      <form className="mb-6 flex flex-wrap gap-2 rounded-lg border bg-white p-3">
        <input name="q" defaultValue={filters.q} placeholder="Address, city, or MLS® #" className={`${field} w-56`} />
        <input name="minPrice" type="number" defaultValue={filters.minPrice} placeholder="Min price" className={`${field} w-28`} />
        <input name="maxPrice" type="number" defaultValue={filters.maxPrice} placeholder="Max price" className={`${field} w-28`} />
        <select name="beds" defaultValue={filters.beds ?? ""} className={field}>
          <option value="">Beds</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
        <select name="baths" defaultValue={filters.baths ?? ""} className={field}>
          <option value="">Baths</option>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}+</option>)}
        </select>
        <select name="type" defaultValue={filters.type ?? ""} className={field}>
          <option value="">Any type</option>{["Detached", "Condo", "Townhouse", "Duplex"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select name="sort" defaultValue={filters.sort ?? ""} className={field}>
          <option value="">Sort</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option>
        </select>
        <button className="rounded bg-blue-700 px-4 py-1 text-sm text-white">Search</button>
      </form>
      <p className="mb-3 text-sm text-neutral-600">{res.total} homes · page {res.page} of {res.pageCount}</p>
      {/* TODO: map view (Google Maps / Mapbox) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {res.listings.map((l) => <ListingCard key={l.mlsNumber} l={l} />)}
      </div>
      {res.pageCount > 1 && (
        <nav className="mt-6 flex justify-center gap-4 text-sm">
          {res.page > 1 && <Link href={qs(res.page - 1)}>← Previous</Link>}
          {res.page < res.pageCount && <Link href={qs(res.page + 1)}>Next →</Link>}
        </nav>
      )}
      <MlsNotice lastUpdated={res.lastUpdated} />
    </>
  );
}
