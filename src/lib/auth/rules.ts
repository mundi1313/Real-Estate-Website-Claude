// Shared (client + server) signup rules.
export const FREE_LISTING_VIEWS = 1; // unique listings a visitor can open before being asked to sign up
export const TERMS_VERSION = "2026-09-draft";

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/** Returns +1XXXXXXXXXX for a valid 10-digit North American number, else null. */
export function normalizePhone(s: string): string | null {
  const d = s.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(ten) ? `+1${ten}` : null;
}

