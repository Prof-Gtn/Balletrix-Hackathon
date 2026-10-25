-- 1. Saving investor preferences upserts on user_id, which needs a unique constraint on that column.
--    Duplicate rows (if any) are removed first, keeping each investor's newest, or the constraint
--    can't be added. Safe to run more than once. Run in the Supabase SQL Editor.
delete from public.investor_preferences a
using public.investor_preferences b
where a.user_id = b.user_id
  and (a.created_at, a.id) < (b.created_at, b.id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.investor_preferences'::regclass
      and contype = 'u'
      and conkey = array[(select attnum from pg_attribute
                          where attrelid = 'public.investor_preferences'::regclass and attname = 'user_id')]
  ) then
    alter table public.investor_preferences
      add constraint investor_preferences_user_id_key unique (user_id);
  end if;
end $$;

-- 2. The investor feed lists only entrepreneurs at Month 3 (previously anyone who wasn't an investor,
--    which would have included admins).
create or replace function public.get_investment_ready_startups()
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
    and coalesce(p.role, 'entrepreneur') = 'entrepreneur'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'investor')
  order by p.readiness_score desc nulls last;
$$;

notify pgrst, 'reload schema';
