-- The AI's personalised 12-week plan, saved with each assessment:
-- [{ "week": 1, "focus": "...", "task": "..." }, ...]. Shown as the journey map on the Gamification page.
-- Safe to run more than once. Run in the Supabase SQL Editor (or `supabase db push`).
alter table public.profiles add column if not exists twelve_week_plan jsonb;
