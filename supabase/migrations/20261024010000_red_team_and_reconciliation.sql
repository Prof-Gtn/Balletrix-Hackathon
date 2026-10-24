-- Red Team (Devil's Advocate) and Financial Reconciliation (Fraud Hunter) agents.
-- Run in the Supabase SQL Editor (or `supabase db push`) before using either agent: the app writes these columns.

-- Latest Devil's Advocate critique: { "fatal_flaws": [{ "flaw", "severity", "impact" }], "survival_probability" }.
alter table public.profiles add column if not exists red_team_flaws jsonb;

-- Bank statement reconciliation result. Null means not yet reconciled (e.g. the check could not run).
alter table public.evidence_submissions add column if not exists reconciliation_status text;

alter table public.evidence_submissions
  add constraint evidence_submissions_reconciliation_status_check
  check (reconciliation_status in ('reconciled', 'failed', 'not_applicable'));
