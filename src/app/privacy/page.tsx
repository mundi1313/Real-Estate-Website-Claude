import { site } from "@/lib/site";

export const metadata = { title: "Privacy Policy" };

// DRAFT — have this reviewed by eXp Realty / legal counsel before launch.
export default function Privacy() {
  return (
    <article className="prose max-w-3xl space-y-3 text-sm">
      <h1 className="text-2xl font-bold">Privacy Policy (draft)</h1>
      <p>This site is operated by {site.agent.name}, {site.agent.brokerage}, {site.agent.city}.</p>
      <h2 className="font-semibold">What we collect</h2>
      <p>Name, phone, email, username, and site activity (saved listings, saved searches, listings viewed, showing requests) when you register or use the site.</p>
      <h2 className="font-semibold">How it is used and stored</h2>
      <p>To create and secure your account, respond to your requests, send alerts you asked for, and assist you with buying or selling real estate. Data is stored with our database provider and retained as required by the {site.board}.</p>
      <h2 className="font-semibold">Sharing</h2>
      <p>Your personal information is never sold or disclosed for compensation. It may be shared with the {site.board} as required by our data license, and, where permitted, with another brokerage solely for a referral.</p>
    </article>
  );
}
