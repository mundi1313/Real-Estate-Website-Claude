// Uploads the private settings from .env.local to Cloudflare as encrypted secrets. Never prints values.
//   npm run deploy:secrets             upload (requires SITE_PASSWORD, so the site can't go live unprotected by accident)
//   npm run deploy:secrets -- --public upload without a SITE_PASSWORD (only when you are ready to launch publicly)
//   npm run deploy:secrets -- --dry-run  just check the file and list which settings would be uploaded
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const dry = args.includes("--dry-run"), pub = args.includes("--public");
const FILE = join(process.cwd(), ".env.local");
if (!existsSync(FILE)) { console.error("No .env.local found. Create it first (cp .env.example .env.local)."); process.exit(1); }

const env = {};
for (const line of readFileSync(FILE, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2").trim();
}
const KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS", "RESEND_API_KEY", "ALERT_TO_EMAIL", "ALERT_FROM", "SITE_URL", "SITE_PASSWORD"];
const secrets = Object.fromEntries(KEYS.filter((k) => env[k]).map((k) => [k, env[k]]));
secrets.SITE_URL ||= "https://keystoedmonton.ca";

const problems = [];
for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS"]) if (!secrets[k]) problems.push(`${k} is empty in .env.local`);
if (!pub) {
  if (!secrets.SITE_PASSWORD) problems.push("SITE_PASSWORD is empty — add a long password to .env.local so the site stays private");
  else if (secrets.SITE_PASSWORD.length < 12) problems.push("SITE_PASSWORD is too short — use at least 12 characters (a few random words works well)");
}
if (secrets.NEXT_PUBLIC_SUPABASE_URL && !/^https:\/\//.test(secrets.NEXT_PUBLIC_SUPABASE_URL)) problems.push("NEXT_PUBLIC_SUPABASE_URL should start with https://");
if (problems.length) { console.error("Fix these first:\n - " + problems.join("\n - ")); process.exit(1); }

console.log(`${dry ? "Would upload" : "Uploading"} ${Object.keys(secrets).length} settings: ${Object.keys(secrets).join(", ")}`);
if (dry) { console.log("Dry run only — nothing was sent."); process.exit(0); }

const tmp = join(tmpdir(), `secrets-${Date.now()}.json`);
writeFileSync(tmp, JSON.stringify(secrets), { mode: 0o600 });
try {
  const r = spawnSync("npx", ["wrangler", "secret", "bulk", tmp], { stdio: "inherit" });
  process.exit(r.status ?? 1);
} finally { try { unlinkSync(tmp); } catch {} }
