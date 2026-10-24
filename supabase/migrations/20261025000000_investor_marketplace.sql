-- Investor marketplace: everything the Investor Portal needs, in one file.
-- Safe to run more than once (every statement is idempotent). Replaces the earlier
-- investor_preferences and investor_portal migrations.
-- Run in the Supabase SQL Editor (or `supabase db push`).

-- Columns the portal and dashboard read (no-ops if they already exist).
alter table public.profiles add column if not exists sector text;
alter table public.profiles add column if not exists target_market text;
alter table public.profiles add column if not exists business_description text;
alter table public.profiles add column if not exists roadmap jsonb;

-- 1. What each investor wants to fund. One row per investor; the app upserts on user_id.
create table if not exists public.investor_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references public.profiles (id) on delete cascade,
  preferred_sector text not null,
  max_investment_amount numeric not null check (max_investment_amount >= 0),
  preferred_instrument text not null check (preferred_instrument in ('debt', 'equity')),
  created_at timestamptz not null default now()
);

-- Row Level Security: investors can only see and edit their own preferences.
alter table public.investor_preferences enable row level security;

drop policy if exists "Investors read own preferences" on public.investor_preferences;
create policy "Investors read own preferences" on public.investor_preferences
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Investors insert own preferences" on public.investor_preferences;
create policy "Investors insert own preferences" on public.investor_preferences
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Investors update own preferences" on public.investor_preferences;
create policy "Investors update own preferences" on public.investor_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Investors delete own preferences" on public.investor_preferences;
create policy "Investors delete own preferences" on public.investor_preferences
  for delete to authenticated using (auth.uid() = user_id);

-- profiles and evidence_submissions stay private under RLS. The functions below run with the owner's
-- rights but only return data to callers whose own profile has role = 'investor' (or, for
-- match_investors, to entrepreneurs who reached Month 3). File URLs are never returned.

-- 2. Entrepreneurs who reached Month 3 (investment-ready), for the investor feed.
drop function if exists public.investment_ready_startups();
drop function if exists public.get_investment_ready_startups();
create function public.get_investment_ready_startups()
returns table (
  id uuid,
  business_name text,
  sector text,
  target_market text,
  business_description text,
  readiness_score numeric,
  current_month integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.business_name::text,
    p.sector::text,
    p.target_market::text,
    p.business_description::text,
    p.readiness_score::numeric,
    p.current_month::integer
  from public.profiles p
  where coalesce(p.current_month, 1) >= 3
    and coalesce(p.role, 'entrepreneur') <> 'investor'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'investor')
  order by p.readiness_score desc nulls last;
$$;

-- 3. One startup's profile and evidence summary for its Investment Memorandum (null if not allowed).
drop function if exists public.startup_due_diligence(uuid);
create function public.startup_due_diligence(p_startup uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'investor')
     and exists (
       select 1 from public.profiles s
       where s.id = p_startup and coalesce(s.current_month, 1) >= 3 and coalesce(s.role, 'entrepreneur') <> 'investor'
     )
    then jsonb_build_object(
      'profile', (
        select jsonb_build_object(
          'business_name', s.business_name,
          'sector', s.sector,
          'readiness_score', s.readiness_score,
          'current_month', s.current_month
        )
        from public.profiles s where s.id = p_startup
      ),
      'evidence', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'evidence_type', e.evidence_type,
            -- Only the last path segment (the file name), never the full storage URL.
            'file_name', regexp_replace(coalesce(e.file_url, ''), '^.*/', ''),
            'month', e.month,
            'ai_verification_status', e.ai_verification_status,
            'ai_feedback', e.ai_feedback,
            'created_at', e.created_at
          )
          order by e.created_at
        )
        from public.evidence_submissions e
        where e.user_id = p_startup
      ), '[]'::jsonb)
    )
  end;
$$;

-- 4. Investors in a sector, for entrepreneurs who reached Month 3 (Assessment > Get Funded).
drop function if exists public.match_investors(text);
create function public.match_investors(p_sector text)
returns table (
  investor_id uuid,
  email text,
  preferred_sector text,
  max_investment_amount numeric,
  preferred_instrument text
)
language sql
stable
security definer
set search_path = ''
as $$
  select ip.user_id, p.email::text, ip.preferred_sector, ip.max_investment_amount, ip.preferred_instrument
  from public.investor_preferences ip
  join public.profiles p on p.id = ip.user_id
  where ip.preferred_sector = p_sector
    and ip.max_investment_amount > 0
    and ip.user_id <> auth.uid()
    and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and coalesce(me.current_month, 1) >= 3
    )
  order by ip.max_investment_amount desc;
$$;

revoke execute on function public.get_investment_ready_startups() from public, anon;
grant execute on function public.get_investment_ready_startups() to authenticated;
revoke execute on function public.startup_due_diligence(uuid) from public, anon;
grant execute on function public.startup_due_diligence(uuid) to authenticated;
revoke execute on function public.match_investors(text) from public, anon;
grant execute on function public.match_investors(text) to authenticated;

-- Make the new functions visible to the API straight away.
notify pgrst, 'reload schema';
