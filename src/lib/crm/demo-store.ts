import { randomBytes } from "node:crypto";
import { demoDb } from "@/lib/auth/demo";
import type { CrmStore, Lead, LeadStatus, Tour, TourStatus } from "./types";

// Local demo CRM: reads the same .data/demo-auth.json the demo sign-up flow writes to.
const toLead = (u: ReturnType<typeof demoDb.load>["users"][number]): Lead => ({
  id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone,
  source: (u.source as Lead["source"]) ?? "email", createdAt: u.createdAt, status: (u.status as LeadStatus) ?? "new",
  termsAt: u.termsAt, marketingAt: u.marketingAt, marketingText: u.marketingText,
});
const toTour = (t: ReturnType<typeof demoDb.load>["tours"][number], i: number): Tour => ({
  id: t.id ?? `t${i}`, userId: t.userId ?? null, mls: t.mls, name: t.name, email: t.email, phone: t.phone,
  preferredTimes: t.preferredTimes, message: t.message ?? "", status: (t.status as TourStatus) ?? "new", createdAt: t.at,
});

export const demoCrm: CrmStore = {
  async leads() { return demoDb.load().users.map(toLead).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async lead(id) { const u = demoDb.load().users.find((x) => x.id === id); return u ? toLead(u) : null; },
  async events(userId) {
    return demoDb.load().events.map((e, i) => ({ id: String(i), userId: e.userId, type: e.type, mls: e.mls ?? null, at: e.at }))
      .filter((e) => !userId || e.userId === userId);
  },
  async tours(userId) {
    return demoDb.load().tours.map(toTour).filter((t) => !userId || t.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async notes(userId) {
    return demoDb.load().notes.filter((n) => n.userId === userId).map((n) => ({ id: n.id, userId: n.userId, note: n.note, createdAt: n.at }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async setLeadStatus(userId, status) {
    const db = demoDb.load(); const u = db.users.find((x) => x.id === userId); if (u) { u.status = status; demoDb.save(db); }
  },
  async addNote(userId, note) {
    const db = demoDb.load(); db.notes.push({ id: randomBytes(6).toString("hex"), userId, note, at: new Date().toISOString() }); demoDb.save(db);
  },
  async setTourStatus(tourId, status) {
    const db = demoDb.load();
    db.tours.forEach((t, i) => { if ((t.id ?? `t${i}`) === tourId) t.status = status; });
    demoDb.save(db);
  },
};
