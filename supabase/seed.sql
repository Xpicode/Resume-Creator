-- LOCAL ONLY (runs on `supabase db reset`, never on staging/production). Fake data only (plan 3.3).

-- Test helper: makes a user look inactive for N days, for the anonymous-cleanup test.
create or replace function public.test_backdate_user(uid uuid, days int)
returns void
language sql
security definer
set search_path = ''
as $$
  update auth.users
  set created_at = now() - make_interval(days => days),
      last_sign_in_at = now() - make_interval(days => days)
  where id = uid;
$$;

revoke execute on function public.test_backdate_user(uuid, int) from public, anon, authenticated;
grant execute on function public.test_backdate_user(uuid, int) to service_role;
