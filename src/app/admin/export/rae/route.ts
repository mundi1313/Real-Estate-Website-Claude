import { isAdminEmail, isAdminSession } from "@/lib/crm/admin";
import { auth } from "@/lib/auth";
import { crm } from "@/lib/crm/store";
import { phonePretty } from "@/lib/format";

// RAE asks for the full client list whenever it changes, and at least each quarter.
// Cells starting with = + - @ are prefixed so spreadsheet apps can't run them as formulas.
const cell = (v: string | null) => {
  const s = (v ?? "").replace(/^[=+\-@\t\r]/, "'$&");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  if (!(await isAdminSession(await auth.getUser()))) return new Response("Not found", { status: 404 });
  const leads = (await crm.leads()).filter((l) => !isAdminEmail(l.email)); // the admin account is not a client
  const rows = [["First name", "Last name", "Email", "Phone", "Username", "Signed up (ISO)", "Sign-up method", "Terms agreed (ISO)"],
    ...leads.map((l) => [l.firstName, l.lastName, l.email, l.phone ? phonePretty(l.phone) : "", l.email, l.createdAt, l.source, l.termsAt])];
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="rae-client-list-${stamp}.csv"`, "cache-control": "no-store" },
  });
}
