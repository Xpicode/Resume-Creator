-- Phase 4: shareable resume links /r/{slug} (plan 8 Phase 4 task 2). RLS in this same migration.
-- Off by default (no row = not shared). Turning it off deletes the row, so the old link dies for good;
-- turning it on again makes a new random slug. Kept apart from `resumes` so toggles and view counts
-- don't bump resumes.updated_at (which the editor uses to detect edits from another tab).

create table public.resume_shares (
  resume_id uuid primary key references public.resumes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[A-Za-z0-9]{16}$'), -- 62^16 ≈ 4.7e28: can't be guessed
  show_contact boolean not null default false,   -- phone, email and full address hidden by default
  allow_indexing boolean not null default false, -- noindex unless the user says otherwise
  views int not null default 0 check (views >= 0),
  created_at timestamptz not null default now()
);

create index resume_shares_user_id_idx on public.resume_shares (user_id);

alter table public.resume_shares enable row level security;

create policy "owner can select" on public.resume_shares
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can insert" on public.resume_shares
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid()))
  );
create policy "owner can update" on public.resume_shares
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owner can delete" on public.resume_shares
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Owners may only change the two settings; slug, owner and view count are server-controlled.
revoke update on public.resume_shares from anon, authenticated;
grant update (show_contact, allow_indexing) on public.resume_shares to authenticated;

/** Counts a visit to a public link. Called by the server only. */
create or replace function public.count_share_view(share_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.resume_shares set views = views + 1 where slug = share_slug;
$$;

revoke execute on function public.count_share_view(text) from public, anon, authenticated;

-- PDF downloads from a public link are rate-limited per resume owner.
alter table public.rate_limit_hits drop constraint rate_limit_hits_action_check;
alter table public.rate_limit_hits
  add constraint rate_limit_hits_action_check
  check (action in ('preview', 'pdf', 'photo', 'export', 'share_pdf'));
