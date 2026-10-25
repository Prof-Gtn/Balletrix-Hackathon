-- DEMO DATA ONLY. Three fictional entrepreneurs at Month 3 so the Investor Portal has startups to show.
-- The businesses are invented; say so when you present. Each description starts with "Demo account."
-- The accounts have no password and can't be logged into. Safe to run more than once.
-- Run in the Supabase SQL Editor (it runs as postgres, so the score/month protection allows it).
--
-- profiles.id is the Supabase Auth user id, so a matching auth.users row is created first.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', 'd3a0c0de-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'demo.desertrose@mulastream.demo', '', now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Founder","role":"entrepreneur"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd3a0c0de-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'demo.kalahariloom@mulastream.demo', '', now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Founder","role":"entrepreneur"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd3a0c0de-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'demo.coastlineuniforms@mulastream.demo', '', now(), '{"provider":"email","providers":["email"]}',
   '{"full_name":"Demo Founder","role":"entrepreneur"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.profiles (id, email, role, business_name, sector, target_market, business_description, readiness_score, current_month)
values
  ('d3a0c0de-0000-4000-8000-000000000001', 'demo.desertrose@mulastream.demo', 'entrepreneur',
   'Desert Rose Jewellery', 'Crafts & Jewellery', 'Lodges, gift shops and tourists in Windhoek and Swakopmund',
   'Demo account. Handmade silver jewellery set with Namibian gemstones such as tourmaline and amethyst. Sells through '
   || '6 lodge gift shops on consignment and an online store, with about N$38,000 in monthly sales and repeat orders from lodges.',
   85, 3),
  ('d3a0c0de-0000-4000-8000-000000000002', 'demo.kalahariloom@mulastream.demo', 'entrepreneur',
   'Kalahari Loom Textiles', 'Textiles & Apparel', 'Interior designers, guesthouses and export buyers',
   'Demo account. A Keetmanshoop weaving workshop employing 9 local weavers to make karakul wool rugs and wall hangings. '
   || 'Sells to guesthouses and two South African interior design studios, averaging N$52,000 a month.',
   78, 3),
  ('d3a0c0de-0000-4000-8000-000000000003', 'demo.coastlineuniforms@mulastream.demo', 'entrepreneur',
   'Coastline Uniforms CC', 'Manufacturing', 'Schools and companies in the Erongo region',
   'Demo account. A Walvis Bay garment factory making school uniforms and company workwear on 14 machines. Holds supply '
   || 'agreements with 11 schools and 3 fishing companies, with around N$120,000 in monthly revenue.',
   92, 3)
on conflict (id) do update set
  role = excluded.role,
  business_name = excluded.business_name,
  sector = excluded.sector,
  target_market = excluded.target_market,
  business_description = excluded.business_description,
  readiness_score = excluded.readiness_score,
  current_month = excluded.current_month;

-- To remove the demo data later (profiles first, then the auth users):
-- delete from public.profiles where id in ('d3a0c0de-0000-4000-8000-000000000001',
--   'd3a0c0de-0000-4000-8000-000000000002', 'd3a0c0de-0000-4000-8000-000000000003');
-- delete from auth.users where id in ('d3a0c0de-0000-4000-8000-000000000001',
--   'd3a0c0de-0000-4000-8000-000000000002', 'd3a0c0de-0000-4000-8000-000000000003');
