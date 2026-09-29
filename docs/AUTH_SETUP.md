# Accounts & lead capture

## How it works
- Visitors browse freely. After they open **3 different listings** (`FREE_LISTING_VIEWS` in `src/lib/auth/rules.ts`)
  a "Continue Your Home Search" popup asks them to sign up.
- **Google**: name + email come from Google, then a short step asks for phone + consent.
- **Email**: first/last name, email, phone, password, consent.
- Signed-in visitors: each listing they open is recorded on their lead record (`lead_events`).
- Every register / login / failed login / logout is written to `audit_log` with IP + browser.

## Demo mode (default, no setup)
With no Supabase keys the site uses a local test store (`.data/demo-auth.json`, git-ignored): email signup works,
verification is skipped, Google is disabled. It switches itself off in production.

## Switch to real accounts (Supabase)
1. supabase.com → New project. Settings → API: copy the Project URL, `anon` key and `service_role` key
   into `.env.local` (see `.env.example`). Keep the service_role key secret.
2. SQL Editor: run `supabase/migrations/0001_init.sql`, then `0002_signup_flow.sql`.
3. Authentication → Providers → Email: keep **Confirm email** ON (RAE requires verified emails).
4. Authentication → URL Configuration: Site URL `http://localhost:3000`; add Redirect URL `http://localhost:3000/auth/callback`
   (add your real domain later).
5. Authentication → Email Templates → *Confirm signup*: change the link to
   `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` so verification works from any browser.
6. Restart `npm run dev`. The "Demo mode" banner disappears.

## Turn on "Continue with Google" (free)
1. console.cloud.google.com → new project → APIs & Services → OAuth consent screen (External, app name, support email).
2. Credentials → Create credentials → OAuth client ID → Web application. Authorized redirect URI:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Copy the Client ID + Secret into Supabase → Authentication → Providers → Google → enable.
Only name + email are requested, so Google needs no app review.

## Before launch
- **RAE approval of Google sign-in** (no password, so the 90-day password rule can't apply) — ask RAE. To switch Google
  off, remove the button in `src/components/AuthModal.tsx`.
- eXp/counsel must approve the consent wording in `src/lib/auth/consent.ts` (CASL). The exact text each person saw is stored
  on their profile.
- Still to build: forgot-password + 90-day expiry reset flow (login already blocks expired passwords), reCAPTCHA,
  rate limiting, lead alert emails to Arman, quarterly RAE client-list export (`rae_client_report` view exists).
- Cloudflare: Next's `proxy.ts` (session refresh) runs as *experimental* Node middleware on the OpenNext adapter — test
  sign-in on the deployed preview before relying on it. Set the three env vars in the Cloudflare dashboard.
