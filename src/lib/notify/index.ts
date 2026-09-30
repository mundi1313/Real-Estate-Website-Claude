import { headers } from "next/headers";
import { phonePretty } from "@/lib/format";

// Email alerts to Arman (via Resend's HTTP API — no SDK needed).
//   RESEND_API_KEY   from resend.com (without it, alerts are only printed to the server log)
//   ALERT_TO_EMAIL   where alerts go (default: first address in ADMIN_EMAILS)
//   ALERT_FROM       sender, e.g. "Leads <alerts@yourdomain.ca>" (default: Resend's test sender, which only delivers to
//                    the email you registered with Resend — verify your own domain to lift that)
// A failed alert must NEVER break what the visitor is doing, so every path is wrapped and time-limited.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

export async function sendAlert(subject: string, rows: [string, string][], link?: { url: string; label: string }): Promise<void> {
  try {
    const to = process.env.ALERT_TO_EMAIL || (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
    const text = `${subject}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}${link ? `\n\n${link.label}: ${link.url}` : ""}`;
    if (!process.env.RESEND_API_KEY || !to) {
      console.log(`[alert: not emailed — set RESEND_API_KEY and ALERT_TO_EMAIL/ADMIN_EMAILS]\n${text}`);
      return;
    }
    const html = `<div style="font-family:system-ui,sans-serif;max-width:32rem"><h2 style="margin:0 0 12px">${esc(subject)}</h2>` +
      `<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#555">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join("")}</table>` +
      (link ? `<p><a href="${esc(link.url)}" style="background:#12395c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">${esc(link.label)}</a></p>` : "") + `</div>`;
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.ALERT_FROM || "Leads <onboarding@resend.dev>", to: [to], subject, html, text }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error("[alert] Resend refused the email:", res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error("[alert] could not send:", e instanceof Error ? e.message : e);
  }
}

interface Who { id: string; firstName: string; lastName: string; email: string; phone: string | null }
const name = (w: Who) => `${w.firstName} ${w.lastName}`.trim() || w.email;
const leadLink = async (w: Who) => ({ url: `${await siteOrigin()}/admin/leads${w.id ? `/${w.id}` : ""}`, label: w.id ? "Open lead in dashboard" : "Open leads in dashboard" });

export async function alertNewLead(w: Who, how: string, verified = true) {
  await sendAlert(`New lead: ${name(w)}`, [["Name", name(w)], ["Email", w.email + (verified ? "" : " (not yet verified)")], ["Phone", phonePretty(w.phone)], ["Signed up via", how]], await leadLink(w));
}
export async function alertShowing(w: Who, listing: string, when: string, message: string) {
  await sendAlert(`Showing request: ${name(w)} — ${listing}`, [["Who", name(w)], ["Phone", phonePretty(w.phone)], ["Email", w.email], ["Home", listing], ["Wants", when], ...(message ? ([["Note", message]] as [string, string][]) : [])], await leadLink(w));
}
export async function alertHotLead(w: Who, reasons: string[]) {
  await sendAlert(`Hot lead: ${name(w)}`, [["Who", name(w)], ["Phone", phonePretty(w.phone)], ["Email", w.email], ["Why", reasons.join(" · ")]], await leadLink(w));
}
