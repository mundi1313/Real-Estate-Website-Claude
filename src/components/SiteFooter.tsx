import Link from "next/link";
import { site } from "@/lib/site";

// RECA: agent name + brokerage on every page — lives in the root layout.
export default function SiteFooter() {
  const { agent } = site;
  return (
    <footer className="mt-20 bg-brand-deep text-slate-300">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold text-white">{site.brand}</p>
          <p className="mt-3 text-sm leading-relaxed">
            <span className="font-semibold text-white">{agent.name}, {agent.title}</span><br />
            {agent.team} · {agent.brokerage}<br />
            {agent.city}
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">Explore</p>
          <ul className="space-y-2">
            <li><Link href="/search" className="hover:text-white">Search homes</Link></li>
            <li><Link href="/#neighbourhoods" className="hover:text-white">Neighbourhoods</Link></li>
            <li><Link href="/#about" className="hover:text-white">About Arman</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">Legal</p>
          <ul className="space-y-2">
            <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-x py-5 text-xs text-slate-400">
          {agent.name}, {agent.brokerage}. REALTOR® is a trademark of the Canadian Real Estate Association (CREA), used under license.
        </p>
      </div>
    </footer>
  );
}
