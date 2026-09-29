import Link from "next/link";
import { site } from "@/lib/site";
import AuthButton from "./AuthButton";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="container-x flex items-center justify-between py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-accent" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/></svg>
          </span>
          <span className="font-display text-base font-semibold leading-none sm:text-lg">{site.brand}</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link href="/search" className="hover:text-ink">Buy</Link>
          <Link href="/#neighbourhoods" className="hover:text-ink">Neighbourhoods</Link>
          <Link href="/#about" className="hover:text-ink">About Arman</Link>
        </nav>
        <div className="flex items-center gap-2">
          <AuthButton />
          <Link href="/search" className="btn btn-brand !py-2 whitespace-nowrap">Search<span className="hidden sm:inline"> homes</span></Link>
        </div>
      </div>
    </header>
  );
}
