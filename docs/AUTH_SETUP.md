# Accounts & lead capture

## How it works
- Visitors browse freely. On the **very first listing** (`FREE_LISTING_VIEWS = 0` in `src/lib/auth/rules.ts`; raise it to allow free views) a "Continue Your Home Search" popup asks them to sign up.
- **No passwords.** **Google**: name + email come from Google, then a short step asks for phone + consent.
  **Email**: first/last name, email, phone, consent — then we email a one-time sign-in link. Returning users just enter
  their email: the popup checks whether it is registered and, if so, only sends the link (no form). New emails get the details form. If the email is new, an account is created and the popup asks for name, phone and consent as soon
  as the link is opened (or right away in demo mode) — there is no dead end for people who pick "Log in" by mistake.
- **Booking a tour** uses the signed-in profile (name/email/phone are never re-typed); they only pick a date and time.
  Requests are saved to `tour_requests` and logged as a lead event.
- Signed-in visitors: each listing they open is recorded on their lead record (`lead_events`).
- Every register / login / failed login / logout is written to `audit_log` with IP + browser.

## Demo mode (default, no setup)
With no Supabase keys the site uses a local test store (`.data/demo-auth.json`, git-ignored): email signup works,
verification is skipped, Google is disabled. It switches itself off in production.

## Switch to real accounts (Supabase)
1. supabase.com → New project. Settings → API: copy the Project URL, `anon` key and `service_role` key
   into `.env.local` (see `.env.example`). Keep the service_role key secret.
2. SQL Editor: run `supabase/migrations/0001_init.sql`, then `0002_signup_flow.sql`.
3. Authentication → Providers → Email: keep **Confirm email** ON.
4. Authentication → URL Configuration: Site URL `http://localhost:3000`; add Redirect URL `http://localhost:3000/auth/callback`
   (add your real domain later).
5. **Email templates: leave the defaults for now.** Supabase only allows template edits once custom SMTP is set up. The default
   link works when opened in the *same browser* used to sign up (PKCE `?code=`, handled in `/auth/callback`). Before launch, set
   up custom SMTP (e.g. Resend), then change both *Confirm signup* and *Magic Link* links to
   `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` so links also work from another device (the callback
   already supports `token_hash`).
6. **Email sending limit:** with the built-in sender, mail only reaches your own Supabase team addresses and is capped at a
   few messages per hour — fine for testing, not for real visitors. Before launch add custom SMTP: Authentication → Emails → SMTP Settings.
7. Restart `npm run dev`. The "Demo mode" banner disappears.

## Turn on "Continue with Google" (free)
1. console.cloud.google.com → new project → APIs & Services → OAuth consent screen (External, app name, support email).
2. Credentials → Create credentials → OAuth client ID → Web application. Authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Copy the Client ID + Secret into Supabase → Authentication → Providers → Google → enable.
Only name + email are requested, so Google needs no app review.

## Before launch
- **RAE approval.** The owner chose passwordless sign-in (email link + Google). RAE's checklist (as summarized in
  `docs/PROJECT_BRIEF.md`) asks for unique usernames/passwords with 90-day expiry and no social-login shortcuts — get RAE to
  confirm in writing that this flow is acceptable before going live. If not, passwords must be added back.
- eXp/counsel must approve the consent wording in `src/lib/auth/consent.ts` (CASL). The exact text each person saw is stored
  on their profile.
- Still to build: reCAPTCHA + rate limiting on the signup/sign-in-link forms, lead + tour-request alert emails to Arman,
  quarterly RAE client-list export (`rae_client_report` view exists).
- Cloudflare: Next's `proxy.ts` (session refresh) runs as *experimental* Node middleware on the OpenNext adapter — test
  sign-in on the deployed preview before relying on it. Set the three env vars in the Cloudflare dashboard.

## Your admin dashboard (private CRM)
- **Where:** `/admin` on the site (locally http://localhost:3000/admin). Sign in with the same email link as visitors; you get an
  orange **Admin** button in the header. Pages: Overview (stats, showings to confirm, hot leads, recent activity), Leads (search +
  filters), each lead's profile (contact, consent wording on file, homes viewed, timeline, notes, stage), Showings inbox, and a
  **RAE client list CSV** download.
- **Who can open it:** only emails in `ADMIN_EMAILS` (comma-separated, in `.env.local` and in Cloudflare's environment variables).
  With Supabase connected and `ADMIN_EMAILS` empty, *nobody* can open it. In local demo mode only, any signed-in test user can.
- **Everyone else gets a plain 404**, and every admin page, action and download re-checks permission on the server.
- **Migration:** run `supabase/migrations/0003_crm.sql` (adds the lead stage) after 0001 and 0002.
- **Try it full of data (demo mode only):** `npm run seed:demo` adds 12 fictional leads; `npm run seed:demo -- --clear` removes them.
- **Lead temperature** (Hot / Warm / Cool) is a points score — the rules are at the top of `src/lib/crm/score.ts`.
- **Not built yet:** email/SMS alerts to you, and bulk actions.

## Email alerts to you
Set in `.env.local` (and later in Cloudflare): `RESEND_API_KEY`, `ALERT_TO_EMAIL` (defaults to the first `ADMIN_EMAILS`),
`ALERT_FROM`, and `SITE_URL`. You get an email for: a **new lead**, a **showing request** (with the visitor's note and a link to
their profile), and a lead **turning hot** (sent once, at the moment their score crosses the line). With no key set, alerts are
just printed in the terminal. A failing email service never affects visitors (4-second limit, errors are only logged).
Until you verify your own domain in Resend, the test sender `onboarding@resend.dev` only delivers to the email you signed up to
Resend with. After verifying a domain, set `ALERT_FROM="Leads <alerts@yourdomain.ca>"`.

## No-email sign-in, welcome email, admin password
- **Visitors never receive a confirmation or sign-in email.** First time: name + phone + consent, then they are in instantly.
  Returning (any browser, any device): just their email. The popup checks whether the email is registered (so it can skip the form).
- **Trade-off (owner's decision):** anyone who types a registered *visitor* email is signed in as that visitor, so a visitor's
  name/phone/activity are only as private as their email address. Worth revisiting before launch.
- **Welcome email** (the only email a visitor gets): sent once after they register, from `MAIL_FROM`
  (e.g. `Keys to Edmonton <hello@keystoedmonton.ca>`), transactional only, with Arman's name + eXp Realty in the footer. Without
  `RESEND_API_KEY` + `MAIL_FROM` it is only printed in the server log. Supabase's SMTP/templates are no longer used for visitors.
- **Admin is different.** Emails in `ADMIN_EMAILS` can never be signed in (or signed up) with just an email: the popup asks for
  `ADMIN_PASSWORD`. Two locks guard `/admin`: the admin email, plus a signed `admin_ok` cookie (HttpOnly, SameSite=Strict, 12 h)
  that only the password creates — so even a session obtained another way (e.g. Google) is asked for the password at `/admin`.
  Wrong guesses: 0.9 s delay; 5 failures per IP / 15 min or 30 per hour overall locks admin sign-in for the window.
  With Supabase connected and no `ADMIN_PASSWORD`, nobody can open `/admin` (fails closed). The admin account is excluded from the
  leads list, stats and RAE export.
- **Set `ADMIN_PASSWORD` in `.env.local` and run `npm run deploy:secrets`.** Never put it in code, docs or chat. Use a long unique one.
- **RAE:** the brief's checklist asks for email verification before an account is active and no persistent logins; this design
  deliberately drops verification. Get RAE's written OK before going public.
