# Technical Specification
# เอกสารข้อกำหนดทางเทคนิค

| | |
|---|---|
| **Project / โครงการ** | BHI — Border Health Initiative Website |
| **Version / เวอร์ชัน** | 1.0 |
| **Date / วันที่** | 2026-06-19 |

> **English** first, then **Thai (ภาษาไทย)** below.
> ส่วนภาษาอังกฤษอยู่ด้านบน ส่วนภาษาไทยอยู่ด้านล่าง เนื้อหาตรงกัน

---

# PART 1 — ENGLISH

## 1. Architecture Overview

This is a **static front-end** (HTML/CSS/vanilla JavaScript) talking directly to **Supabase**, a Backend-as-a-Service. There is no custom backend server, no build step, and no bundler.

```
Browser
  └─ loads index.html
       └─ loads css/style.css
       └─ loads Supabase JS SDK (CDN)
       └─ loads js/*.js in a fixed order (see §4)
            └─ talks to Supabase over HTTPS using the public "anon" key
                 ├─ Postgres database (org, activities, members, milestones, site_stats)
                 ├─ Auth (admin email/password login)
                 └─ Storage (activity-images bucket)
```

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | HTML5, CSS3 (custom properties, Grid/Flexbox), Vanilla JavaScript (ES6+) — no framework, no TypeScript, no bundler |
| Backend | Supabase — PostgreSQL database, Supabase Auth, Supabase Storage |
| SDK | `@supabase/supabase-js`, loaded via CDN `<script>` tag in `index.html` |
| Fonts | Google Fonts — Fraunces (display), Sarabun (body), IBM Plex Sans Thai (UI/Thai fallback) |
| CI/CD | GitHub Actions — one workflow, keep-alive ping only (no build/test pipeline) |
| Hosting | Any static host (Vercel, Netlify, GitHub Pages) or opened directly as a local file |

## 3. Repository Layout

```
BHI Project/
├── index.html                      entry point — loads css/js, mounts app into #app
├── css/
│   └── style.css                   global styles, CSS variables, animations, responsive rules
├── js/
│   ├── config.js                   Supabase connection + ALL UI text strings (T object)
│   ├── state.js                    global `state` object + DB row <-> view-model mapping + loadData()
│   ├── helpers.js                  formatting/escaping, image resize + upload, soft-delete helpers
│   ├── ui-kit.js                   shared UI fragments: nav, footer, activity card, buttons
│   ├── views-public.js             public pages: home, activities, our story, our team
│   ├── views-admin.js              login screen + admin dashboard panels
│   ├── modals.js                   activity/member/milestone/detail modals + setup/loading/error screens
│   ├── actions.js                  the `App` controller object — every click/input handler
│   └── app.js                      render() + boot() + idle-logout timer — loaded last
├── supabase-setup.sql              run once in Supabase SQL editor: tables, RLS policies, storage bucket, RPC
├── supabase-seed-demo.sql          optional demo data for a second/test organization
├── .github/workflows/keep-alive.yml  scheduled ping so the free Supabase project doesn't auto-pause
└── README.md
```

## 4. Script Load Order & Responsibilities

Scripts are plain (non-module) `<script>` tags, so **order matters** — each file assumes the previous ones already ran:

1. **config.js** — defines `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BUCKET`, `IDLE_LIMIT_MS`, `GRADS`, `T` (text strings), creates the `sb` Supabase client.
2. **state.js** — defines the global `state` object, `emptyOrg()`, DB-row ⇄ view-model mappers (`orgFromRow`/`orgToRow`/`activityFromRow`/`milestoneFromRow`), and `loadData()`.
3. **helpers.js** — generic utilities: HTML-escaping, date formatting, client-side image resize, Supabase Storage upload, soft-delete helpers.
4. **ui-kit.js** — reusable HTML-template functions used by multiple pages (nav bar, footer, activity card, buttons, brand mark).
5. **views-public.js** — template functions for the 4 public pages (home, activities, our story, our team).
6. **views-admin.js** — template functions for the login screen and the 4 admin dashboard tabs.
7. **modals.js** — template functions for every modal/dialog (activity form, member form, milestone form, activity detail/gallery, setup/loading/error screens).
8. **actions.js** — the `App` object: one method per user action (login, logout, save/edit/delete for each entity, image add/remove, tab switching, etc.). Every method mutates `state` then calls `render()`.
9. **app.js** — `render()` (rebuilds `#app` from `state`) and `boot()` (calls `loadData()`, sets up idle-logout listeners, calls `render()` for the first time). Loaded last because it kicks everything off.

## 5. Application Pattern

- **One global mutable `state` object** (`js/state.js`) holds *all* UI state (current view, open modals, form drafts, login status) *and* all loaded data (org, activities, members, milestones, visit count).
- **`render()`** (`js/app.js`) is the only place that writes to the DOM. It rebuilds the entire `#app` element's `innerHTML` from template-literal functions, reading only from `state`. There is no virtual DOM and no fine-grained diffing — it's a full re-render every time.
- **Every user interaction** (click, input, submit) calls a method on the `App` object (`js/actions.js`). Each method follows the same loop:
  1. Mutate `state` (and/or call Supabase to read/write data).
  2. Call `render()`.
- This is a deliberately minimal "data down, re-render on every change" pattern — there is no React/Vue/etc., so there's nothing to install or compile.

## 6. Data Model (Database Schema)

All tables live in the `public` schema of a Postgres database provisioned by Supabase. Schema source of truth: `supabase-setup.sql`.

**`org`** — single row, `id` fixed to `1`
| Column | Type | Notes |
|---|---|---|
| id | int, PK | always `1` (`check (id = 1)`) |
| short | text | monogram, e.g. "BHI" |
| logo | text | public image URL |
| name | text | **maps to view field `nameFull.en`** — brand name shown in header/footer |
| name_full | text | **maps to view field `fullName.en`** — full name, shown as homepage hero heading |
| about | text | about text on the homepage |
| story | text | organization story, shown on Our Story page |
| place | text | working area / location |
| email | text | contact email |
| stats | jsonb | shape: `{"years": int, "people": int, "villages": int}` |
| updated_at | timestamptz | |

> ⚠️ **Naming gotcha:** DB column `name` holds the brand name (view: `nameFull.en`), and DB column `name_full` holds the full/hero name (view: `fullName.en`) — the names are swapped between DB and view model. This is legacy and intentionally left as-is (documented in `js/state.js`) rather than risk a migration. Don't "fix" this without updating both the mapping functions and the SQL.

**`activities`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | `gen_random_uuid()` |
| title | text, not null | |
| description | text | maps to view field `desc` |
| date | date | |
| images | jsonb | array of `{"url": string, "isactive": boolean}` — per-image soft delete; max 30 enforced client-side |
| isactive | boolean | soft-delete flag for the whole activity |
| created_at | timestamptz | |

**`members`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| role | text | |
| photo | text | public image URL |
| sort | int | display order, ascending |
| isactive | boolean | soft-delete flag |
| created_at | timestamptz | secondary sort key |

**`milestones`**
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| year | text | e.g. `"2017"` — text, not a date type |
| title | text | |
| description | text | maps to view field `desc` |
| sort | int | not currently used for ordering — see note below |
| isactive | boolean | soft-delete flag |

> Note: `loadData()` fetches milestones ordered by `created_at`, then **re-sorts in JavaScript by parsed `year`** so the timeline always reads oldest → newest regardless of insertion order.

**`site_stats`** — single row, `id` fixed to `1`
| Column | Type | Notes |
|---|---|---|
| id | int, PK | always `1` |
| visits | bigint | incremented only via the `increment_site_visit()` RPC, never written directly |

## 7. Security Model

- **Row-Level Security (RLS) is enabled on every table.**
- **Public (`anon`) role:** `SELECT` only.
  - `org`: can read the single row unconditionally.
  - `activities` / `members` / `milestones`: can read only rows where `isactive = true`.
  - `site_stats`: can read unconditionally (needed to show the visit counter).
- **Authenticated role:** full `INSERT`/`UPDATE`/`DELETE` on `org`, `activities`, `members`, `milestones` — policies are `for all ... using (true) with check (true)`, i.e. **no row-level restriction once logged in**. Any authenticated user can edit anything.
- **Storage bucket `activity-images`:** public bucket; `SELECT` open to everyone; `INSERT`/`UPDATE`/`DELETE` restricted to authenticated users.
- **Site visit counter** is incremented through a `SECURITY DEFINER` SQL function, `public.increment_site_visit()`, granted to both `anon` and `authenticated`. This lets the public key bump the counter by exactly 1 per call without needing a write policy on `site_stats` directly — it can't be abused to set the counter to an arbitrary number.
- The Supabase **anon key is intentionally committed in `js/config.js`** and visible in the browser. This is safe by Supabase's design: the anon key only ever grants what RLS policies allow, so the key being public is not itself a vulnerability. Real protection comes from the RLS policies above, not from secrecy.

## 8. Authentication & Session Handling

- Auth method: **Supabase Auth**, email + password.
- There is no sign-up flow in the website — the admin account is created manually via **Supabase Dashboard → Authentication → Users** (with "Auto Confirm User" checked).
- Session persistence is handled by `supabase-js` itself (stored in the browser's `localStorage`), so a logged-in admin stays logged in across page reloads until they log out or the session expires.
- **Idle auto-logout:** `IDLE_LIMIT_MS` in `js/config.js` is `30 * 60 * 1000` (30 minutes). `js/app.js` attaches listeners for mouse movement, keyboard input, scroll, and tab-visibility changes to reset an "last activity" timestamp, and checks every 30 seconds whether that timestamp is older than the limit. If so, it calls `App.logout()` and the next render shows the `session_timeout` message from `T`.

## 9. Image Handling

- Images are selected client-side via a file input; nothing is uploaded at selection time.
- On **Save**, `js/helpers.js`'s `resize()` draws the image to an off-screen `<canvas>`, scales it down so the longest edge is at most **1280px**, and re-encodes it as JPEG at **82% quality** before uploading — this keeps page weight low regardless of the original photo size.
- Resized images are uploaded to the `activity-images` Supabase Storage bucket; the returned public URL is stored in the `activities.images` JSONB array as `{ "url": ..., "isactive": true }`.
- Per-image soft delete: removing a single photo from an activity sets that image's `isactive` to `false` inside the JSONB array rather than removing the array element, mirroring the row-level soft-delete pattern.
- Hard limit: 30 images per activity, enforced in the UI (`f_full` message: "Reached the 30-image limit").

## 10. Configuration

All configuration lives in **`js/config.js`** — there is no `.env` file and no build-time environment variable substitution, because the site has no build step.

| Constant | Purpose |
|---|---|
| `SUPABASE_URL` | Project's REST endpoint |
| `SUPABASE_ANON_KEY` | Public anon key (see §7 for why this is safe to commit) |
| `BUCKET` | Storage bucket name, `'activity-images'` |
| `IDLE_LIMIT_MS` | Idle-logout threshold |
| `GRADS` | Array of fallback CSS gradients, cycled by list position, used when an activity/member has no photo |
| `T` | Every piece of UI copy the site shows, keyed by name — retranslating means editing values here, not view code |
| `CONFIGURED` | `true` once a real key replaces the `'PASTE_YOUR...'` placeholder; while `false`, `render()` shows a "setup needed" screen instead of the site |

## 11. CI/CD

- **`.github/workflows/keep-alive.yml`** is the only pipeline in the repo.
- It runs on a schedule (Sundays and Wednesdays at 03:00) and sends a single HTTP GET to the Supabase REST API.
- Its only purpose is to stop the **free-tier Supabase project from auto-pausing** after 7 days without any API traffic — it does not build, test, or deploy anything.
- There is no automated test suite and no automated deployment step anywhere in the repo.

## 12. Deployment

1. Create a Supabase project.
2. Run the entire contents of `supabase-setup.sql` in the Supabase SQL Editor ("Run and enable RLS").
3. Create the admin user under **Authentication → Users** (tick "Auto Confirm User").
4. Copy the project's anon public key (**Project Settings → API**) into `SUPABASE_ANON_KEY` in `js/config.js`.
5. Either:
   - Open `index.html` directly in a browser (works over `file://`), or
   - Push the repository to any static host (Vercel, Netlify, GitHub Pages, Firebase Hosting) — no build command needed, no build output directory other than the repo root.

## 13. Known Technical Notes / Gotchas

- **Inverted column naming**: `org.name` ⇄ view `nameFull.en`, `org.name_full` ⇄ view `fullName.en` (see §6). Intentional legacy mapping — change both sides together if ever "fixed."
- **No automated tests** — verification is manual, in a real browser, against a live Supabase project.
- **No TypeScript / static typing** — correctness relies on consistent naming and the comments already in the code.
- **No per-table or per-field admin permissions** — every authenticated user has full write access to every table; there is no concept of a partial-access role at the database level.
- **Soft-deleted rows have no UI path back** — restoring requires manually flipping `isactive` back to `true` (or the per-image flag) directly in Supabase.
- Demo/test data lives separately in `supabase-seed-demo.sql` and is not run by default.

---

# PART 2 — ภาษาไทย

## 1. ภาพรวมของระบบ (Architecture)

ระบบนี้เป็น **เว็บไซต์แบบ static** (HTML/CSS/JavaScript ธรรมดา) ที่คุยตรงกับ **Supabase** ซึ่งเป็นบริการ Backend-as-a-Service (ฐานข้อมูล + ระบบล็อกอิน + ที่เก็บไฟล์ ในที่เดียว) ไม่มีเซิร์ฟเวอร์ฝั่งหลังบ้านที่เขียนเอง ไม่มีขั้นตอน build และไม่มี bundler

```
เบราว์เซอร์
  └─ โหลด index.html
       └─ โหลด css/style.css
       └─ โหลด Supabase JS SDK (จาก CDN)
       └─ โหลดไฟล์ js/*.js ตามลำดับที่กำหนดไว้ (ดูหัวข้อ 4)
            └─ คุยกับ Supabase ผ่าน HTTPS โดยใช้กุญแจสาธารณะ (anon key)
                 ├─ ฐานข้อมูล Postgres (org, activities, members, milestones, site_stats)
                 ├─ ระบบล็อกอิน (Auth) สำหรับแอดมิน
                 └─ ที่เก็บไฟล์รูปภาพ (bucket: activity-images)
```

## 2. เทคโนโลยีที่ใช้

| ส่วน | ใช้อะไร |
|---|---|
| หน้าเว็บ (Frontend) | HTML5, CSS3 (custom properties, Grid/Flexbox), JavaScript ธรรมดา (ไม่มี framework, ไม่มี TypeScript, ไม่มี bundler) |
| หลังบ้าน (Backend) | Supabase — ฐานข้อมูล PostgreSQL, ระบบล็อกอิน, ที่เก็บไฟล์ |
| SDK | `@supabase/supabase-js` โหลดผ่าน CDN ใน `index.html` |
| ฟอนต์ | Google Fonts — Fraunces, Sarabun, IBM Plex Sans Thai |
| CI/CD | GitHub Actions — มีแค่ workflow เดียว สำหรับ ping ไม่ให้ฐานข้อมูลหลับ (ไม่มี build/test) |
| โฮสติ้ง | โฮสต์แบบ static ที่ไหนก็ได้ (Vercel, Netlify, GitHub Pages) หรือเปิดไฟล์ index.html ตรงๆ ก็ได้ |

## 3. โครงสร้างโฟลเดอร์ในโปรเจกต์

```
BHI Project/
├── index.html                      จุดเริ่มต้น โหลด css/js แล้วแสดงผลที่ #app
├── css/
│   └── style.css                   สไตล์หลักของเว็บไซต์ทั้งหมด
├── js/
│   ├── config.js                   ข้อมูลเชื่อมต่อ Supabase + ข้อความทั้งหมดบนเว็บ (ตัวแปร T)
│   ├── state.js                    ตัวแปร state ของทั้งแอป + ฟังก์ชันแปลงข้อมูลจากฐานข้อมูล + loadData()
│   ├── helpers.js                  ฟังก์ชันช่วย เช่น จัดรูปแบบข้อความ ปรับขนาดรูป อัปโหลดรูป
│   ├── ui-kit.js                   ส่วนของหน้าเว็บที่ใช้ซ้ำ เช่น เมนู ส่วนล่างเว็บ การ์ดกิจกรรม ปุ่ม
│   ├── views-public.js             หน้าสำหรับคนทั่วไป: home, activities, our story, our team
│   ├── views-admin.js              หน้าล็อกอิน + แดชบอร์ดแอดมิน
│   ├── modals.js                   หน้าต่างป๊อปอัปทั้งหมด (ฟอร์มกิจกรรม/สมาชิก/เหตุการณ์/รายละเอียด/ตั้งค่า)
│   ├── actions.js                  ฟังก์ชันจัดการทุกการคลิก/กรอกข้อมูลของผู้ใช้
│   └── app.js                      ฟังก์ชัน render() + boot() + ตัวจับเวลา auto-logout (โหลดเป็นไฟล์สุดท้าย)
├── supabase-setup.sql              สคริปต์รันครั้งเดียวใน Supabase: สร้างตาราง สิทธิ์ และที่เก็บไฟล์
├── supabase-seed-demo.sql          ข้อมูลตัวอย่างสำหรับองค์กรทดสอบ (ไม่จำเป็นต้องรัน)
├── .github/workflows/keep-alive.yml  ตัว ping อัตโนมัติไม่ให้ฐานข้อมูลฟรีหลับ
└── README.md
```

## 4. ลำดับการโหลดไฟล์ JavaScript

ไฟล์ JS เป็น `<script>` ธรรมดา (ไม่ใช่ module) ดังนั้น **ลำดับการโหลดมีความสำคัญมาก** เพราะแต่ละไฟล์อ้างอิงสิ่งที่ไฟล์ก่อนหน้าสร้างไว้แล้ว:

1. **config.js** — กำหนดค่า `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `BUCKET`, `IDLE_LIMIT_MS`, `GRADS`, `T` (ข้อความบนเว็บ) และสร้างตัวแปรเชื่อมต่อ `sb`
2. **state.js** — กำหนดตัวแปร `state` กลาง, ฟังก์ชัน `emptyOrg()`, ฟังก์ชันแปลงข้อมูลระหว่างฐานข้อมูลกับหน้าเว็บ และ `loadData()`
3. **helpers.js** — ฟังก์ชันช่วยทั่วไป เช่น escape ข้อความ จัดรูปแบบวันที่ ปรับขนาดรูปฝั่งเบราว์เซอร์ อัปโหลดไฟล์
4. **ui-kit.js** — ฟังก์ชันสร้าง HTML ที่ใช้ร่วมกันหลายหน้า (เมนู ส่วนล่างเว็บ การ์ดกิจกรรม ปุ่ม)
5. **views-public.js** — ฟังก์ชันสร้างหน้าเว็บสำหรับคนทั่วไปทั้ง 4 หน้า
6. **views-admin.js** — ฟังก์ชันสร้างหน้าล็อกอินและแดชบอร์ดแอดมินทั้ง 4 แท็บ
7. **modals.js** — ฟังก์ชันสร้างหน้าต่างป๊อปอัปทั้งหมด
8. **actions.js** — ออบเจ็กต์ `App` ที่รวมฟังก์ชันจัดการทุกการคลิก/กรอกข้อมูล (ล็อกอิน ล็อกเอาท์ บันทึก/แก้ไข/ลบของแต่ละประเภทข้อมูล ฯลฯ) ทุกฟังก์ชันจะแก้ไข `state` แล้วเรียก `render()`
9. **app.js** — มีฟังก์ชัน `render()` (สร้างหน้าเว็บใหม่จาก `state`) และ `boot()` (เรียก `loadData()`, ตั้งตัวจับเวลา auto-logout, แสดงผลครั้งแรก) ไฟล์นี้โหลดเป็นไฟล์สุดท้ายเพราะเป็นตัวเริ่มทุกอย่าง

## 5. รูปแบบการทำงานของแอป

- มีตัวแปร **`state` กลางตัวเดียว** (ใน `js/state.js`) ที่เก็บทั้งสถานะหน้าจอ (อยู่หน้าไหน ป๊อปอัปไหนเปิดอยู่ กรอกฟอร์มอะไรไว้ สถานะล็อกอิน) และข้อมูลที่โหลดมาทั้งหมด (org, activities, members, milestones, จำนวนคนเข้าชม)
- **`render()`** (ใน `js/app.js`) เป็นจุดเดียวที่เขียนผลลงหน้าจอจริง โดยจะสร้าง HTML ใหม่ทั้งหมดของ `#app` จากค่าใน `state` ทุกครั้ง ไม่มีการเทียบความแตกต่าง (diffing) แบบ React — เป็นการ "สร้างใหม่ทั้งหมด" ทุกครั้งที่มีการเปลี่ยนแปลง
- **ทุกการคลิกหรือกรอกข้อมูลของผู้ใช้** จะเรียกฟังก์ชันใน `App` (`js/actions.js`) ซึ่งทำงาน 2 ขั้นตอนเสมอ:
  1. แก้ไข `state` (และ/หรือเรียก Supabase เพื่ออ่าน/บันทึกข้อมูล)
  2. เรียก `render()` ใหม่
- เป็นรูปแบบที่เรียบง่ายตั้งใจ ไม่มี React/Vue หรือ framework ใดๆ จึงไม่ต้องติดตั้งหรือ compile อะไรเพิ่ม

## 6. โครงสร้างฐานข้อมูล

ตารางทั้งหมดอยู่ใน schema `public` ของฐานข้อมูล Postgres ที่ Supabase จัดให้ ไฟล์ต้นทางคือ `supabase-setup.sql`

**`org`** — มีแถวเดียว `id` คงที่เป็น `1`
| คอลัมน์ | ประเภท | หมายเหตุ |
|---|---|---|
| id | int, PK | คงที่ `1` เสมอ |
| short | text | ชื่อย่อ เช่น "BHI" |
| logo | text | URL รูปโลโก้ |
| name | text | **เทียบกับฟิลด์หน้าเว็บ `nameFull.en`** คือชื่อแบรนด์ที่โชว์ในเมนูและส่วนล่างเว็บ |
| name_full | text | **เทียบกับฟิลด์หน้าเว็บ `fullName.en`** คือชื่อเต็มที่โชว์เป็นหัวข้อใหญ่หน้าแรก |
| about | text | ข้อความ "เกี่ยวกับเรา" หน้าแรก |
| story | text | เรื่องราวขององค์กร หน้า Our Story |
| place | text | พื้นที่ทำงาน |
| email | text | อีเมลติดต่อ |
| stats | jsonb | รูปแบบ `{"years": ตัวเลข, "people": ตัวเลข, "villages": ตัวเลข}` |
| updated_at | timestamptz | |

> ⚠️ **จุดที่ต้องระวัง:** คอลัมน์ `name` ในฐานข้อมูล เก็บ "ชื่อแบรนด์" (ตรงกับฟิลด์หน้าเว็บ `nameFull.en`) ส่วนคอลัมน์ `name_full` เก็บ "ชื่อเต็ม" (ตรงกับฟิลด์หน้าเว็บ `fullName.en`) — ชื่อมันสลับกันระหว่างฐานข้อมูลกับโค้ดหน้าเว็บ ซึ่งเป็นการตั้งใจเก็บไว้แบบนี้ (มีคอมเมนต์อธิบายไว้ใน `js/state.js`) เพื่อไม่ต้องเสี่ยงทำ migration ฐานข้อมูล ถ้าจะแก้ต้องแก้ทั้งฟังก์ชันแปลงข้อมูลและ SQL พร้อมกัน

**`activities`** (กิจกรรม)
| คอลัมน์ | ประเภท | หมายเหตุ |
|---|---|---|
| id | uuid, PK | |
| title | text, ห้ามเว้นว่าง | |
| description | text | เทียบกับฟิลด์หน้าเว็บ `desc` |
| date | date | |
| images | jsonb | array ของ `{"url": ..., "isactive": true/false}` — ลบรูปทีละรูปได้โดยไม่ลบจริง / จำกัดไม่เกิน 30 รูป (เช็คที่หน้าเว็บ) |
| isactive | boolean | flag ลบแบบไม่ถาวรของกิจกรรมทั้งรายการ |
| created_at | timestamptz | |

**`members`** (ทีมงาน)
| คอลัมน์ | ประเภท | หมายเหตุ |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| role | text | |
| photo | text | URL รูป |
| sort | int | ลำดับการแสดง เรียงจากน้อยไปมาก |
| isactive | boolean | flag ลบแบบไม่ถาวร |
| created_at | timestamptz | ใช้เรียงลำดับรอง |

**`milestones`** (เหตุการณ์สำคัญ)
| คอลัมน์ | ประเภท | หมายเหตุ |
|---|---|---|
| id | uuid, PK | |
| year | text | เช่น `"2017"` — เป็นข้อความ ไม่ใช่ชนิดวันที่ |
| title | text | |
| description | text | เทียบกับฟิลด์หน้าเว็บ `desc` |
| sort | int | ปัจจุบันไม่ได้ใช้จัดลำดับจริง (ดูหมายเหตุด้านล่าง) |
| isactive | boolean | flag ลบแบบไม่ถาวร |

> หมายเหตุ: `loadData()` จะดึงข้อมูล milestones โดยเรียงตาม `created_at` ก่อน แล้ว **เรียงใหม่อีกครั้งด้วย JavaScript ตามค่า `year`** เพื่อให้เส้นเวลาแสดงจากเก่าไปใหม่เสมอ ไม่ว่าจะเพิ่มข้อมูลตามลำดับไหนก็ตาม

**`site_stats`** — มีแถวเดียว `id` คงที่เป็น `1`
| คอลัมน์ | ประเภท | หมายเหตุ |
|---|---|---|
| id | int, PK | คงที่ `1` |
| visits | bigint | เพิ่มได้ผ่านฟังก์ชัน `increment_site_visit()` เท่านั้น ห้ามเขียนตรงเข้าตาราง |

## 7. ระบบความปลอดภัย (Security Model)

- **เปิดใช้ Row-Level Security (RLS) ทุกตาราง**
- **สิทธิ์สาธารณะ (`anon`):** อ่านได้อย่างเดียว (`SELECT`)
  - `org`: อ่านได้แถวเดียวโดยไม่มีเงื่อนไข
  - `activities` / `members` / `milestones`: อ่านได้เฉพาะแถวที่ `isactive = true`
  - `site_stats`: อ่านได้โดยไม่มีเงื่อนไข (เพื่อโชว์ตัวเลขคนเข้าชม)
- **สิทธิ์ผู้ที่ล็อกอินแล้ว (`authenticated`):** เพิ่ม/แก้ไข/ลบได้เต็มที่ในทุกตาราง (`org`, `activities`, `members`, `milestones`) — เงื่อนไขเขียนไว้แบบเปิดหมด (`using (true) with check (true)`) หมายความว่า **เมื่อล็อกอินแล้ว แก้ไขได้ทุกแถวโดยไม่มีข้อจำกัด**
- **ที่เก็บรูปภาพ `activity-images`:** เป็น bucket สาธารณะ ใครก็อ่าน (`SELECT`) ได้ แต่ต้องล็อกอินก่อนถึงจะเพิ่ม/แก้ไข/ลบไฟล์ได้
- **ตัวนับจำนวนคนเข้าชม** เพิ่มผ่านฟังก์ชัน SQL พิเศษ (`SECURITY DEFINER`) ชื่อ `public.increment_site_visit()` ที่อนุญาตให้ทั้ง `anon` และ `authenticated` เรียกใช้ได้ ทำให้กุญแจสาธารณะเพิ่มค่าได้ทีละ 1 เท่านั้น ไม่สามารถตั้งค่าตัวเลขเองได้ตามใจ
- กุญแจ Supabase แบบสาธารณะ (**anon key**) ถูก **ใส่ไว้ในโค้ด `js/config.js` โดยตั้งใจ** และมองเห็นได้จากเบราว์เซอร์ ซึ่งปลอดภัยตามการออกแบบของ Supabase เพราะกุญแจนี้ทำได้แค่ตามที่ RLS อนุญาตเท่านั้น ความปลอดภัยจริงๆ มาจากนโยบาย RLS ข้างต้น ไม่ใช่จากการซ่อนกุญแจ

## 8. การล็อกอินและการจัดการ Session

- ใช้ **Supabase Auth** แบบอีเมล + รหัสผ่าน
- เว็บไซต์นี้ไม่มีหน้าสมัครสมาชิก บัญชีแอดมินต้องสร้างเองผ่าน **Supabase Dashboard → Authentication → Users** (ติ๊ก "Auto Confirm User")
- การจำสถานะล็อกอินจัดการโดย `supabase-js` เอง (เก็บไว้ใน `localStorage` ของเบราว์เซอร์) ทำให้แอดมินที่ล็อกอินแล้วยังล็อกอินอยู่แม้รีเฟรชหน้า จนกว่าจะล็อกเอาท์หรือ session หมดอายุ
- **ออกจากระบบอัตโนมัติเมื่อไม่ได้ใช้งาน:** ตัวแปร `IDLE_LIMIT_MS` ใน `js/config.js` กำหนดไว้ที่ `30 * 60 * 1000` (30 นาที) ไฟล์ `js/app.js` จะดักจับการขยับเมาส์ กดคีย์บอร์ด เลื่อนหน้าจอ และการสลับแท็บ เพื่ออัปเดตเวลา "ใช้งานล่าสุด" และเช็คทุก 30 วินาทีว่าเวลาเกิน 30 นาทีหรือยัง ถ้าเกินจะเรียก `App.logout()` และครั้งถัดไปที่แสดงผลจะโชว์ข้อความ `session_timeout`

## 9. การจัดการรูปภาพ

- ผู้ใช้เลือกรูปจากเครื่องผ่าน input ไฟล์ รูปจะยังไม่ถูกอัปโหลดทันทีที่เลือก
- ตอนกด **Save** ฟังก์ชัน `resize()` ใน `js/helpers.js` จะวาดรูปลงบน `<canvas>` ที่มองไม่เห็น ปรับขนาดให้ด้านที่ยาวที่สุดไม่เกิน **1280 พิกเซล** แล้วบีบเป็น JPEG คุณภาพ **82%** ก่อนอัปโหลด เพื่อให้เว็บโหลดเร็วไม่ว่ารูปต้นฉบับจะใหญ่แค่ไหน
- รูปที่ปรับขนาดแล้วจะถูกอัปโหลดไปยัง bucket `activity-images` แล้ว URL สาธารณะที่ได้จะถูกเก็บไว้ใน `activities.images` (เป็น array แบบ JSONB) ในรูปแบบ `{ "url": ..., "isactive": true }`
- การลบรูปทีละรูป: เมื่อลบรูปใดรูปหนึ่งออกจากกิจกรรม ระบบจะตั้งค่า `isactive` ของรูปนั้นเป็น `false` ภายใน array แทนการลบ element ออกจริง (ตามแนวคิด soft delete เดียวกันกับการลบแถวทั้งแถว)
- จำกัดไว้ที่ 30 รูปต่อกิจกรรม (ควบคุมที่หน้าเว็บ ข้อความ "Reached the 30-image limit")

## 10. การตั้งค่า (Configuration)

ค่าตั้งค่าทั้งหมดอยู่ใน **`js/config.js`** ไฟล์เดียว — ไม่มีไฟล์ `.env` และไม่มีการแทนค่าตัวแปร environment ตอน build เพราะเว็บไซต์นี้ไม่มีขั้นตอน build เลย

| ตัวแปร | หน้าที่ |
|---|---|
| `SUPABASE_URL` | URL ของโปรเจกต์ Supabase |
| `SUPABASE_ANON_KEY` | กุญแจสาธารณะ (ดูหัวข้อ 7 ว่าทำไมปลอดภัยที่จะใส่ไว้ในโค้ด) |
| `BUCKET` | ชื่อ bucket เก็บรูป คือ `'activity-images'` |
| `IDLE_LIMIT_MS` | เวลาที่ใช้กำหนดการออกจากระบบอัตโนมัติ |
| `GRADS` | สีไล่ระดับสำรอง ใช้แสดงแทนรูปกิจกรรม/สมาชิกที่ยังไม่มีรูป |
| `T` | ข้อความทุกชิ้นที่แสดงบนเว็บไซต์ ถ้าจะแปลภาษาใหม่ ให้แก้ค่าตรงนี้ ไม่ต้องแก้โค้ดหน้าเว็บ |
| `CONFIGURED` | เป็น `true` เมื่อมีการใส่กุญแจจริงแทนค่าตัวอย่าง `'PASTE_YOUR...'` ถ้ายังเป็น `false` หน้าเว็บจะโชว์หน้า "ต้องตั้งค่าก่อน" แทนเว็บไซต์จริง |

## 11. CI/CD

- มี workflow เดียวในโปรเจกต์ คือ **`.github/workflows/keep-alive.yml`**
- ทำงานตามเวลาที่กำหนด (วันอาทิตย์และวันพุธ เวลา 03:00) โดยส่ง HTTP GET ไปที่ Supabase REST API หนึ่งครั้ง
- มีหน้าที่เดียวคือ **ป้องกันโปรเจกต์ Supabase แบบฟรีหยุดทำงานอัตโนมัติ** หลังไม่มีการใช้งาน 7 วัน ไม่ได้ทำหน้าที่ build, test หรือ deploy ใดๆ
- ในโปรเจกต์ไม่มีระบบทดสอบอัตโนมัติ และไม่มีขั้นตอน deploy อัตโนมัติเลย

## 12. ขั้นตอนการนำไปใช้งานจริง (Deployment)

1. สร้างโปรเจกต์ Supabase ใหม่
2. รันเนื้อหาทั้งหมดในไฟล์ `supabase-setup.sql` ผ่าน Supabase SQL Editor (เลือก "Run and enable RLS")
3. สร้างบัญชีแอดมินที่ **Authentication → Users** (ติ๊ก "Auto Confirm User")
4. คัดลอกกุญแจสาธารณะของโปรเจกต์ (**Project Settings → API**) มาใส่ที่ `SUPABASE_ANON_KEY` ในไฟล์ `js/config.js`
5. จากนั้นเลือกอย่างใดอย่างหนึ่ง:
   - เปิดไฟล์ `index.html` ตรงๆ ในเบราว์เซอร์ได้เลย หรือ
   - อัปโหลดทั้งโฟลเดอร์ไปยังโฮสติ้งแบบ static (Vercel, Netlify, GitHub Pages, Firebase Hosting) — ไม่ต้องตั้งค่า build command ใดๆ

## 13. ข้อควรรู้/จุดที่ต้องระมัดระวัง

- **ชื่อคอลัมน์สลับกัน**: `org.name` ↔ หน้าเว็บ `nameFull.en`, `org.name_full` ↔ หน้าเว็บ `fullName.en` (ดูหัวข้อ 6) เป็นการตั้งใจเก็บไว้แบบนี้ ถ้าจะแก้ต้องแก้พร้อมกันทั้งสองฝั่ง
- **ไม่มีระบบทดสอบอัตโนมัติ** — ต้องทดสอบด้วยมือผ่านเบราว์เซอร์จริง โดยเชื่อมกับโปรเจกต์ Supabase จริง
- **ไม่มี TypeScript หรือการตรวจสอบชนิดข้อมูล** — ความถูกต้องของโค้ดขึ้นกับการตั้งชื่อตัวแปรให้สม่ำเสมอและคอมเมนต์ในโค้ด
- **ไม่มีการแบ่งสิทธิ์ระดับตารางหรือฟิลด์** — ผู้ใช้ที่ล็อกอินแล้วทุกคนแก้ไขได้ทุกตาราง ไม่มีแนวคิดสิทธิ์แบบจำกัดในระดับฐานข้อมูล
- **ข้อมูลที่ลบแบบ soft delete ไม่มีปุ่มกู้คืนในหน้าเว็บ** — ต้องเข้าไปเปลี่ยนค่า `isactive` กลับเป็น `true` ตรงในระบบ Supabase เอง
- ข้อมูลตัวอย่าง/ทดสอบ เก็บแยกไว้ในไฟล์ `supabase-seed-demo.sql` และจะไม่ถูกรันโดยอัตโนมัติ
