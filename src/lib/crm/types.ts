export const LEAD_STATUSES = ["new", "contacted", "nurturing", "client", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const TOUR_STATUSES = ["new", "contacted", "scheduled", "done", "cancelled"] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];

export interface Lead {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  source: "email" | "google"; createdAt: string; status: LeadStatus;
  termsAt: string | null; marketingAt: string | null; marketingText: string | null;
}
export interface LeadEvent { id: string; userId: string; type: string; mls: string | null; at: string }
export interface Tour {
  id: string; userId: string | null; mls: string; name: string; email: string; phone: string;
  preferredTimes: string; message: string; status: TourStatus; createdAt: string;
}
export interface Note { id: string; userId: string; note: string; createdAt: string }

export interface CrmStore {
  leads(): Promise<Lead[]>;
  lead(id: string): Promise<Lead | null>;
  events(userId?: string): Promise<LeadEvent[]>;
  tours(userId?: string): Promise<Tour[]>;
  notes(userId: string): Promise<Note[]>;
  setLeadStatus(userId: string, status: LeadStatus): Promise<void>;
  addNote(userId: string, note: string): Promise<void>;
  setTourStatus(tourId: string, status: TourStatus): Promise<void>;
}
