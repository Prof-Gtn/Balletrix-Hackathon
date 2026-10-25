-- 1. "Express Interest" was refused by RLS: the insert policy checked the entrepreneur's profile, but
--    profiles are private, so an investor's session could never see that row and the check always
--    failed. Now any investor may express interest, as themselves (investor_id must be their own id).
drop policy if exists "Investors express interest" on public.investor_interests;
create policy "Investors express interest" on public.investor_interests
  for insert to authenticated with check (
    auth.uid() = investor_id
    and status = 'pending'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'investor')
  );

-- 2. Two functions from the investor marketplace migration are missing from the database, which is
--    why the Investor Trust Pack on a startup's page fails ("We couldn't load this startup") and why
--    Matched Investors can't load. Recreated here; safe to run more than once.

-- One startup's profile and evidence summary for its Investor Trust Pack (null if not allowed).
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
       where s.id = p_startup and coalesce(s.current_month, 1) >= 3 and coalesce(s.role, 'entrepreneur') = 'entrepreneur'
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

-- Investors in a sector, for entrepreneurs who reached Month 3 (Assessment > Get Funded).
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

revoke execute on function public.startup_due_diligence(uuid) from public, anon;
grant execute on function public.startup_due_diligence(uuid) to authenticated;
revoke execute on function public.match_investors(text) from public, anon;
grant execute on function public.match_investors(text) to authenticated;

notify pgrst, 'reload schema';
