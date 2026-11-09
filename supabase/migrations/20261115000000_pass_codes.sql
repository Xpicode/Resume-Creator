-- Pass codes: the customer pays the owner directly (e.g. GCash), the admin generates a one-time code,
-- the customer redeems it on the Billing page. Replaces PayMongo for now (that code stays, unused
-- until keys are set). RLS is enabled in this same migration.

------------------------------------------------------------------------------------------
-- pass_codes: only a SHA-256 hash of each code is stored, so a database leak can't be turned
-- into free passes. The admin sees the plain code once, when generating it.
------------------------------------------------------------------------------------------

create table public.pass_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  code_hint text not null check (char_length(code_hint) <= 8), -- last 4 characters, to tell codes apart
  plan text not null default 'pass_30d' check (plan in ('pass_30d')),
  note text not null default '' check (char_length(note) <= 200), -- e.g. buyer + GCash reference
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz
);

create index pass_codes_created_at_idx on public.pass_codes (created_at desc);

alter table public.pass_codes enable row level security;
-- No policies: only the server (service role, behind the admin check) reads or writes codes.

alter table public.entitlements
  add column source_code_id uuid references public.pass_codes (id) on delete set null;

create unique index entitlements_source_code_idx
  on public.entitlements (source_code_id) where source_code_id is not null;

------------------------------------------------------------------------------------------
-- redeem_pass_code: one transaction — lock the code, check it, mark it used, grant the pass.
-- Same eligibility as buying: a real account with a confirmed email (no guests).
-- Returns 'granted' | 'invalid' | 'used' | 'not_allowed'.
------------------------------------------------------------------------------------------

create or replace function public.redeem_pass_code(
  uid uuid,
  hash text,
  pass_days int,
  pass_credits int
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.pass_codes%rowtype;
  start_at timestamptz;
begin
  if not exists (
    select 1 from auth.users u
    where u.id = uid and not u.is_anonymous and u.email_confirmed_at is not null
  ) then
    return 'not_allowed';
  end if;

  select * into c from public.pass_codes where code_hash = hash for update;
  if not found or c.revoked_at is not null then
    return 'invalid';
  end if;
  if c.redeemed_at is not null then
    return 'used';
  end if;

  -- Same as a paid pass: a second pass while one is active starts when the current one ends.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 1));
  select greatest(now(), coalesce(max(ends_at), now())) into start_at
  from public.entitlements
  where user_id = uid and plan = 'pass_30d' and ends_at > now();

  update public.pass_codes set redeemed_by = uid, redeemed_at = now() where id = c.id;
  insert into public.entitlements
    (user_id, plan, ai_credits_remaining, starts_at, ends_at, source_code_id)
  values
    (uid, 'pass_30d', pass_credits, start_at, start_at + make_interval(days => pass_days), c.id);
  return 'granted';
end;
$$;

------------------------------------------------------------------------------------------
-- revoke_pass_code: an unused code stops working; a used one also ends its pass (= refund).
-- Returns 'revoked_unused' | 'revoked_redeemed' | 'already_revoked' | 'invalid'.
------------------------------------------------------------------------------------------

create or replace function public.revoke_pass_code(code_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.pass_codes%rowtype;
begin
  select * into c from public.pass_codes where id = code_id for update;
  if not found then
    return 'invalid';
  end if;
  if c.revoked_at is not null then
    return 'already_revoked';
  end if;
  update public.pass_codes set revoked_at = now() where id = c.id;
  if c.redeemed_at is null then
    return 'revoked_unused';
  end if;
  update public.entitlements
  set ends_at = least(ends_at, now()), ai_credits_remaining = 0
  where source_code_id = c.id;
  return 'revoked_redeemed';
end;
$$;

revoke execute on function public.redeem_pass_code(uuid, text, int, int) from public, anon, authenticated;
revoke execute on function public.revoke_pass_code(uuid) from public, anon, authenticated;

-- Code redemption attempts are rate-limited per user (guessing protection on top of long codes).
alter table public.rate_limit_hits drop constraint rate_limit_hits_action_check;
alter table public.rate_limit_hits
  add constraint rate_limit_hits_action_check
  check (action in ('preview', 'pdf', 'photo', 'export', 'share_pdf', 'redeem'));
