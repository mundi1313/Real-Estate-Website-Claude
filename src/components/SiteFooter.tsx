import Link from "next/link";
import { site } from "@/lib/site";

// RECA: agent name + brokerage on every page — lives in the root layout.
export default function SiteFooter() {
  const { agent } = site;
  return (
    <footer className="mt-12 border-t bg-neutral-50">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-sm text-neutral-700">
        <p className="font-semibold">
          {agent.name}, {agent.title} · {agent.team} · {agent.brokerage}
        </p>
        <p>{agent.city}</p>
        <p className="text-xs">
          <Link href="/privacy" className="underline">Privacy Policy</Link> ·{" "}
          <Link href="/terms" className="underline">Terms of Use</Link>
        </p>
        <p className="text-xs">
          REALTOR® is a trademark of the Canadian Real Estate Association (CREA), used under license.
        </p>
      </div>
    </footer>
  );
}
