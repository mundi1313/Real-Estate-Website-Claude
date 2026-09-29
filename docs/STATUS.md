# Build status

## Done (scaffold, sample data)
- Next.js 16 + Tailwind app; RECA agent/eXp footer in root layout (every page).
- Listings layer behind a `ListingProvider` interface; `compliance.ts` is the single choke point that drops
  Internet Display = N and opted-out brokerages, hides addresses when Display Address = N (coarse pin),
  never exposes private remarks / seller contact, caps at 1,500 listings / 100 per page.
- Search (filters, pagination), listing detail (MLS® #, mortgage calculator, similar listings, tour form),
  MLS® notice (copyright, reliability, consumer-use, last-updated in viewer's time zone), draft Privacy/Terms.
- Supabase schema (`supabase/migrations/0001_init.sql`): profiles w/ 90-day password expiry, audit log, saved
  listings/searches, tour requests, CRM lead events/notes, RAE client report view, RLS.
- Production refuses to serve sample data unless `ALLOW_SAMPLE_DATA=true`.

- Cloudflare deploy config (OpenNext adapter; verified building + serving under `wrangler dev`). See `docs/DEPLOY.md`.

- Signup/login popup (Google + email), 3-listing gate, audit log, lead events, demo backend + Supabase backend. See `docs/AUTH_SETUP.md`.
- Modern redesign (home, search, listing detail, mobile).

## Blocked on RAE / Bridge
- Real provider (Bridge RESO Web API), field mapping, 3–6h refresh job. Confirm application status first.

## TODO
- Connect real Supabase (keys + run migrations), Google provider, forgot-password + 90-day reset flow.
- Favourites, saved searches + alert emails (Resend), tour request persistence + notification.
- CRM dashboard + intent scoring/notifications; quarterly RAE report job (first business day of each quarter).
- Map view, Walk/Transit/Bike Score (label as third-party data), WAF/rate limiting/anti-scraping (Cloudflare dashboard).
  Cloudflare Pages deployment (verify the current Next 16 adapter path).
- Final domain; legal review of Privacy/Terms.
