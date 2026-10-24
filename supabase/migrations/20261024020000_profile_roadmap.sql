-- Latest AI action plan, shown in Step 2 of the dashboard: [{ "action": "...", "why": "..." }].
-- Run in the Supabase SQL Editor (or `supabase db push`). Until it runs, assessments still save the
-- score and month; only the saved action plan is skipped.
alter table public.profiles add column if not exists roadmap jsonb;
