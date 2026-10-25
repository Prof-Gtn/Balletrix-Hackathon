-- Users must not be able to set their own readiness_score or current_month through the API: those
-- decide the gates and what investors see. Only the server (service role key), the SQL Editor or an
-- admin may change them. Safe to run more than once. Run in the Supabase SQL Editor.
--
-- BEFORE running this: add SUPABASE_SERVICE_ROLE_KEY to the app's environment (.env.local and the
-- host), otherwise saving an assessment's score will be refused.

-- Security invoker on purpose: current_user is then the caller's API role ('authenticated' or 'anon'
-- for normal users, 'service_role' for the server's key, 'postgres' in the SQL Editor).
create or replace function public.protect_profile_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.readiness_score, 0) <> 0 or coalesce(new.current_month, 1) <> 1 then
      raise exception 'A new profile starts with a readiness score of 0 in Month 1'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.readiness_score is distinct from old.readiness_score
     or new.current_month is distinct from old.current_month then
    raise exception 'readiness_score and current_month can only be changed by MulaStream'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_progress on public.profiles;
create trigger protect_profile_progress
  before insert or update on public.profiles
  for each row execute function public.protect_profile_progress();
