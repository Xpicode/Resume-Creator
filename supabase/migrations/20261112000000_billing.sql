-- Phase 3: payments (plan Sections 3.2, 4.2, 8 Phase 3A). RLS is enabled in this same migration for every table.
-- Flow: server creates a `payments` row + PayMongo Checkout → user pays → signed webhook →
-- process_payment_event() grants the pass in one transaction. The success page never grants anything.

------------------------------------------------------------------------------------------
-- payments: one row per checkout attempt. Kept (unlinked) when the account is deleted —
-- sales records must be kept for tax (BIR); they hold no resume or contact data.
------------------------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null default 'paymongo' check (provider in ('paymongo')),
  plan text not null check (plan in ('pass_30d')),
  checkout_id text unique check (char_length(checkout_id) <= 100),   -- cs_…
  provider_ref text unique check (char_length(provider_ref) <= 100), -- pay_…, set when paid
  amount_centavos int not null check (amount_centavos > 0),
  currency text not null default 'PHP' check (currency = 'PHP'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  livemode boolean,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_user_id_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

-- Read-only for the owner (billing history). All writes are server-side.
create policy "owner can select" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

------------------------------------------------------------------------------------------
-- webhook_events: the unique event id makes every webhook idempotent (plan 4.2). Server only.
------------------------------------------------------------------------------------------

create table public.webhook_events (
  provider_event_id text primary key check (char_length(provider_event_id) <= 100),
  type text not null check (char_length(type) <= 100),
  result text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.webhook_events enable row level security;
-- No policies: nobody but the service role can read or write it.

------------------------------------------------------------------------------------------
-- entitlements ← payments link. One grant per payment, ever.
------------------------------------------------------------------------------------------

alter table public.entitlements
  add constraint entitlements_source_payment_fk
  foreign key (source_payment_id) references public.payments (id) on delete set null;

create unique index entitlements_source_payment_idx
  on public.entitlements (source_payment_id) where source_payment_id is not null;

------------------------------------------------------------------------------------------
-- Resume limit: Free = 1, active Job Hunt Pass = 50.
-- ponytail: 50 is "unlimited" with an abuse ceiling; raise if a real user hits it.
-- Keep in sync with PASS.resumeLimit in src/features/billing/plans.ts.
-- After a pass ends, extra resumes are kept and still editable; only creating new ones is blocked.
------------------------------------------------------------------------------------------

create or replace function public.resume_limit(uid uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.entitlements
      where user_id = uid and plan = 'pass_30d' and now() >= starts_at and now() < ends_at
    ) then 50
    else 1
  end;
$$;

------------------------------------------------------------------------------------------
-- process_payment_event: called only by the webhook route after it has verified the signature.
-- Everything happens in one transaction: record event (dedupe) → update payment → grant/revoke.
-- Returns what happened, for the event log and tests. Prices/credits/days come from plans.ts.
------------------------------------------------------------------------------------------

create or replace function public.process_payment_event(
  event_id text,
  event_type text,
  event_livemode boolean,
  payment_id uuid,          -- our payments.id (sent as the checkout reference_number) — paid events
  provider_payment text,    -- PayMongo pay_… id — paid and refund events
  paid_amount int,          -- centavos actually paid — paid events
  pass_days int,
  pass_credits int
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.payments%rowtype;
  start_at timestamptz;
  outcome text;
begin
  insert into public.webhook_events (provider_event_id, type)
  values (event_id, event_type)
  on conflict (provider_event_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  if event_type = 'checkout_session.payment.paid' then
    select * into p from public.payments where id = payment_id for update;
    if not found then
      outcome := 'unknown_payment';
    elsif p.status <> 'pending' then
      outcome := 'already_' || p.status;
    elsif paid_amount is distinct from p.amount_centavos then
      outcome := 'amount_mismatch';
    else
      update public.payments
      set status = 'paid', provider_ref = provider_payment, livemode = event_livemode, paid_at = now()
      where id = p.id;

      if p.user_id is null then
        outcome := 'paid_no_user'; -- account deleted during checkout: refund it by hand
      else
        -- Buying again while a pass is active extends it: the new 30 days start when the current pass ends.
        perform pg_advisory_xact_lock(hashtextextended(p.user_id::text, 1));
        select greatest(now(), coalesce(max(ends_at), now())) into start_at
        from public.entitlements
        where user_id = p.user_id and plan = 'pass_30d' and ends_at > now();

        insert into public.entitlements
          (user_id, plan, ai_credits_remaining, starts_at, ends_at, source_payment_id)
        values
          (p.user_id, 'pass_30d', pass_credits, start_at, start_at + make_interval(days => pass_days), p.id);
        outcome := 'granted';
      end if;
    end if;

  elsif event_type in ('payment.refunded', 'payment.refund.updated') then
    select * into p from public.payments where provider_ref = provider_payment for update;
    if not found then
      outcome := 'unknown_payment';
    elsif p.status = 'refunded' then
      outcome := 'already_refunded';
    else
      update public.payments set status = 'refunded', refunded_at = now() where id = p.id;
      -- ponytail: any refund (even partial) ends the pass. Split by amount if partial refunds become common.
      update public.entitlements
      set ends_at = least(ends_at, now()), ai_credits_remaining = 0
      where source_payment_id = p.id;
      outcome := 'revoked';
    end if;

  else
    outcome := 'ignored';
  end if;

  update public.webhook_events
  set result = outcome, processed_at = now()
  where provider_event_id = event_id;
  return outcome;
end;
$$;

revoke execute on function public.process_payment_event(text, text, boolean, uuid, text, int, int, int)
  from public, anon, authenticated;
