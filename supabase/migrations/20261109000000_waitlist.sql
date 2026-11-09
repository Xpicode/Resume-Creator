-- Phase 0 waitlist (plan Sections 1.6 and 6.8).
-- Written only by the server action with the secret key. The browser (anon/authenticated)
-- can neither read nor write it: RLS is on with NO policies, and grants are revoked too.

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (email = lower(email) and char_length(email) between 3 and 254),
  source text check (source ~ '^[a-z0-9-]{1,50}$'),
  consent_version text not null check (char_length(consent_version) <= 50),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

revoke all on table public.waitlist from anon, authenticated;

comment on table public.waitlist is
  'Pre-launch sign-ups. Personal data (email). Delete within 6 months after launch (Privacy Notice).';
