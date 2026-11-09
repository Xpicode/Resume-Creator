-- Per-user rate limits for the heavy endpoints (plan 6.7): preview image, PDF download, photo upload,
-- data export. Same idea as the AI per-minute cap: count recent rows in Postgres, no extra service.
-- RLS is enabled in this same migration; only the server (service role) touches this table.

create table public.rate_limit_hits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('preview', 'pdf', 'photo', 'export')),
  created_at timestamptz not null default now()
);

create index rate_limit_hits_lookup_idx on public.rate_limit_hits (user_id, action, created_at desc);

alter table public.rate_limit_hits enable row level security;
-- No policies: users can't read, write or reset their own counters.

/**
 * Counts this request and returns true if the user is still under `max_hits` within the window,
 * false (and doesn't count it) if they're over. Serialized per user + action so parallel
 * requests can't all slip under the limit.
 */
create or replace function public.hit_rate_limit(uid uuid, action_name text, max_hits int, window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || action_name, 2));
  if (
    select count(*) from public.rate_limit_hits
    where user_id = uid and action = action_name
      and created_at > now() - make_interval(secs => window_seconds)
  ) >= max_hits then
    return false;
  end if;
  insert into public.rate_limit_hits (user_id, action) values (uid, action_name);
  return true;
end;
$$;

revoke execute on function public.hit_rate_limit(uuid, text, int, int) from public, anon, authenticated;
