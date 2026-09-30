import { site } from "@/lib/site";
import { GATE_COOKIE, gateToken, safeEqual, safeNext } from "@/lib/gate";

// Standalone page (no site layout), so it never touches the database or shows site content.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const page = (next: string, error = "") => new Response(`<!doctype html><html lang="en-CA"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(site.brand)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a2540;font-family:system-ui,sans-serif;color:#0e2238}
form{background:#fff;border-radius:20px;padding:32px;width:min(92vw,22rem);box-shadow:0 30px 80px rgba(0,0,0,.4)}
h1{margin:0 0 4px;font:600 1.6rem Georgia,serif}p{margin:0 0 18px;color:#4a5b6d;font-size:.9rem}
input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #e4e0d6;border-radius:10px;font-size:1rem}
button{margin-top:12px;width:100%;padding:12px;border:0;border-radius:10px;background:#e0902b;color:#1b1203;font-weight:700;font-size:1rem;cursor:pointer}
.err{color:#b91c1c;font-size:.85rem;margin:8px 0 0}</style></head><body>
<form method="post" action="/unlock"><h1>${esc(site.brand)}</h1><p>This site is private while it's being built.</p>
<input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus required>
<input type="hidden" name="next" value="${esc(next)}">${error ? `<p class="err" role="alert">${esc(error)}</p>` : ""}
<button>Enter</button></form></body></html>`, {
  status: error ? 401 : 200,
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
});

export async function GET(req: Request) {
  if (!process.env.SITE_PASSWORD) return Response.redirect(new URL("/", req.url), 303);
  return page(safeNext(new URL(req.url).searchParams.get("next")));
}

export async function POST(req: Request) {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return Response.redirect(new URL("/", req.url), 303);
  const form = await req.formData();
  const next = safeNext(String(form.get("next") ?? "/"));
  const given = String(form.get("password") ?? "");
  // Compare HMACs of both values so timing doesn't reveal how close a guess was.
  if (!safeEqual(await gateToken(given), await gateToken(pw))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return page(next, "That password isn't right.");
  }
  const secure = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL(next, req.url).toString(),
      "set-cookie": `${GATE_COOKIE}=${await gateToken(pw)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}${secure ? "; Secure" : ""}`,
      "cache-control": "no-store",
    },
  });
}
