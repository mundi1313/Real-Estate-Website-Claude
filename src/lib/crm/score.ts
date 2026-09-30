import type { LeadEvent, Tour } from "./types";

// Lead "temperature" — tweak the numbers below to change what counts as a hot lead.
//   +40  an open showing request (new / contacted / scheduled) in the last 30 days
//   +15  a showing that has already happened
//   +5   per different home viewed (max 30)
//   +8   per home they came back to on another visit (max 24)
//   +5   per return sign-in (max 15)
//   +10  any activity in the last 3 days
//   Hot: 60+   Warm: 25+   Cool: below 25
export type Temp = "hot" | "warm" | "cool";
export interface Score { temp: Temp; points: number; reasons: string[]; homesViewed: number; lastActivity: string | null }

const DAY = 86_400_000;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function scoreLead(events: LeadEvent[], tours: Tour[], now = Date.now()): Score {
  const perMls = new Map<string, number>();
  for (const e of events) if (e.type === "listing_view" && e.mls) perMls.set(e.mls, (perMls.get(e.mls) ?? 0) + 1);
  const distinct = perMls.size;
  const repeats = [...perMls.values()].filter((n) => n >= 2).length;
  const returns = events.filter((e) => e.type === "login").length;
  const recent = (t: Tour) => now - Date.parse(t.createdAt) < 30 * DAY;
  const openTour = tours.some((t) => (t.status === "new" || t.status === "contacted" || t.status === "scheduled") && recent(t));
  const doneTour = !openTour && tours.some((t) => t.status === "done" && recent(t));
  const times = [...events.map((e) => Date.parse(e.at)), ...tours.map((t) => Date.parse(t.createdAt))].filter(Number.isFinite);
  const last = times.length ? Math.max(...times) : null;

  let points = 0;
  const reasons: string[] = [];
  if (openTour) { points += 40; reasons.push("Requested a showing"); }
  else if (doneTour) { points += 15; reasons.push("Has toured a home"); }
  if (distinct) { points += Math.min(30, distinct * 5); reasons.push(`Viewed ${plural(distinct, "home")}`); }
  if (repeats) { points += Math.min(24, repeats * 8); reasons.push(`Came back to ${plural(repeats, "home")}`); }
  if (returns) { points += Math.min(15, returns * 5); reasons.push(`Signed back in ${plural(returns, "time")}`); }
  if (last !== null && now - last < 3 * DAY) { points += 10; reasons.push("Active in the last 3 days"); }

  return {
    temp: points >= 60 ? "hot" : points >= 25 ? "warm" : "cool",
    points, reasons, homesViewed: distinct,
    lastActivity: last === null ? null : new Date(last).toISOString(),
  };
}
