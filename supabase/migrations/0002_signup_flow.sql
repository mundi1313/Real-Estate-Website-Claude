-- Signup flow: Google or emailed-link signup (no passwords), phone + consent captured, profile auto-created by trigger.

alter table public.tour_requests add column message text;

alter table public.profiles
  add column first_name text,
  add column last_name text,
  add column signup_source text not null default 'email' check (signup_source in ('email','google')),
  add column marketing_consent_at timestamptz,
  add column marketing_consent_text text,          -- exact wording the user agreed to (proof of consent)
  alter column phone drop not null,                -- Google users add it right after signing in
  alter column terms_accepted_at drop not null,
  alter column terms_version drop not null;

-- Active only once phone + terms are on file.
alter table public.profiles
  add column profile_complete boolean generated always as (phone is not null and terms_accepted_at is not null) stored;

alter table public.lead_events drop constraint lead_events_event_type_check;
alter table public.lead_events add constraint lead_events_event_type_check check (event_type in
  ('listing_view','listing_saved','search_saved','tour_requested','login','return_visit','signup'));

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  display_name text := coalesce(meta->>'full_name', meta->>'name', '');
  fn text := coalesce(meta->>'first_name', nullif(split_part(display_name, ' ', 1), ''));
  ln text := coalesce(meta->>'last_name', nullif(regexp_replace(display_name, '^\S+\s*', ''), ''));
begin
  insert into public.profiles (id, full_name, first_name, last_name, phone, username, signup_source,
    terms_accepted_at, terms_version, marketing_consent_at, marketing_consent_text)
  values (new.id, trim(coalesce(fn, '') || ' ' || coalesce(ln, '')), fn, ln, nullif(meta->>'phone', ''), lower(new.email),
    case when new.raw_app_meta_data->>'provider' = 'google' then 'google' else 'email' end,
    case when meta->>'terms_accepted' = 'true' then now() end, meta->>'terms_version',
    case when meta->>'marketing_consent' = 'true' then now() end, meta->>'marketing_consent_text');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
