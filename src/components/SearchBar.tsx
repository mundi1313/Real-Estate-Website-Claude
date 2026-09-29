// Big hero search: submits to /search as a plain GET form (no JS needed).
export default function SearchBar() {
  return (
    <form action="/search" className="grid gap-2 rounded-2xl bg-white p-2.5 shadow-2xl shadow-black/25 sm:grid-cols-[1.6fr_1fr_1fr_auto]">
      <input name="q" placeholder="Neighbourhood, city, address or MLS® #" className="field !border-0 !bg-paper" aria-label="Location" />
      <select name="maxPrice" className="field !border-0 !bg-paper" aria-label="Max price" defaultValue="">
        <option value="">Any price</option>
        {[300000, 400000, 500000, 650000, 800000].map((p) => <option key={p} value={p}>Up to ${p.toLocaleString("en-CA")}</option>)}
      </select>
      <select name="beds" className="field !border-0 !bg-paper" aria-label="Bedrooms" defaultValue="">
        <option value="">Any beds</option>
        {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
      </select>
      <button className="btn btn-accent px-7">Search</button>
    </form>
  );
}
