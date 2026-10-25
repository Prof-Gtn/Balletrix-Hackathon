-- Multilingual AI, investor matchmaking and the Admin Command Center.
-- Safe to run more than once. Run in the Supabase SQL Editor (or `supabase db push`).

-- 1. Preferred language for AI output.
alter table public.profiles add column if not exists preferred_language text not null default 'English';

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles
  add constraint profiles_preferred_language_check
  check (preferred_language in ('English', 'Afrikaans', 'Oshiwambo'));

-- 2. Allow the 'admin' role. Drops whichever existing check constraint covers profiles.role (its name
-- depends on how the table was created), then adds one that includes admin.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('entrepreneur', 'investor', 'admin'));

-- True when the signed-in user is an admin. Security definer so RLS policies on profiles can call it
-- without recursing into themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Users must not be able to promote themselves. Only an admin (or the SQL Editor, where auth.uid() is
-- null) can set or change a role to 'admin', or change anyone's role after sign-up.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Only an admin can create admin accounts';
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    raise exception 'Only an admin can change a role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- 3. Investor interest in an entrepreneur ("Express Interest").
create table if not exists public.investor_interests (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  entrepreneur_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (investor_id, entrepreneur_id)
);

alter table public.investor_interests enable row level security;

-- Investors see the interests they sent; entrepreneurs see the interests they received.
drop policy if exists "Investors and entrepreneurs read their interests" on public.investor_interests;
create policy "Investors and entrepreneurs read their interests" on public.investor_interests
  for select to authenticated using (auth.uid() = investor_id or auth.uid() = entrepreneur_id);

-- Only investors can express interest, as themselves, in an investment-ready (Month 3) entrepreneur.
drop policy if exists "Investors express interest" on public.investor_interests;
create policy "Investors express interest" on public.investor_interests
  for insert to authenticated with check (
    auth.uid() = investor_id
    and status = 'pending'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'investor')
    and exists (
      select 1 from public.profiles s
      where s.id = entrepreneur_id and coalesce(s.current_month, 1) >= 3 and coalesce(s.role, 'entrepreneur') = 'entrepreneur'
    )
  );

-- Interested investors with their email, for the entrepreneur's dashboard (profiles RLS hides other
-- users' rows, so this reads them with the owner's rights, only for the caller's own interests).
drop function if exists public.get_interested_investors();
create function public.get_interested_investors()
returns table (id uuid, investor_id uuid, email text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.investor_id, p.email::text, i.status, i.created_at
  from public.investor_interests i
  join public.profiles p on p.id = i.investor_id
  where i.entrepreneur_id = auth.uid()
  order by i.created_at desc;
$$;

revoke execute on function public.get_interested_investors() from public, anon;
grant execute on function public.get_interested_investors() to authenticated;

-- 4. Admin audit log.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_id uuid,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

-- Admins can read the log. There is no insert policy: rows are only written by admin_verify_evidence().
drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs" on public.admin_audit_logs
  for select to authenticated using (public.is_admin());

-- 5. Admin read access for the Command Center (in addition to the users' own-row policies).
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins read all evidence" on public.evidence_submissions;
create policy "Admins read all evidence" on public.evidence_submissions
  for select to authenticated using (public.is_admin());

-- Human-in-the-loop override: marks a flagged document verified and logs it, in one transaction.
-- Returns false if the caller isn't an admin or the document isn't flagged.
drop function if exists public.admin_verify_evidence(uuid);
create function public.admin_verify_evidence(p_evidence uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return false;
  end if;

  update public.evidence_submissions
  set ai_verification_status = 'verified'
  where id = p_evidence and ai_verification_status = 'flagged';
  if not found then
    return false;
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_id)
  values (auth.uid(), 'override_verify_evidence', p_evidence);
  return true;
end;
$$;

revoke execute on function public.admin_verify_evidence(uuid) from public, anon;
grant execute on function public.admin_verify_evidence(uuid) to authenticated;

-- To make yourself an admin, run this once with your own email:
-- update public.profiles set role = 'admin' where email = 'you@example.com';

notify pgrst, 'reload schema';
