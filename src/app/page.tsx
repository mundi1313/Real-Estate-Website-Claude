import Link from "next/link";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-4xl font-bold">Find your home in Edmonton</h1>
      <p className="mx-auto mt-3 max-w-xl text-neutral-700">
        Search current listings across Edmonton and area, with {site.agent.name} of {site.agent.brokerage}.
      </p>
      <Link href="/search" className="mt-6 inline-block rounded bg-blue-700 px-6 py-3 text-white">Search homes</Link>
    </section>
  );
}
