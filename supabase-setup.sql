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
  images      jsonb default '[]'::jsonb,   -- array of {"url":"...","isactive":true} objects
  isactive    boolean not null default true,
  created_at  timestamptz default now()
);

create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  name        text default '',
  role        text default '',
  bio         text default '',
  photo       text default '',             -- public image URL
  sort        int default 0,
  isactive    boolean not null default true,
  created_at  timestamptz default now()
);

create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  year        text default '',
  title       text default '',
  description text default '',
  sort        int default 0,
  isactive    boolean not null default true,
  created_at  timestamptz default now()
);

-- patches existing tables that predate the isactive (soft-delete) column.
-- "Delete" in the admin UI now sets isactive=false instead of removing the
-- row, so the record stays in the database but is never read back by the app.
alter table public.activities add column if not exists isactive boolean not null default true;
alter table public.members    add column if not exists isactive boolean not null default true;
alter table public.milestones add column if not exists isactive boolean not null default true;

-- migrates activities.images from an array of plain URL strings to an array
-- of {"url":..., "isactive":true} objects, so individual photos can be
-- soft-deleted the same way as a whole activity. Guarded so it only touches
-- rows that still have a plain-string element (safe to re-run).
update public.activities
set images = (
  select coalesce(jsonb_agg(
    case jsonb_typeof(elem)
      when 'string' then jsonb_build_object('url', elem, 'isactive', true)
      else elem
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(images) as elem
)
where images is not null
  and exists (select 1 from jsonb_array_elements(images) as e where jsonb_typeof(e) = 'string');

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
create policy "public read activities" on public.activities for select using (isactive = true);
create policy "public read members"    on public.members    for select using (isactive = true);
create policy "public read milestones" on public.milestones for select using (isactive = true);

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

-- ----------------------------------------------------------------
-- 5) SITE VISIT COUNTER
--   A single running total of page loads, shown to admins on the dashboard.
--   The public site calls increment_site_visit() (a security-definer
--   function) once per browser tab/session instead of writing to the table
--   directly, so the anon key can bump the counter without needing a write
--   policy on site_stats.
-- ----------------------------------------------------------------

create table if not exists public.site_stats (
  id      int primary key default 1,
  visits  bigint not null default 0,
  constraint site_stats_single_row check (id = 1)
);

insert into public.site_stats (id, visits) values (1, 0)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;

-- shown in the public footer (see ui-kit.js footer()), so anyone can read it.
drop policy if exists "auth read site_stats" on public.site_stats;
drop policy if exists "public read site_stats" on public.site_stats;
create policy "public read site_stats" on public.site_stats for select using (true);

create or replace function public.increment_site_visit()
returns void
language sql
security definer
set search_path = public
as $$
  update public.site_stats set visits = visits + 1 where id = 1;
$$;

grant execute on function public.increment_site_visit() to anon, authenticated;

-- ============================================================
--  DONE.
--  Next: create your admin login at
--  Dashboard → Authentication → Users → Add user
--  (set an email + password, and tick "Auto Confirm User").
-- ============================================================
