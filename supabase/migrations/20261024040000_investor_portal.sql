-- Investor Portal: lets investors see investment-ready startups and their due diligence data.
-- Run in the Supabase SQL Editor (or `supabase db push`) after 20261024030000_business_profile.sql
-- (these functions read profiles.sector).
--
-- profiles and evidence_submissions stay private under RLS. These functions run with the owner's
-- rights but return data only when the caller's own profile has role = 'investor', and only for
-- startups that have reached Month 3. File URLs are never returned.

create or replace function public.investment_ready_startups()
returns table (
  id uuid,
  business_name text,
  sector text,
  readiness_score numeric,
  current_month integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.business_name::text, p.sector::text, p.readiness_score::numeric, p.current_month::integer
  from public.profiles p
  where coalesce(p.current_month, 1) >= 3
    and coalesce(p.role, 'entrepreneur') <> 'investor'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'investor')
  order by p.readiness_score desc nulls last;
$$;

-- Profile and evidence summary for one startup's Investment Memorandum; null if the caller is not
-- an investor or the startup isn't investment-ready.
create or replace function public.startup_due_diligence(p_startup uuid)
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

revoke execute on function public.investment_ready_startups() from public, anon;
grant execute on function public.investment_ready_startups() to authenticated;
revoke execute on function public.startup_due_diligence(uuid) from public, anon;
grant execute on function public.startup_due_diligence(uuid) to authenticated;
