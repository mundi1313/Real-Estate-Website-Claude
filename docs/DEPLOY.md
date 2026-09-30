# Deploying Keys to Edmonton (keystoedmonton.ca) on Cloudflare

The site runs as a Cloudflare Worker (OpenNext adapter). Config: `wrangler.jsonc`, `open-next.config.ts`.
While it is a work in progress it is **password protected and hidden from search engines**.

## How the protection works (and why it can't leak)
- `SITE_PASSWORD` (a Cloudflare secret) turns on a site-wide password page. Nothing renders until the visitor enters it — the check runs
  in `src/proxy.ts` *before* any page loads, so no data is fetched or sent to a blocked visitor.
- `REQUIRE_SITE_PASSWORD` (set in `wrangler.jsonc`) makes the gate **fail closed**: if the secret is ever missing, the whole site shows
  "This site is being set up" (HTTP 503) instead of opening up.
- Search engines are told to stay away (`robots.txt` Disallow + `X-Robots-Tag: noindex`).
- The cookie is HttpOnly, SameSite=Lax, Secure on https, expires in 7 days, and is invalid if the password changes.
- Tested on the Workers runtime: all pages redirect to `/unlock`; wrong/tampered/garbage cookies rejected; open-redirect attempts neutralised.

## One-time setup
1. **Cloudflare account** (free): dash.cloudflare.com. **Add a domain** → `keystoedmonton.ca` → Free plan. Cloudflare shows two nameservers.
2. **Porkbun**: Domain Management → `keystoedmonton.ca` → Authoritative Nameservers → replace them with Cloudflare's two. Wait until
   Cloudflare shows the domain as **Active** (minutes to a few hours).
3. On your computer, in the project folder: `npx wrangler login` (opens the browser; approve).
4. Choose a long site password (12+ characters, e.g. four random words). Add it to `.env.local`: `SITE_PASSWORD=...`
   Also set `ADMIN_EMAILS`, `SITE_URL=https://keystoedmonton.ca`, and the Supabase values.
5. `npm run deploy` — builds and publishes. Until step 6 the site shows the holding page (that is intended).
6. `npm run deploy:secrets` — uploads your private settings (never prints them). Refuses to run without a strong `SITE_PASSWORD`.
   Add `-- --dry-run` first to only check the file.
7. **Supabase** → Authentication → URL Configuration: set Site URL to `https://keystoedmonton.ca` and add Redirect URLs
   `https://keystoedmonton.ca/auth/callback` and `https://www.keystoedmonton.ca/auth/callback` (keep the localhost ones for testing).
8. Visit https://keystoedmonton.ca → password page → enter → site.

## Updating later
`git pull`, then `npm run deploy`. Changed a secret? Edit `.env.local`, then `npm run deploy:secrets`.

## Going public (only when ready — RAE approval, real data, legal review done)
1. Remove the `REQUIRE_SITE_PASSWORD` line and `ALLOW_SAMPLE_DATA` from `wrangler.jsonc`.
2. `npx wrangler secret delete SITE_PASSWORD`, then `npm run deploy`. Robots rules switch to "allow" automatically.
3. Turn on Cloudflare **Bot Fight Mode** and a WAF rate-limiting rule (RAE requires firewall/anti-scraping).

## Before real visitors
- Resend: verify `keystoedmonton.ca` (adds DNS records in Cloudflare), then set `ALERT_FROM="Keys to Edmonton <alerts@keystoedmonton.ca>"`
  and, in Supabase → Authentication → Emails → SMTP, use Resend so sign-in links reach everyone.
- Supabase Pro (US$25/mo) and Cloudflare Workers Paid (US$5/mo) recommended at launch (free plans can pause / are close to size limits).
