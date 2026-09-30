"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/showings", label: "Showings" },
];

export default function AdminNav() {
  const path = usePathname();
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 border-b border-line pb-4" aria-label="Admin">
      {items.map((i) => {
        const on = i.exact ? path === i.href : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={`rounded-full px-4 py-1.5 text-sm font-medium ${on ? "bg-brand text-white" : "text-ink-soft hover:bg-white"}`}>{i.label}</Link>;
      })}
      <a href="/admin/export/rae" className="ml-auto text-sm text-ink-soft underline hover:text-ink">Download RAE client list (CSV)</a>
    </nav>
  );
}
