-- ============================================================
--  BHI — Demo seed: a health-aid organization in Sangkhla Buri
--  District, Kanchanaburi Province, Thailand
--  Run this in: Supabase Dashboard → SQL Editor → New query → Run
--  Re-runnable: wipes org/activities/members/milestones and reseeds
--  fresh demo data each time you run it — run it before every demo session.
--  Requires supabase-setup.sql to have been run first (creates the tables
--  and the isactive column).
--
--  Each table's seed also includes one isactive=false row, so the demo can
--  show the soft-delete feature: those rows exist in the database (visible
--  in Table Editor) but never show on the admin dashboard or public site,
--  exactly as if an admin had deleted them through the UI.
-- ============================================================

truncate table public.activities;
truncate table public.members;
truncate table public.milestones;

insert into public.org (id, short, name, name_full, about, story, place, email, stats) values (
  1,
  'SBH',
  'Sangkhla Buri Border Health Foundation',
  'Healthy communities, every border, every life',
  'We bring healthcare to border communities in Sangkhla Buri District, Kanchanaburi Province, through mobile medical units, community health volunteers, and close partnership with local hospitals — so no one is left behind simply because of where they live.',
  E'The Sangkhla Buri Border Health Foundation was founded by a small group of volunteer doctors, nurses and field workers who saw the gap in healthcare access faced by communities along the Thai–Myanmar border in Sangkhla Buri District, Kanchanaburi Province.\n\nWhat began as a small mobile clinic serving Wang Ka village has grown into year-round programs covering child health checks, training for village health volunteers, and a permanent community clinic — all run in close partnership with Sangkhla Buri Hospital and local partners.',
  'Sangkhla Buri District, Kanchanaburi Province',
  'contact@sangkhlaburihealth.org',
  '{"years":11,"people":18600,"villages":24}'::jsonb
)
on conflict (id) do update set
  short=excluded.short, name=excluded.name, name_full=excluded.name_full, about=excluded.about,
  story=excluded.story, place=excluded.place, email=excluded.email, stats=excluded.stats,
  updated_at=now();

insert into public.activities (title, description, date, images, isactive, created_at) values
  ('Mobile clinic at Wang Ka village',
   'Our team ran health check-ups and distributed medicine to villagers in Wang Ka, with extra consultations for maternal and child health.',
   date '2026-05-18', '[]'::jsonb, true, timestamptz '2026-05-18'),
  ('Village health volunteer (VHV) training',
   'Trained community health volunteers in Nong Lu sub-district on basic public health skills, expanding our community care network.',
   date '2026-04-22', '[]'::jsonb, true, timestamptz '2026-04-22'),
  ('Child health screening at the border shelter',
   'Screened children aged 0-5 for growth and nutrition, and distributed vitamins and fortified milk.',
   date '2026-03-10', '[]'::jsonb, true, timestamptz '2026-03-10'),
  ('Malaria prevention campaign along the border',
   'Distributed insecticide-treated mosquito nets and ran malaria-prevention education for households in high-risk border areas.',
   date '2026-02-14', '[]'::jsonb, true, timestamptz '2026-02-14'),
  ('Flood relief along the Songkalia River',
   'Delivered essential medicine, supplies and clean water to households affected by flooding along the Songkalia River.',
   date '2026-01-05', '[]'::jsonb, true, timestamptz '2026-01-05'),
  ('Opening of the Sangkhla Buri community clinic',
   'Opened our first permanent community clinic, offering general care to low-income residents and ethnic communities in the area.',
   date '2025-11-20', '[]'::jsonb, true, timestamptz '2025-11-20'),
  ('[Demo] Duplicate clinic visit entry',
   'Test row created twice by mistake and removed by the admin — kept here with isactive=false to demonstrate the soft-delete feature: visible in Table Editor, hidden from the admin dashboard and the public site.',
   date '2025-10-01', '[]'::jsonb, false, timestamptz '2025-10-01');

insert into public.members (name, role, sort, isactive) values
  ('Dr. Somchai Jaidee',       'Foundation Director',          0, true),
  ('Wipha Chaidan, RN',        'Mobile Unit Nursing Lead',     1, true),
  ('Apisit Wangka',            'Field Coordinator',            2, true),
  ('Pimjai Suksan',            'Social Worker',                2, true),
  ('Jailu Khamsaeng',          'Community Health Volunteer',   3, true),
  ('[Demo] Niran Boonmee',     'Former Logistics Volunteer — removed by the admin, kept with isactive=false to demonstrate the soft-delete feature', 9, false);

insert into public.milestones (year, title, description, sort, isactive) values
  ('2015', 'Foundation established',          'A group of volunteer doctors and medical staff came together and ran the first mobile clinic in Wang Ka village.', 0, true),
  ('2018', 'Service area expanded',           'Expanded operations to cover Nong Lu sub-district and nearby border areas.', 1, true),
  ('2020', 'COVID-19 response',               'Set up screening points and distributed protective equipment to border communities.', 2, true),
  ('2023', 'First VHV training cohort',       'Built a network of over 40 village health volunteers across the area.', 3, true),
  ('2025', 'Permanent community clinic opens', 'Opened the first Sangkhla Buri community clinic, providing ongoing general care.', 4, true),
  ('2019', '[Demo] Draft milestone (never published)', 'Created by mistake during a training session and removed by the admin — kept with isactive=false to demonstrate the soft-delete feature.', 9, false);

-- ============================================================
--  DONE. Refresh the site — public pages now show the demo content.
--  Run this script again any time before a demo to reset the data.
-- ============================================================
