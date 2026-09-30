import { admin } from "@/lib/auth/supabase";
import type { CrmStore, Lead, LeadStatus, Note, Tour, TourStatus } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const COLS = "id,first_name,last_name,phone,username,signup_source,terms_accepted_at,marketing_consent_at,marketing_consent_text,created_at,lead_status";
const toLead = (p: any): Lead => ({
  id: p.id, firstName: p.first_name ?? "", lastName: p.last_name ?? "", email: p.username, phone: p.phone,
  source: p.signup_source, createdAt: p.created_at, status: p.lead_status,
  termsAt: p.terms_accepted_at, marketingAt: p.marketing_consent_at, marketingText: p.marketing_consent_text,
});
const toTour = (t: any): Tour => ({
  id: t.id, userId: t.user_id, mls: t.mls_number, name: t.name, email: t.email, phone: t.phone,
  preferredTimes: t.preferred_times ?? "", message: t.message ?? "", status: t.status, createdAt: t.created_at,
});

// Service-role client: bypasses row-level security. Only ever called from admin-guarded server code.
export const supabaseCrm: CrmStore = {
  async leads() {
    const { data } = await admin().from("profiles").select(COLS).order("created_at", { ascending: false });
    return (data ?? []).map(toLead);
  },
  async lead(id) {
    const { data } = await admin().from("profiles").select(COLS).eq("id", id).maybeSingle();
    return data ? toLead(data) : null;
  },
  async events(userId) {
    let q = admin().from("lead_events").select("id,user_id,event_type,mls_number,created_at").order("created_at", { ascending: false }).limit(5000);
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data ?? []).map((e: any) => ({ id: String(e.id), userId: e.user_id, type: e.event_type, mls: e.mls_number, at: e.created_at }));
  },
  async tours(userId) {
    let q = admin().from("tour_requests").select("*").order("created_at", { ascending: false });
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data ?? []).map(toTour);
  },
  async notes(userId) {
    const { data } = await admin().from("lead_notes").select("id,user_id,note,created_at").eq("user_id", userId).order("created_at", { ascending: false });
    return (data ?? []).map((n: any): Note => ({ id: n.id, userId: n.user_id, note: n.note, createdAt: n.created_at }));
  },
  async setLeadStatus(userId: string, status: LeadStatus) { await admin().from("profiles").update({ lead_status: status }).eq("id", userId); },
  async addNote(userId, note) { await admin().from("lead_notes").insert({ user_id: userId, note }); },
  async setTourStatus(tourId: string, status: TourStatus) { await admin().from("tour_requests").update({ status }).eq("id", tourId); },
};
