import Link from "next/link";
import { connection } from "next/server";
import ListingCard from "@/components/ListingCard";
import MlsNotice from "@/components/MlsNotice";
import SearchBar from "@/components/SearchBar";
import { getProvider } from "@/lib/listings/provider";
import { site } from "@/lib/site";

const hoods = [
  { name: "Downtown", blurb: "Condos, river valley views, city energy", tone: "from-sky-700 to-brand-deep" },
  { name: "Oliver", blurb: "Walkable, leafy, minutes from Jasper Ave", tone: "from-emerald-700 to-emerald-950" },
  { name: "Old Strathcona", blurb: "Whyte Ave, character homes, culture", tone: "from-amber-600 to-orange-900" },
  { name: "Ellerslie", blurb: "Family-friendly, newer builds, parks", tone: "from-indigo-600 to-slate-900" },
  { name: "St. Albert", blurb: "Trails, schools and a small-city feel", tone: "from-teal-600 to-teal-950" },
  { name: "Sherwood Park", blurb: "Space and community just east of the city", tone: "from-rose-600 to-rose-950" },
];

const steps = [
  ["Search", "Filter Edmonton-area homes by price, bedrooms and property type."],
  ["Save & compare", "Free accounts to save homes and searches and get new-listing alerts are coming soon."],
  ["Tour with Arman", "Request a showing in a click. Arman confirms and walks you through every step."],
];

export default async function Home() {
  await connection(); // listings must be fetched per request, never frozen at build time
  const res = await getProvider().search({ sort: "price-asc" });
  const featured = res.listings.slice(0, 6);
  return (
    <>
      <section className="relative overflow-hidden bg-brand-deep text-white">
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-white/[0.06]" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0 160V110h60V80h40v30h50V60h30V20h40v40h30v50h60V90h50v20h40V50h30V0h50v50h30v60h60V80h50v30h40V70h60v40h50V90h40v20h60V60h30V30h40v30h30v50h60V80h50v30h60v50z" />
        </svg>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" aria-hidden />
        <div className="container-x relative py-20 md:py-28">
          <p className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium tracking-wide text-accent">
            EDMONTON &amp; AREA · {site.agent.brokerage.toUpperCase()}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Find the Edmonton home that fits your life.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Browse current listings, save your favourites and book a showing with {site.agent.name}, {site.agent.title}.
          </p>
          <div className="mt-9 max-w-4xl"><SearchBar /></div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold">Featured homes</h2>
            <p className="mt-1 text-ink-soft">A look at what&apos;s available right now.</p>
          </div>
          <Link href="/search" className="btn btn-brand hidden sm:inline-flex">View all homes →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => <ListingCard key={l.mlsNumber} l={l} />)}
        </div>
      </section>

      <section id="neighbourhoods" className="container-x scroll-mt-20 pb-16">
        <h2 className="text-3xl font-semibold">Explore neighbourhoods</h2>
        <p className="mt-1 text-ink-soft">Every area has its own character. Start with the feel that suits you.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hoods.map((h) => (
            <Link key={h.name} href={`/search?q=${encodeURIComponent(h.name)}`}
              className={`card-lift group relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${h.tone} p-5 text-white`}>
              <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">Browse →</span>
              <h3 className="text-2xl font-semibold">{h.name}</h3>
              <p className="text-sm text-white/80">{h.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x">
          <h2 className="text-center text-3xl font-semibold">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <div key={t} className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand font-display text-lg font-semibold text-accent">{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="container-x scroll-mt-20 py-16">
        <div className="grid items-center gap-8 rounded-3xl bg-brand p-8 text-white md:grid-cols-[auto_1fr] md:p-12">
          <div className="grid h-28 w-28 place-items-center rounded-full bg-accent font-display text-4xl font-semibold text-brand-deep" aria-hidden>AM</div>
          <div>
            <h2 className="text-3xl font-semibold">Work with {site.agent.name}</h2>
            <p className="mt-1 text-accent">{site.agent.title} · {site.agent.team} · {site.agent.brokerage}</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-200">
              Buying a home is a big decision. Arman helps Edmonton buyers understand the market, tour the right homes and
              negotiate with confidence — with straight answers at every step.
            </p>
            <Link href="/search" className="btn btn-accent mt-6">Start your search</Link>
          </div>
        </div>
      </section>

      <MlsNotice lastUpdated={res.lastUpdated} />
    </>
  );
}
