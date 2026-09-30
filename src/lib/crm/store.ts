import { demoCrm } from "./demo-store";
import { supabaseCrm } from "./supabase-store";
import { scoreLead, type Score } from "./score";
import type { CrmStore, Lead, LeadEvent, Tour } from "./types";

export const crm: CrmStore = process.env.NEXT_PUBLIC_SUPABASE_URL ? supabaseCrm : demoCrm;

export interface BoardRow { lead: Lead; score: Score; tours: Tour[]; openTours: number }

/** Every lead with their score and showings — one pass, used by the overview and leads list. */
export async function loadBoard(): Promise<{ rows: BoardRow[]; events: LeadEvent[]; tours: Tour[] }> {
  const [leads, events, tours] = await Promise.all([crm.leads(), crm.events(), crm.tours()]);
  const evBy = new Map<string, LeadEvent[]>(); const tBy = new Map<string, Tour[]>();
  for (const e of events) evBy.set(e.userId, [...(evBy.get(e.userId) ?? []), e]);
  for (const t of tours) if (t.userId) tBy.set(t.userId, [...(tBy.get(t.userId) ?? []), t]);
  const rows = leads.map((lead) => {
    const t = tBy.get(lead.id) ?? [];
    return { lead, score: scoreLead(evBy.get(lead.id) ?? [], t), tours: t, openTours: t.filter((x) => x.status === "new" || x.status === "contacted").length };
  });
  return { rows, events, tours };
}
