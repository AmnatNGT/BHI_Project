# Functional Specification Document (FSD)
# เอกสารข้อกำหนดการใช้งานระบบ (FSD)

| | |
|---|---|
| **Project / โครงการ** | BHI — Border Health Initiative Website |
| **Version / เวอร์ชัน** | 1.0 |
| **Date / วันที่** | 2026-06-19 |
| **Status / สถานะ** | Feature-complete, not yet deployed to a public URL |

> This document has two parts: **English** first, then **Thai (ภาษาไทย)** below it. Both cover the same content.
> เอกสารนี้มี 2 ส่วน คือ ภาษาอังกฤษ (ด้านบน) และ ภาษาไทย (ด้านล่าง) เนื้อหาเหมือนกันทั้งสองส่วน

---

# PART 1 — ENGLISH

## 1. Overview

BHI (Border Health Initiative) is a nonprofit that brings basic healthcare, medicine, and relief supplies to communities along the Thai–Myanmar border. This website gives the organization a public presence — a place for anyone to see what BHI does, its history, and its people — plus a simple admin area so BHI staff can update that content themselves, without writing code or asking a developer every time.

## 2. Goals

- Let the public see BHI's activities, story, and team.
- Let staff add/edit/remove content (activities, team members, milestones, organization info) through simple forms.
- Keep running costs at or near zero (static hosting + Supabase free tier).

## 3. Users / Roles

| Role | Who | Can do |
|---|---|---|
| Visitor (Public) | Anyone on the internet | View Home, Activities, Our Story, Our Team pages |
| Admin (Staff) | BHI staff member with a login | Everything a Visitor can do, plus add/edit/delete all content |

There is only one tier of login. Anyone who can log in gets full edit rights — there is no "view-only" or "editor vs. owner" distinction.

## 4. Functional Requirements

### 4.1 Public Website

**FR-1 Home Page**
- Shows the organization's name, tagline, and two call-to-action buttons ("See our activities", "Our story").
- Shows the 3 most recent activities.
- Shows summary stats (years active, people reached, villages served).

**FR-2 Activities Page**
- Lists all activities, newest first.
- Each card shows date, title, short excerpt, photo count, and a cover photo.
- Clicking a card opens a detail view with the full description and a swipeable photo gallery.

**FR-3 Our Story Page**
- Shows the organization's history/story text.
- Shows a timeline of milestones (year, title, description), ordered oldest to newest.

**FR-4 Our Team Page**
- Shows team members as cards (photo, name, role).
- Members appear in the order staff set (lowest order number shown first; people with the same order number are treated as co-leads at the same level).

**FR-5 Navigation & Footer**
- Sticky top navigation linking to all public pages and to Admin.
- Mobile-friendly hamburger menu.
- Footer with contact info, quick links, and a live "total site visits" counter.

### 4.2 Admin Area

**FR-6 Login**
- Admin logs in with email + password.
- Wrong credentials show an "Incorrect email or password" message.
- After 30 minutes with no activity (no mouse movement, keyboard input, or scrolling), the admin is logged out automatically and shown a notice the next time they try to do something.

**FR-7 Organization Info Management**
- Editable fields: logo image, monogram (short name shown when there's no logo), brand name, full name (shown as the homepage hero heading), about text, working area, contact email.
- Clicking "Edit" turns the read-only view into a form. "Cancel" discards changes and restores the original values. "Save" writes the changes to the database.

**FR-8 Activities Management**
- View a list of all activities (thumbnail, date, photo count).
- Add a new activity: title (required), date (required), description, and up to 30 photos.
- Edit an existing activity (same fields).
- Delete an activity — a confirmation prompt appears first ("Delete this activity?"). The activity disappears from the public site and the admin list, but the record is kept in the database (see Business Rule BR-1).
- Photos are automatically resized before upload so the site stays fast to load.

**FR-9 Our Story & Milestones Management**
- Edit the organization's story text.
- Add / edit / delete milestones (year, title, description).
- Deleting a milestone shows a confirmation prompt first.

**FR-10 Team Management**
- Add / edit / delete team members (name, role, photo, display order).
- Deleting a member shows a confirmation prompt first.

## 5. Business Rules

- **BR-1 Soft delete.** Deleting an activity, team member, or milestone never permanently erases it — the record stays in the database but is hidden from both the public site and the admin lists. There is currently no "undo"/restore button in the website itself; restoring a deleted item requires direct database access.
- **BR-2 Single organization.** The system is built for exactly one organization profile. It does not support multiple organizations sharing the same site.
- **BR-3 Image limit.** An activity can have at most 30 photos.
- **BR-4 Idle logout.** For security, an admin session ends automatically after 30 minutes without activity.
- **BR-5 Single admin tier.** Every account that can log in has full edit rights across the whole site. There is no partial-access or "read-only staff" role.

## 6. Non-Functional Requirements

- Works on both desktop and mobile browsers (responsive layout).
- Accessible: keyboard navigation, ARIA labels, a "skip to content" link.
- No build step — the site is plain static files, so it can be hosted almost anywhere for free.
- Reading public data never requires login; only making changes requires login, and this is enforced at the database level (not just hidden in the website).
- The free-tier database is kept awake by an automatic check-in twice a week, so the site doesn't go offline from inactivity.

## 7. Out of Scope (current version)

- Multiple admin roles / permission levels.
- Multi-language UI (all interface text is English today, even though the fonts support Thai).
- Email notifications, newsletters, or a public contact form.
- Payment or donation processing.
- Support for more than one organization on the same site.
- An automated test suite.

## 8. Assumptions & Constraints

- Requires an internet connection — there is no offline mode.
- Requires a Supabase project; the free tier is enough for typical nonprofit-scale traffic.
- The public ("anon") API key is visible in the website's source code by design. This is safe because access control comes from Supabase's Row-Level Security rules, not from keeping the key secret.

---

# PART 2 — ภาษาไทย

## 1. ภาพรวมโครงการ

BHI (Border Health Initiative) เป็นองค์กรไม่แสวงหากำไรที่นำบริการสุขภาพพื้นฐาน ยา และของช่วยเหลือ ไปมอบให้ชุมชนตามแนวชายแดนไทย–เมียนมา เว็บไซต์นี้ทำขึ้นเพื่อให้องค์กรมีหน้าตาบนอินเทอร์เน็ต ให้คนทั่วไปเข้ามาดูได้ว่า BHI ทำอะไรบ้าง มีความเป็นมาอย่างไร และมีทีมงานใครบ้าง พร้อมทั้งมีหน้า "แอดมิน" ให้เจ้าหน้าที่ BHI แก้ไขเนื้อหาเองได้ ไม่ต้องเขียนโค้ดหรือรอโปรแกรมเมอร์ทุกครั้งที่อยากเปลี่ยนข้อมูล

## 2. เป้าหมาย

- ให้คนทั่วไปเห็นกิจกรรม เรื่องราว และทีมงานของ BHI
- ให้เจ้าหน้าที่เพิ่ม/แก้ไข/ลบเนื้อหา (กิจกรรม สมาชิกทีม เหตุการณ์สำคัญ ข้อมูลองค์กร) ผ่านฟอร์มง่ายๆ ได้เอง
- ให้ค่าใช้จ่ายในการดูแลเว็บไซต์ใกล้เคียงศูนย์ (ใช้โฮสติ้งฟรี + Supabase แบบฟรี)

## 3. ผู้ใช้งานระบบ

| บทบาท | คือใคร | ทำอะไรได้บ้าง |
|---|---|---|
| ผู้เข้าชมทั่วไป | ใครก็ได้บนอินเทอร์เน็ต | ดูหน้า Home, Activities, Our Story, Our Team |
| แอดมิน (เจ้าหน้าที่) | เจ้าหน้าที่ BHI ที่มีบัญชีเข้าสู่ระบบ | ดูได้ทุกอย่างเหมือนผู้เข้าชม และเพิ่ม/แก้ไข/ลบเนื้อหาได้ทั้งหมด |

ระบบมีสิทธิ์การเข้าใช้งานแบบเดียวเท่านั้น คือถ้าล็อกอินได้ ก็แก้ไขข้อมูลได้ทุกอย่าง ไม่มีสิทธิ์แบบ "ดูได้อย่างเดียว" หรือสิทธิ์แบบจำกัด

## 4. รายละเอียดการทำงานของระบบ

### 4.1 หน้าเว็บสำหรับคนทั่วไป

**FR-1 หน้าแรก (Home)**
- แสดงชื่อองค์กร คำขวัญ และปุ่ม 2 ปุ่มให้กดไปดูกิจกรรมหรือเรื่องราว
- แสดงกิจกรรมล่าสุด 3 รายการ
- แสดงตัวเลขสรุป เช่น ทำงานมากี่ปี ช่วยคนไปแล้วกี่คน ไปแล้วกี่หมู่บ้าน

**FR-2 หน้ากิจกรรม (Activities)**
- แสดงกิจกรรมทั้งหมด เรียงจากใหม่ไปเก่า
- การ์ดแต่ละกิจกรรมโชว์ วันที่ ชื่อ เนื้อเรื่องย่อ จำนวนรูป และรูปหน้าปก
- กดที่การ์ดเพื่อดูรายละเอียดเต็มๆ พร้อมเลื่อนดูรูปภาพได้ทั้งหมด

**FR-3 หน้าเรื่องราวของเรา (Our Story)**
- แสดงเนื้อเรื่องความเป็นมาขององค์กร
- แสดงเส้นเวลาของเหตุการณ์สำคัญ (ปี ชื่อเหตุการณ์ คำอธิบาย) เรียงจากเก่าไปใหม่

**FR-4 หน้าทีมงาน (Our Team)**
- แสดงรายชื่อทีมงานเป็นการ์ด มีรูป ชื่อ ตำแหน่ง
- เรียงลำดับตามที่เจ้าหน้าที่กำหนด (เลขน้อยกว่าแสดงก่อน คนที่ตั้งเลขเดียวกันถือว่าตำแหน่งเท่ากัน)

**FR-5 เมนูนำทางและส่วนล่างเว็บ**
- มีเมนูด้านบนติดหน้าจอ เชื่อมไปทุกหน้ารวมถึงหน้า Admin
- มีเมนูแบบแฮมเบอร์เกอร์สำหรับมือถือ
- มีส่วนล่างเว็บ (footer) แสดงข้อมูลติดต่อ ลิงก์ลัด และจำนวนคนเข้าชมเว็บไซต์รวม

### 4.2 หน้าแอดมิน

**FR-6 เข้าสู่ระบบ**
- แอดมินล็อกอินด้วยอีเมลและรหัสผ่าน
- ถ้าใส่ผิด จะมีข้อความแจ้งว่า "Incorrect email or password"
- ถ้าไม่มีการใช้งานเลย (ไม่ขยับเมาส์ ไม่กดคีย์บอร์ด ไม่เลื่อนหน้าจอ) เกิน 30 นาที ระบบจะออกจากระบบให้อัตโนมัติ และจะแจ้งเตือนในครั้งถัดไปที่พยายามทำอะไร

**FR-7 จัดการข้อมูลองค์กร**
- แก้ไขได้: รูปโลโก้ ชื่อย่อ (ใช้แสดงตอนไม่มีโลโก้) ชื่อแบรนด์ ชื่อเต็ม (ใช้เป็นหัวข้อใหญ่หน้าแรก) ข้อความ "เกี่ยวกับเรา" พื้นที่ทำงาน อีเมลติดต่อ
- กดปุ่ม "Edit" เพื่อเปลี่ยนจากหน้าดูอย่างเดียวเป็นฟอร์มกรอกข้อมูล กดปุ่ม "Cancel" เพื่อยกเลิกและคืนค่าเดิม กดปุ่ม "Save" เพื่อบันทึกข้อมูลลงฐานข้อมูล

**FR-8 จัดการกิจกรรม**
- ดูรายการกิจกรรมทั้งหมด (รูปย่อ วันที่ จำนวนรูป)
- เพิ่มกิจกรรมใหม่: ชื่อกิจกรรม (ต้องกรอก) วันที่ (ต้องกรอก) คำอธิบาย และรูปภาพสูงสุด 30 รูป
- แก้ไขกิจกรรมที่มีอยู่ (ฟิลด์เดียวกัน)
- ลบกิจกรรม — ระบบจะถามยืนยันก่อนทุกครั้ง ("Delete this activity?") กิจกรรมจะหายไปจากหน้าเว็บและรายการแอดมิน แต่ข้อมูลยังเก็บอยู่ในฐานข้อมูล (ดูกฎ BR-1)
- รูปภาพจะถูกปรับขนาดให้เล็กลงอัตโนมัติก่อนอัปโหลด เพื่อให้เว็บโหลดเร็ว

**FR-9 จัดการเรื่องราวและเหตุการณ์สำคัญ**
- แก้ไขเนื้อเรื่องราวขององค์กร
- เพิ่ม / แก้ไข / ลบ เหตุการณ์สำคัญ (ปี ชื่อเหตุการณ์ คำอธิบาย)
- การลบจะมีข้อความถามยืนยันก่อนเสมอ

**FR-10 จัดการทีมงาน**
- เพิ่ม / แก้ไข / ลบ สมาชิกทีม (ชื่อ ตำแหน่ง รูป ลำดับการแสดง)
- การลบจะมีข้อความถามยืนยันก่อนเสมอ

## 5. กฎการทำงานของระบบ (Business Rules)

- **BR-1 การลบแบบไม่ถาวร (Soft Delete):** เมื่อลบกิจกรรม สมาชิก หรือเหตุการณ์สำคัญ ข้อมูลจะไม่ถูกลบออกจากฐานข้อมูลจริงๆ แค่ถูกซ่อนจากหน้าเว็บและรายการแอดมินเท่านั้น ตอนนี้ในเว็บไซต์ยังไม่มีปุ่ม "กู้คืน" ถ้าต้องการกู้คืนข้อมูลที่ลบไปแล้ว ต้องให้ผู้ดูแลฐานข้อมูลช่วยจัดการให้
- **BR-2 องค์กรเดียว:** ระบบออกแบบมาให้ใช้กับองค์กรเดียวเท่านั้น ไม่รองรับหลายองค์กรในเว็บเดียวกัน
- **BR-3 จำนวนรูปสูงสุด:** 1 กิจกรรม มีรูปได้ไม่เกิน 30 รูป
- **BR-4 ออกจากระบบอัตโนมัติ:** ถ้าไม่มีการใช้งานเกิน 30 นาที ระบบจะออกจากระบบให้เองเพื่อความปลอดภัย
- **BR-5 สิทธิ์แอดมินแบบเดียว:** บัญชีไหนล็อกอินได้ จะแก้ไขข้อมูลได้ทั้งเว็บไซต์ ไม่มีสิทธิ์แบบจำกัดหรือดูได้อย่างเดียว

## 6. ความต้องการอื่นๆ ที่ไม่ใช่ฟังก์ชันหลัก

- ใช้งานได้ทั้งบนคอมพิวเตอร์และมือถือ (ปรับขนาดหน้าจอให้พอดีอัตโนมัติ)
- รองรับการเข้าถึงสำหรับผู้พิการ (ใช้คีย์บอร์ดควบคุมได้ มีปุ่มข้ามไปเนื้อหาหลัก)
- ไม่ต้องผ่านขั้นตอน build ใดๆ เป็นไฟล์เว็บธรรมดา จึงนำไปวางบนโฮสติ้งที่ไหนก็ได้แบบฟรี
- การดูข้อมูลสาธารณะไม่ต้องล็อกอิน แต่การแก้ไขข้อมูลต้องล็อกอินเท่านั้น และมีการป้องกันไว้ที่ระดับฐานข้อมูลโดยตรง ไม่ใช่แค่ซ่อนปุ่มไว้ในหน้าเว็บ
- ฐานข้อมูลแบบฟรีจะถูกเช็คอินอัตโนมัติสัปดาห์ละ 2 ครั้ง เพื่อไม่ให้ระบบหลับจนใช้งานไม่ได้

## 7. สิ่งที่ระบบยังไม่รองรับ (Out of Scope)

- สิทธิ์แอดมินหลายระดับ
- เว็บไซต์หลายภาษา (ตอนนี้ตัวอักษรในหน้าเว็บเป็นภาษาอังกฤษทั้งหมด แม้ฟอนต์จะรองรับภาษาไทยอยู่แล้ว)
- การส่งอีเมลแจ้งเตือน หรือแบบฟอร์มติดต่อกลับจากผู้เข้าชม
- ระบบรับบริจาคหรือชำระเงิน
- การรองรับหลายองค์กรในเว็บเดียวกัน
- ระบบทดสอบอัตโนมัติ

## 8. ข้อสมมติและข้อจำกัด

- ต้องมีอินเทอร์เน็ตเสมอ ใช้งานแบบออฟไลน์ไม่ได้
- ต้องมีโปรเจกต์ Supabase (แบบฟรีก็เพียงพอสำหรับองค์กรขนาดเล็กถึงกลาง)
- กุญแจ API สาธารณะ (anon key) จะมองเห็นได้ในโค้ดของเว็บไซต์ ซึ่งเป็นเรื่องปกติและตั้งใจให้เป็นแบบนี้ เพราะความปลอดภัยจริงๆ มาจากการตั้งค่าสิทธิ์การเข้าถึงข้อมูลในฐานข้อมูล (Row-Level Security) ไม่ใช่จากการซ่อนกุญแจ
