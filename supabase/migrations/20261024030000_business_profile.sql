-- Business profile fields collected in onboarding and editable on the Business Profile page.
-- Run in the Supabase SQL Editor (or `supabase db push`). business_name already exists.
alter table public.profiles add column if not exists sector text;
alter table public.profiles add column if not exists target_market text;
alter table public.profiles add column if not exists business_description text;
