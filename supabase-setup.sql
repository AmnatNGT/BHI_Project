-- ============================================================
--  BHI — Border Health Initiative · Supabase setup
--  Run this in:  Supabase Dashboard → SQL Editor → New query → Run
--  When asked, choose "Run and enable RLS".
--  Safe to re-run (IF NOT EXISTS / guarded seeds / DROP POLICY IF EXISTS).
-- ============================================================

-- ----------------------------------------------------------------
-- 1) TABLES
-- ----------------------------------------------------------------

create table if not exists public.org (
  id          int primary key default 1,
  short       text,
  logo        text,                          -- public image URL
  name        text,
  name_full   text,
  about       text,
  story       text,
  place       text,
  email       text,
  stats       jsonb default '{}'::jsonb,
  updated_at  timestamptz default now(),
  constraint org_single_row check (id = 1)
);

-- patches an existing org table that predates the logo column
alter table public.org add column if not exists logo text;

-- renames columns on an existing org table to the new "name" / "name_full" naming
-- ("name_full" -> "name" first, then "tagline" -> "name_full", to avoid a collision)
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='org' and column_name='name_full')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='org' and column_name='name') then
    alter table public.org rename column name_full to name;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='org' and column_name='tagline')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='org' and column_name='name_full') then
    alter table public.org rename column tagline to name_full;
  end if;
end $$;

create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  date        date,
  images      jsonb default '[]'::jsonb,   -- array of public image URLs
  created_at  timestamptz default now()
);

create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  name        text default '',
  role        text default '',
  bio         text default '',
  photo       text default '',             -- public image URL
  sort        int default 0,
  created_at  timestamptz default now()
);

create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  year        text default '',
  title       text default '',
  description text default '',
  sort        int default 0,
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------
-- 2) SEED DATA  (each block runs only if that table is still empty)
-- ----------------------------------------------------------------

do $$
begin
  if not exists (select 1 from public.org where id = 1) then
    insert into public.org (id, short, name, name_full, about, story, place, email, stats) values (
      1,
      'BHI',
      'Border Health Initiative',
      'Health and dignity for every life along the border',
      'A volunteer-driven organization bringing basic healthcare, medicine and hope to underserved communities along the border.',
      E'BHI began in 2017 when a small group of volunteer doctors and nurses started making regular trips to remote villages along the Thai–Myanmar border. What started as occasional clinic visits has grown into year-round programs in primary care, nutrition, clean water and seasonal relief.\n\nWe believe healthcare is a right, not a privilege — and that no family should be left behind simply because of where they live.',
      'Thai–Myanmar border, Tak Province',
      'hello@bhi-foundation.org',
      '{"years":8,"people":12400,"villages":46}'::jsonb
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.activities) then
    insert into public.activities (title, description, date, images, created_at) values
      ('Mobile clinic at Huai Nam Khun',
       'Our volunteer team carried out basic health check-ups for over 180 villagers, distributed essential medicines and supplies, and offered nutrition guidance for young children and the elderly in the community.',
       date '2025-02-15', '[]'::jsonb, timestamptz '2025-02-15'),
      ('Blankets and winter kits before the cold season',
       'Delivered blankets, warm clothing and essential supplies to 12 highland villages to ease the cold for families in need as temperatures dropped.',
       date '2024-12-08', '[]'::jsonb, timestamptz '2024-12-08'),
      ('Clean water for border schools',
       'Installed clean drinking-water filtration systems at three schools, giving more than 400 students access to safe water and reducing waterborne illness.',
       date '2024-10-20', '[]'::jsonb, timestamptz '2024-10-20');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.members) then
    insert into public.members (name, role, bio, sort) values
      ('Dr. Somchai Phromma', 'Founder & Director', 'Family physician who started BHI after years of volunteer trips to border clinics.', 0),
      ('Naree Kittisak',      'Medical Lead',       'Registered nurse coordinating mobile health units and patient triage.',            1),
      ('Anan Wongchai',       'Field Coordinator',  'Plans logistics and works hand-in-hand with village leaders across Tak.',          2),
      ('Lin Maung',           'Community Liaison',  'Translator and trusted bridge to migrant communities along the border.',           3);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.milestones) then
    insert into public.milestones (year, title, description, sort) values
      ('2017', 'BHI is founded',           'A small group of volunteer doctors and nurses begins regular clinic visits to remote border villages.', 0),
      ('2019', 'First mobile health unit', 'Launched a fully equipped mobile unit, reaching more than 20 villages each year.',                       1),
      ('2021', 'Clean water program',      'Began installing water filtration systems in border schools.',                                          2),
      ('2024', '12,000+ people reached',   'Cumulative care milestone across health, nutrition and seasonal relief.',                               3);
  end if;
end $$;

-- ----------------------------------------------------------------
-- 3) ROW LEVEL SECURITY  (public can READ, only logged-in can WRITE)
-- ----------------------------------------------------------------

alter table public.org        enable row level security;
alter table public.activities enable row level security;
alter table public.members    enable row level security;
alter table public.milestones enable row level security;

drop policy if exists "public read org"        on public.org;
drop policy if exists "public read activities" on public.activities;
drop policy if exists "public read members"    on public.members;
drop policy if exists "public read milestones" on public.milestones;
create policy "public read org"        on public.org        for select using (true);
create policy "public read activities" on public.activities for select using (true);
create policy "public read members"    on public.members    for select using (true);
create policy "public read milestones" on public.milestones for select using (true);

drop policy if exists "auth write org"        on public.org;
drop policy if exists "auth write activities" on public.activities;
drop policy if exists "auth write members"    on public.members;
drop policy if exists "auth write milestones" on public.milestones;
create policy "auth write org"        on public.org        for all to authenticated using (true) with check (true);
create policy "auth write activities" on public.activities for all to authenticated using (true) with check (true);
create policy "auth write members"    on public.members    for all to authenticated using (true) with check (true);
create policy "auth write milestones" on public.milestones for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------
-- 4) STORAGE BUCKET for uploaded images  (public read URLs)
-- ----------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('activity-images', 'activity-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public read images"  on storage.objects;
drop policy if exists "auth upload images"  on storage.objects;
drop policy if exists "auth update images"  on storage.objects;
drop policy if exists "auth delete images"  on storage.objects;
create policy "public read images" on storage.objects
  for select using (bucket_id = 'activity-images');
create policy "auth upload images" on storage.objects
  for insert to authenticated with check (bucket_id = 'activity-images');
create policy "auth update images" on storage.objects
  for update to authenticated using (bucket_id = 'activity-images');
create policy "auth delete images" on storage.objects
  for delete to authenticated using (bucket_id = 'activity-images');

-- ============================================================
--  DONE.
--  Next: create your admin login at
--  Dashboard → Authentication → Users → Add user
--  (set an email + password, and tick "Auto Confirm User").
-- ============================================================
