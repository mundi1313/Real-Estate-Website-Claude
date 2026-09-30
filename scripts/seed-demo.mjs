// Fills the LOCAL demo store with fictional leads so you can see the admin dashboard populated.
//   npm run seed:demo          add sample leads (safe to re-run)
//   npm run seed:demo -- --clear   remove the sample leads again
// Only touches .data/demo-auth.json on your own computer. Every sample lead uses an @example.com address.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(process.cwd(), ".data", "demo-auth.json");
const db = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
for (const k of ["users", "events", "audit", "tours", "notes"]) db[k] ||= [];

const isSeed = (id) => String(id).startsWith("seed-");
db.users = db.users.filter((u) => !isSeed(u.id));
db.events = db.events.filter((e) => !isSeed(e.userId));
db.tours = db.tours.filter((t) => !isSeed(t.userId));
db.notes = db.notes.filter((n) => !isSeed(n.userId));
if (process.argv.includes("--clear")) { write(); console.log("Sample leads removed."); process.exit(0); }

const H = 3_600_000, D = 24 * H, now = Date.now();
const ago = (ms) => new Date(now - ms).toISOString();
const mls = (i) => `E${4500000 + i * 137}`; // matches the sample listings

// [first, last, source, joinedDaysAgo, status, marketing, homes[[listing, visits, hoursAgo]], tour{listing,when,msg,status}|null, notes[]]
const people = [
  ["Priya", "Sharma", "google", 2, "contacted", true, [[3, 3, 5], [8, 2, 30], [12, 1, 50]], { l: 8, when: "2026-10-10 · Evening", msg: "Pre-approved to $520K. Would love to see it after work.", status: "new" }, ["Called, left voicemail. Prefers text."]],
  ["Marcus", "Chen", "email", 5, "new", true, [[1, 2, 20], [5 + 1, 1, 28], [14, 1, 70]], { l: 14, when: "2026-10-12 · Afternoon", msg: "", status: "new" }, []],
  ["Jasmine", "Brar", "google", 9, "nurturing", true, [[20, 4, 10], [21, 2, 60], [22, 1, 90], [23, 1, 95], [24, 1, 100]], null, ["First-time buyer, saving for down payment. Follow up in the spring.", "Likes condos near LRT."]],
  ["Daniel", "Okafor", "email", 1, "new", false, [[2, 1, 4]], null, []],
  ["Sofia", "Martinez", "google", 14, "client", true, [[30, 5, 2], [31, 3, 40], [32, 2, 90]], { l: 30, when: "2026-10-03 · Morning", msg: "Bringing my partner.", status: "scheduled" }, ["Offer accepted on 30 — subject removal Oct 20."]],
  ["Liam", "O'Connor", "email", 20, "closed", false, [[4, 1, 400]], null, ["Decided to keep renting."]],
  ["Aisha", "Rahman", "email", 3, "new", true, [[9, 1, 26], [10, 1, 27], [11, 1, 27.5]], null, []],
  ["Noah", "Tremblay", "google", 6, "contacted", true, [[15, 2, 15], [16, 1, 40]], { l: 15, when: "2026-10-08 · Afternoon", msg: "Is the basement suite legal?", status: "contacted" }, ["Texted — will send suite info."]],
  ["Emily", "Watson", "email", 30, "nurturing", true, [[7, 1, 600]], null, []],
  ["Kwame", "Mensah", "google", 0.3, "new", false, [[13, 1, 2]], null, []],
  ["Hannah", "Lee", "email", 11, "contacted", true, [[25, 2, 80], [26, 1, 82]], { l: 25, when: "2026-09-30 · Evening", msg: "", status: "done" }, ["Saw 25 — too small. Wants 3 bd."]],
  ["Omar", "Farouk", "email", 8, "new", false, [], null, []],
];

people.forEach(([first, last, source, joined, status, mk, homes, tour, notes], i) => {
  const id = `seed-${String(i + 1).padStart(2, "0")}`;
  const created = ago(joined * D);
  db.users.push({
    id, email: `${first}.${last}@example.com`.toLowerCase().replace(/[^a-z.@]/g, ""), firstName: first, lastName: last,
    phone: `+1780555${String(100 + i * 7).padStart(4, "0")}`, termsAt: created, marketingAt: mk ? created : null,
    marketingText: mk ? "I agree to be contacted by Arman Mundi of eXp Realty by phone, text message and email about real estate, including marketing. (sample)" : null,
    createdAt: created, status, source,
  });
  db.events.push({ userId: id, type: "signup", at: created });
  for (const [l, visits, hrs] of homes) for (let v = 0; v < visits; v++) db.events.push({ userId: id, type: "listing_view", mls: mls(l), at: ago((hrs + v * 30) * H) });
  if (homes.length > 2) db.events.push({ userId: id, type: "login", at: ago((homes[0][2] + 2) * H) });
  if (homes.length > 3) db.events.push({ userId: id, type: "login", at: ago((homes[0][2] + 40) * H) });
  if (tour) {
    const t = ago((homes[0]?.[2] ?? 6) * H - H / 2);
    db.tours.push({ id: `seed-t${i}`, userId: id, name: `${first} ${last}`, email: `${first}.${last}@example.com`.toLowerCase().replace(/[^a-z.@]/g, ""), phone: `+1780555${String(100 + i * 7).padStart(4, "0")}`, mls: mls(tour.l), preferredTimes: tour.when, message: tour.msg, at: t, status: tour.status });
    db.events.push({ userId: id, type: "tour_requested", mls: mls(tour.l), at: t });
  }
  notes.forEach((note, n) => db.notes.push({ id: `seed-n${i}-${n}`, userId: id, note, at: ago((6 + n * 20) * H) }));
});
write();
console.log(`Added ${people.length} sample leads. Run the site and open /admin.`);

function write() { mkdirSync(join(process.cwd(), ".data"), { recursive: true }); writeFileSync(FILE, JSON.stringify(db, null, 2)); }
