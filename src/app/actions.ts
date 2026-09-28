"use server";

export interface TourState { ok: boolean; message: string }

// TODO(supabase): persist to `tour_requests`, write a `lead_events` row, and
// email Arman via Resend. Validation is real; storage is stubbed until Supabase is wired.
export async function requestTour(_prev: TourState, form: FormData): Promise<TourState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const mls = String(form.get("mls") ?? "").trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || phone.replace(/\D/g, "").length < 10 || !mls) {
    return { ok: false, message: "Please enter your name, a valid email, and a 10-digit phone number." };
  }
  if (form.get("consent") !== "on") {
    return { ok: false, message: "Please agree to the Terms of Use and Privacy Policy." };
  }
  return { ok: true, message: "Thanks! Arman will be in touch to confirm your showing." };
}
