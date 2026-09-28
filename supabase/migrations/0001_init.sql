-- Personal IDX site schema. Single-agent (no multi-tenancy).
-- Auth users live in Supabase's auth.users; `profiles` extends them.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  username text not null unique,
  terms_accepted_at timestamptz not null,
  terms_version text not null,
  password_changed_at timestamptz not null default now(),   -- expire after 90 days
  password_expires_at timestamptz generated always as (password_changed_at + interval '90 days') stored,
  deactivated_at timestamptz,                                -- keep record >=180 days after expiry
  created_at timestamptz not null default now()
);

create table public.saved_listings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mls_number text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mls_number)
);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null,
  alert_frequency text not null default 'daily' check (alert_frequency in ('instant','daily','weekly','off')),
  last_alerted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.tour_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  mls_number text not null,
  name text not null,
  email text not null,
  phone text not null,
  preferred_times text,
  status text not null default 'new' check (status in ('new','contacted','scheduled','done','cancelled')),
  created_at timestamptz not null default now()
);

-- CRM: every meaningful action becomes a lead event; a score drives notifications to Arman.
create table public.lead_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in
    ('listing_view','listing_saved','search_saved','tour_requested','login','return_visit')),
  mls_number text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.lead_events (user_id, created_at desc);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- Compliance audit trail (RAE): who did what, when, from where. Append-only.
create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,           -- register, verify_email, login, logout, password_change, view_listing, ...
  ip inet,
  user_agent text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.audit_log (user_id, created_at desc);

-- Quarterly / on-change client list for RAE.
create view public.rae_client_report as
  select p.full_name, p.phone, u.email, p.username, p.created_at, p.deactivated_at
  from public.profiles p join auth.users u on u.id = p.id
  where p.deactivated_at is null or p.deactivated_at > now() - interval '180 days';

-- Row-level security: users see only their own rows. Arman uses the service role.
alter table public.profiles enable row level security;
alter table public.saved_listings enable row level security;
alter table public.saved_searches enable row level security;
alter table public.tour_requests enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_notes enable row level security;
alter table public.audit_log enable row level security;

create policy own_profile on public.profiles for select using (auth.uid() = id);
create policy own_saved_listings on public.saved_listings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_saved_searches on public.saved_searches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_tours on public.tour_requests for select using (auth.uid() = user_id);
-- lead_events, lead_notes, audit_log: no user policies => service role only.
revoke all on public.rae_client_report from anon, authenticated;
