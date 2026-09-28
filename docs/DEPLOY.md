# Deploying to Cloudflare

Uses the OpenNext Cloudflare adapter (`@opennextjs/cloudflare`) — a Worker with static assets. Config: `wrangler.jsonc`, `open-next.config.ts`.

## One-time
1. Create a free Cloudflare account. `npx wrangler login`.
2. `npm run deploy` — builds and publishes to `https://edmonton-idx-site.<your-subdomain>.workers.dev`.

## Or auto-deploy from GitHub
Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick this repo.
Build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`. Node 20+.

## Local checks
- `npm run dev` — normal Next dev server.
- `npm run preview` — runs the real Cloudflare build locally.

## Before going public
- `ALLOW_SAMPLE_DATA` in `wrangler.jsonc` lets the preview show fictional listings. Remove it once Bridge is live —
  without it, production refuses to serve sample data.
- Custom domain (Workers → Settings → Domains), HTTPS only, enable WAF/rate limiting/Bot Fight Mode.
- Secrets (Supabase keys, Resend key): `npx wrangler secret put NAME`, never commit them.
