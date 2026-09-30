export const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

export function monthlyPayment(principal: number, annualRatePct: number, years: number) {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

const EDMONTON = "America/Edmonton";
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-CA", { timeZone: EDMONTON, dateStyle: "medium", timeStyle: "short" });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: EDMONTON, dateStyle: "medium" });

export function timeAgo(iso: string | null, now = Date.now()) {
  if (!iso) return "—";
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return fmtDate(iso);
}

export const phonePretty = (p: string | null) => (p ? p.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3") : "—");
export const nowMs = () => Date.now();
