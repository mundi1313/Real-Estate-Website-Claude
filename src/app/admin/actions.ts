"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/crm/admin";
import { crm } from "@/lib/crm/store";
import { LEAD_STATUSES, TOUR_STATUSES, type LeadStatus, type TourStatus } from "@/lib/crm/types";

const id = (v: string) => /^[A-Za-z0-9_-]{1,64}$/.test(v);

export async function setLeadStatusAction(userId: string, status: string) {
  await requireAdmin();
  if (!id(userId) || !LEAD_STATUSES.includes(status as LeadStatus)) return;
  await crm.setLeadStatus(userId, status as LeadStatus);
  revalidatePath("/admin", "layout");
}

export async function setTourStatusAction(tourId: string, status: string) {
  await requireAdmin();
  if (!id(tourId) || !TOUR_STATUSES.includes(status as TourStatus)) return;
  await crm.setTourStatus(tourId, status as TourStatus);
  revalidatePath("/admin", "layout");
}

export async function addNoteAction(userId: string, note: string) {
  await requireAdmin();
  const text = note.trim().slice(0, 4000);
  if (!id(userId) || !text) return;
  await crm.addNote(userId, text);
  revalidatePath(`/admin/leads/${userId}`);
}
