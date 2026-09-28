# Project Brief: Personal Real Estate IDX Website

**Owner:** Arman Mundi — REALTOR®, Müve Team, eXp Realty, Edmonton, Alberta.
**Goal:** Independently-owned site (not muvehomes.ca) showing searchable Edmonton-area MLS® listings, capturing leads, and tracking lead activity in a personal CRM. Single agent only — do NOT build multi-tenancy.

## Domain / branding
- Generic, city-focused domain (e.g. "EdmontonUrbanLiving.ca" style), not Arman's name.
- Taken — do not suggest: EdmontonHomes.ca/.com, EdmontonRealEstate.ca, EdmontonHomesWeb.com.
- No "REALTOR" or "MLS" in the domain (CREA trademark rules).
- Avoid RECA-restricted words in branding: Associates, Brokerage, Company, Corp, Inc, Ltd.
- Every page must show Arman's name and "eXp Realty" (RECA). Part of the template (footer + listing pages).

## Data source: RAE Member IDX License
- REALTORS® Association of Edmonton, Member License, IDX (Active only). No VOW.
- $250 setup + $250/yr. No broker sign-off required (RAE, Sep 2026).
- Delivered via Bridge Interactive (Bridge API). After approval: Bridge invite + 45-day test feed.
- Website use only — no mobile app.
- Status: application submitted to technology@therae.com, awaiting approval + Bridge invite. **Confirm status before building the data integration.**

## Compliance (RAE IDX & VOW Checklist §4, effective Jan 13 2026)
- Max 1,500 listings displayed total, 100 per page.
- Refresh at least every 24h (aim for every few hours). Show last-updated timestamp in viewer's time zone.
- Every page with MLS® data shows: "Copyright [year] by the REALTORS® Association of Edmonton. All Rights Reserved."; reliability disclaimer ("Data is deemed reliable but is not guaranteed accurate by the REALTORS® Association of Edmonton."); consumer-use-only notice; Arman's name + eXp Realty; MLS® number on every detail view.
- Suppress: private/cooperating-brokerage remarks, seller/occupant contact info, Internet Display = 'N', Display Address = 'N' (use postal code/municipality centre), brokerages opted out of IDX.
- Never alter listing data (don't round bathrooms). Label the source of non-MLS® data.
- Security: WAF, anti-scraping, HTTPS only.
- Privacy policy displayed; user info never sold/disclosed for compensation.
- Consumer accounts: name, phone, valid email, terms agreement; email verification; unique username/password (no social login); no persistent/auto-login; passwords expire every 90 days; audit trail; retain user records ≥180 days after password expiry; terms must include no agency relationship, personal/non-commercial use, bona fide interest, no copying/redistribution, RAE copyright, info may be shared with RAE; report breaches/scraping to RAE immediately.
- Reporting: send RAE full user/client list on add/remove or at minimum first business day of each quarter — must be a real recurring process.

## Stack (decided)
Next.js · PostgreSQL · Supabase (DB + auth) · Cloudflare Pages · Google Maps or Mapbox · Resend or SendGrid · listing photos served from RAE/Bridge CDN.

## MVP features
Search + filters + map; listing detail (photos, price/beds/baths/sqft, description, MLS®#, mortgage calculator, walk/transit/bike score, similar listings); compliant user accounts; favourites (login-gated); saved searches with alerts; Schedule a Tour; personal CRM (saved listings, searches, views, tour requests per lead + notifications to Arman on real intent). Post-MVP: community pages, blog/guides.

## Out of scope
Mobile app · multi-agent/multi-tenant · VOW/sold data.

## Open items
Final domain (brainstorm + availability check) · RAE/Bridge application status · exact Bridge API schema once test feed is granted.
