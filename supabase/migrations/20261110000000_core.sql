-- Phase 1 core tables (plan Section 4). RLS is enabled in this same migration for every table.

------------------------------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

------------------------------------------------------------------------------------------
-- profiles (1:1 with auth.users, created by trigger)
------------------------------------------------------------------------------------------

create type public.onboarding_goal as enum ('fresh_grad', 'experienced', 'career_shifter', 'government');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 100),
  onboarding_goal public.onboarding_goal,
  locale text not null default 'en' check (locale in ('en', 'fil')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "owner can select" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "owner can update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No insert/delete policies: rows are created by the trigger below and removed by cascade.

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------------------
-- templates (public catalogue)
------------------------------------------------------------------------------------------

create table public.templates (
  slug text primary key,
  name text not null,
  is_ats_safe boolean not null,
  supports_photo boolean not null,
  is_premium boolean not null default false,
  version int not null default 1
);

alter table public.templates enable row level security;

create policy "anyone can read templates" on public.templates
  for select to anon, authenticated using (true);

insert into public.templates (slug, name, is_ats_safe, supports_photo) values
  ('ats-classic', 'ATS Classic', true, false),
  ('ph-traditional', 'PH Traditional', false, true);

------------------------------------------------------------------------------------------
-- resumes (one row per resume; the whole document lives in `content`, plan 4.1)
------------------------------------------------------------------------------------------

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  template_slug text not null default 'ats-classic' references public.templates (slug),
  paper_size text not null default 'A4' check (paper_size in ('A4', 'LETTER')),
  settings jsonb not null default '{}'
    check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) <= 10000),
  content jsonb not null default '{}'
    check (jsonb_typeof(content) = 'object' and pg_column_size(content) <= 200000),
  parent_resume_id uuid references public.resumes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resumes_user_id_idx on public.resumes (user_id);

alter table public.resumes enable row level security;

create policy "owner can select" on public.resumes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can insert" on public.resumes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owner can update" on public.resumes
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owner can delete" on public.resumes
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger resumes_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();

-- Plan limits live in the database (plan 4.3), because users can call the API directly.
-- Phase 1: anonymous and Free accounts may create 1 resume. Phase 2/3 reads entitlements here.
create or replace function public.resume_limit(uid uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select 1;
$$;

create or replace function public.enforce_resume_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count int;
begin
  -- Serialize inserts per user so parallel requests can't both pass the count.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  select count(*) into current_count from public.resumes where user_id = new.user_id;
  if current_count >= public.resume_limit(new.user_id) then
    raise exception 'resume_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger resumes_enforce_limit before insert on public.resumes
  for each row execute function public.enforce_resume_limit();

------------------------------------------------------------------------------------------
-- consents (append-only record of what the user agreed to)
------------------------------------------------------------------------------------------

create type public.consent_type as enum ('privacy_policy', 'terms', 'ai_processing', 'marketing');

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  consent_type public.consent_type not null,
  version text not null check (char_length(version) <= 50),
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index consents_user_id_idx on public.consents (user_id);

alter table public.consents enable row level security;

create policy "owner can select" on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can insert" on public.consents
  for insert to authenticated
  with check ((select auth.uid()) = user_id and withdrawn_at is null);

------------------------------------------------------------------------------------------
-- Photos: private bucket, path {user_id}/{resume_id}/photo.jpg (plan 4.3 / 6.5)
------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

create policy "owner can read photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner can upload photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner can replace photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner can delete photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

------------------------------------------------------------------------------------------
-- Anonymous cleanup (plan 6.2): ids of anonymous users with no activity for 30 days.
-- Server-only: the cleanup job deletes their photos through the Storage API, then the user.
------------------------------------------------------------------------------------------

create or replace function public.stale_anonymous_user_ids(max_rows int default 500)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from auth.users u
  where u.is_anonymous
    and greatest(
      u.created_at,
      coalesce(u.last_sign_in_at, u.created_at),
      coalesce((select max(r.updated_at) from public.resumes r where r.user_id = u.id), u.created_at)
    ) < now() - interval '30 days'
  limit max_rows;
$$;

revoke execute on function public.stale_anonymous_user_ids(int) from public, anon, authenticated;
revoke execute on function public.resume_limit(uuid) from public, anon, authenticated;
revoke execute on function public.enforce_resume_limit() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
