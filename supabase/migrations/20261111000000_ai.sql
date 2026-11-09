-- Phase 2: AI assistant (plan Sections 4.2, 7, 8). RLS is enabled in this same migration for every table.

------------------------------------------------------------------------------------------
-- entitlements: what a user may use. Phase 2 only has the monthly Free allowance;
-- Phase 3 adds paid passes (rows written by the PayMongo webhook).
------------------------------------------------------------------------------------------

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('free', 'pass_30d')),
  ai_credits_remaining int not null check (ai_credits_remaining >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz,
  source_payment_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, plan, starts_at)
);

create index entitlements_user_id_idx on public.entitlements (user_id);

alter table public.entitlements enable row level security;

-- Users may only read their own; all writes happen on the server (plan 4.3).
create policy "owner can select" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

-- Hypothesis (plan Section 15, decision 2). Keep in sync with FREE_MONTHLY_AI_CREDITS in src/features/ai/config.ts.
create or replace function public.free_monthly_ai_credits()
returns int
language sql
immutable
as $$
  select 10;
$$;

/**
 * Atomically takes `amount` credits from the user's current entitlement (paid pass first, then the
 * monthly Free allowance, created on first use). Returns the entitlement id, or null when the user
 * has too few credits, is a guest, or hasn't confirmed their email (plan 6.2 / 7.4).
 */
create or replace function public.consume_ai_credits(uid uuid, amount int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila';
  taken uuid;
begin
  if amount < 1 or amount > 10 then
    raise exception 'invalid_amount';
  end if;
  if not exists (
    select 1 from auth.users u
    where u.id = uid and not u.is_anonymous and u.email_confirmed_at is not null
  ) then
    return null;
  end if;

  insert into public.entitlements (user_id, plan, ai_credits_remaining, starts_at, ends_at)
  values (uid, 'free', public.free_monthly_ai_credits(), month_start, month_start + interval '1 month')
  on conflict (user_id, plan, starts_at) do nothing;

  -- One statement: the row lock + re-check means parallel requests can never go below zero.
  update public.entitlements e
  set ai_credits_remaining = e.ai_credits_remaining - amount
  where e.id = (
      select id from public.entitlements
      where user_id = uid
        and now() >= starts_at
        and (ends_at is null or now() < ends_at)
        and ai_credits_remaining >= amount
      order by (plan = 'free'), ends_at nulls last
      limit 1
      for update
    )
    and e.ai_credits_remaining >= amount
  returning e.id into taken;

  return taken;
end;
$$;

/** Gives credits back when the AI call failed, so users never pay for an error. */
create or replace function public.refund_ai_credits(entitlement uuid, amount int)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.entitlements
  set ai_credits_remaining = ai_credits_remaining + amount
  where id = entitlement;
$$;

------------------------------------------------------------------------------------------
-- ai_usage: tokens and outcome per call, for cost tracking and the per-minute cap.
-- NO prompt or output text (plan 4.2 / 6.8).
------------------------------------------------------------------------------------------

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature in ('improve_bullet', 'write_summary', 'tailor')),
  model text not null check (char_length(model) <= 60),
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  status text not null check (status in ('ok', 'error', 'refused', 'invalid')),
  created_at timestamptz not null default now()
);

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

create policy "owner can select" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);

------------------------------------------------------------------------------------------
-- job_targets: a pasted job post. Deleted with its resume (plan 6.8).
------------------------------------------------------------------------------------------

create table public.job_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  company text not null default '' check (char_length(company) <= 150),
  position text not null default '' check (char_length(position) <= 150),
  job_description text not null check (char_length(job_description) between 1 and 15000),
  created_at timestamptz not null default now()
);

create index job_targets_resume_id_idx on public.job_targets (resume_id);

alter table public.job_targets enable row level security;

create policy "owner can select" on public.job_targets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can insert" on public.job_targets
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid()))
  );
create policy "owner can delete" on public.job_targets
  for delete to authenticated using ((select auth.uid()) = user_id);

------------------------------------------------------------------------------------------
-- ai_suggestions: tailoring results the user accepts or dismisses. Auto-deleted after 90 days
-- by the daily cleanup job.
------------------------------------------------------------------------------------------

create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  job_target_id uuid references public.job_targets (id) on delete cascade,
  feature text not null check (feature in ('tailor')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 100000),
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed')),
  created_at timestamptz not null default now()
);

create index ai_suggestions_resume_id_idx on public.ai_suggestions (resume_id);

alter table public.ai_suggestions enable row level security;

create policy "owner can select" on public.ai_suggestions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can insert" on public.ai_suggestions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid()))
  );
create policy "owner can update" on public.ai_suggestions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owner can delete" on public.ai_suggestions
  for delete to authenticated using ((select auth.uid()) = user_id);

------------------------------------------------------------------------------------------
-- consents: let users withdraw (Settings → AI processing toggle, plan 8 Phase 2 task 10).
-- Only withdrawn_at can change, and only from empty to a time.
------------------------------------------------------------------------------------------

create policy "owner can withdraw" on public.consents
  for update to authenticated
  using ((select auth.uid()) = user_id and withdrawn_at is null)
  with check ((select auth.uid()) = user_id and withdrawn_at is not null);

create or replace function public.consents_only_withdraw()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id <> old.user_id or new.consent_type <> old.consent_type
     or new.version <> old.version or new.granted_at <> old.granted_at then
    raise exception 'consents_are_append_only';
  end if;
  return new;
end;
$$;

create trigger consents_only_withdraw before update on public.consents
  for each row execute function public.consents_only_withdraw();

------------------------------------------------------------------------------------------
-- Server-only functions
------------------------------------------------------------------------------------------

revoke execute on function public.consume_ai_credits(uuid, int) from public, anon, authenticated;
revoke execute on function public.refund_ai_credits(uuid, int) from public, anon, authenticated;
