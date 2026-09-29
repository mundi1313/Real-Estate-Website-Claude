import { site } from "@/lib/site";
import { isSampleData } from "@/lib/listings/provider";
import LocalTime from "./LocalTime";

// Required on EVERY page that displays MLS® data.
export default function MlsNotice({ lastUpdated }: { lastUpdated: string }) {
  return (
    <aside className="container-x mt-14" aria-label="MLS data notice">
      <div className="space-y-1.5 rounded-2xl border border-line bg-white/60 p-5 text-xs leading-relaxed text-ink-soft">
        {isSampleData() && (
          <p className="font-semibold text-accent-deep">Sample data for development only — not real MLS® listings.</p>
        )}
        <p>Copyright {new Date().getFullYear()} by the {site.board}. All Rights Reserved.</p>
        <p>Data is deemed reliable but is not guaranteed accurate by the {site.board}.</p>
        <p>
          The data relating to real estate on this website comes in part from the IDX program of the {site.board}. Data may
          be used by consumers only for the purpose of buying or selling real estate.
        </p>
        <p>
          Listing information presented by {site.agent.name}, {site.agent.brokerage}. Listings last updated:{" "}
          <LocalTime iso={lastUpdated} />.
        </p>
        <p>MLS® is a registered trademark of the Canadian Real Estate Association (CREA).</p>
      </div>
    </aside>
  );
}
