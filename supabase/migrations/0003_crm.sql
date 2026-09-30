-- CRM: pipeline stage per lead + indexes for the admin dashboard.
alter table public.profiles
  add column lead_status text not null default 'new'
  check (lead_status in ('new','contacted','nurturing','client','closed'));

create index on public.lead_events (event_type, created_at desc);
create index on public.tour_requests (status, created_at desc);
-- lead_notes, lead_events, tour_requests are read/written only through the service role (admin pages).
