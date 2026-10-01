import { headers } from "next/headers";
import { phonePretty } from "@/lib/format";
import { site } from "@/lib/site";

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

/**
 * The one email visitors receive: a welcome after they register. Strictly transactional (no promotions, no confirmation link).
 *   MAIL_FROM  e.g. "Keys to Edmonton <hello@keystoedmonton.ca>" (replies reach Arman via the forwarding address)
 * Without RESEND_API_KEY or MAIL_FROM it is only printed to the server log. Never blocks or breaks the visitor's request.
 */
export async function sendWelcome(w: { email: string; firstName: string }): Promise<void> {
  try {
    const origin = await siteOrigin();
    const name = w.firstName.trim() || "there";
    const subject = `Welcome to ${site.brand}`;
    const a = site.agent;
    const text = `Hi ${name},\n\nThanks for registering with ${site.brand}. You can browse Edmonton-area homes any time and request a showing in one tap.\n\nBrowse homes: ${origin}/search\n\nQuestions? Just reply to this email and it goes straight to ${a.name}.\n\n${a.name}, ${a.title} · ${a.team} · ${a.brokerage}\n${a.city}\nYou are receiving this because you registered at ${origin.replace(/^https?:\/\//, "")}.`;
    if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
      console.log(`[welcome email: not sent — set RESEND_API_KEY and MAIL_FROM]\nTo: ${w.email}\n${text}`);
      return;
    }
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0e2238">` +
      `<h2 style="margin:0 0 12px;font-size:22px">Welcome to ${esc(site.brand)}</h2>` +
      `<p style="line-height:1.5">Hi ${esc(name)}, thanks for registering. You can browse Edmonton-area homes any time and request a showing in one tap.</p>` +
      `<p style="margin:24px 0"><a href="${esc(origin)}/search" style="background:#12395c;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold">Browse homes</a></p>` +
      `<p style="line-height:1.5">Questions? Just reply to this email — it goes straight to ${esc(a.name)}.</p>` +
      `<hr style="border:none;border-top:1px solid #e4e0d6;margin:24px 0"><p style="margin:0;font-size:12px;color:#777;line-height:1.5">${esc(a.name)}, ${esc(a.title)} · ${esc(a.team)} · ${esc(a.brokerage)} · ${esc(a.city)}<br>You are receiving this because you registered at ${esc(origin.replace(/^https?:\/\//, ""))}.</p></div>`;
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [w.email], subject, html, text }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error("[welcome] Resend refused the email:", res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error("[welcome] could not send:", e instanceof Error ? e.message : e);
  }
}
