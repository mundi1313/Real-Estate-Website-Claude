-- Instant sign-up + "trusted device" sign-in. Only a hash of the device cookie is stored.
create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  created_at timestamptz not null default now()
);
create index on public.trusted_devices (user_id);
alter table public.trusted_devices enable row level security;  -- no policies: service role only

-- Set when the visitor has actually clicked an emailed link (instant accounts start unverified).
alter table public.profiles add column email_verified_at timestamptz;
