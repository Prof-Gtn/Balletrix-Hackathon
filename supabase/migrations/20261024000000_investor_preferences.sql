-- Investor Preference Engine: what each investor wants to fund.
-- Run in the Supabase SQL Editor (or `supabase db push`).

create table public.investor_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  preferred_sector text not null,
  max_investment_amount numeric not null check (max_investment_amount >= 0),
  preferred_instrument text not null check (preferred_instrument in ('debt', 'equity')),
  created_at timestamptz not null default now(),
  -- One set of preferences per investor; the app upserts on user_id.
  unique (user_id)
);

-- Row Level Security: investors can only see and edit their own preferences.
alter table public.investor_preferences enable row level security;

create policy "Investors read own preferences" on public.investor_preferences
  for select to authenticated using (auth.uid() = user_id);

create policy "Investors insert own preferences" on public.investor_preferences
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Investors update own preferences" on public.investor_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Investors delete own preferences" on public.investor_preferences
  for delete to authenticated using (auth.uid() = user_id);

-- Matching for entrepreneurs. RLS keeps the table private, so entrepreneurs read matches through
-- this function instead: it runs with the owner's rights but only returns investors in the given
-- sector, and only to a caller who has reached Month 3.
create or replace function public.match_investors(p_sector text)
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
  select ip.user_id, p.email, ip.preferred_sector, ip.max_investment_amount, ip.preferred_instrument
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

revoke execute on function public.match_investors(text) from public, anon;
grant execute on function public.match_investors(text) to authenticated;
