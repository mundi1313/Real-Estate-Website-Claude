import { site } from "@/lib/site";

export const metadata = { title: "Terms of Use" };

// DRAFT — have this reviewed by eXp Realty / legal counsel before launch.
export default function Terms() {
  return (
    <article className="container-x max-w-3xl space-y-3 py-12 text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold">Terms of Use (draft)</h1>
      <ul className="list-disc space-y-2 pl-5">
        <li>Using this site does not create an agency relationship with {site.agent.name} or {site.agent.brokerage}.</li>
        <li>You may use this site and its data for personal, non-commercial purposes only, and only if you have a bona fide interest in buying or selling real estate.</li>
        <li>You may not copy, scrape, or redistribute listing data.</li>
        <li>Copyright {new Date().getFullYear()} by the {site.board}. All Rights Reserved.</li>
        <li>Your information may be shared with the {site.board}.</li>
      </ul>
    </article>
  );
}
