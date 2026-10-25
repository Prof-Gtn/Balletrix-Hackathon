-- Users must not be able to mark their own evidence as verified through the API: a verified document
-- earns the +15 evidence bonus and helps pass the gates. Only the server (service role key, after the
-- Fraud Hunter or the evidence check), the SQL Editor or an admin may write a verified row.
-- Safe to run more than once. Run in the Supabase SQL Editor.
--
-- BEFORE running this: SUPABASE_SERVICE_ROLE_KEY must be set in the app's environment, otherwise
-- verified uploads and passed assessments can't be saved.

-- Security invoker on purpose: current_user is then the caller's API role ('authenticated' or 'anon'
-- for normal users, 'service_role' for the server's key, 'postgres' in the SQL Editor and inside the
-- security-definer admin_verify_evidence() override).
create or replace function public.protect_evidence_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  -- Covers inserting a verified row, upgrading a flagged row, and editing a row that is already verified.
  if new.ai_verification_status = 'verified'
     or (tg_op = 'UPDATE' and old.ai_verification_status = 'verified') then
    raise exception 'Evidence verification must be done by the server or an admin'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_evidence_verification on public.evidence_submissions;
create trigger protect_evidence_verification
  before insert or update on public.evidence_submissions
  for each row execute function public.protect_evidence_verification();
