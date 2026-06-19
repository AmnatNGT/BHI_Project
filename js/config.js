"use strict";
/* ============================================================
   BHI — Border Health Initiative
   Config: Supabase project + static content strings
   ============================================================ */

/* Find the anon key in:  Supabase Dashboard → Project Settings → API → "Project API keys" → anon public
   The anon key is meant to be used in the browser; access is controlled by RLS. */
const SUPABASE_URL      = 'https://vcokcwnjcwrjisyoazqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjb2tjd25qY3dyamlzeW9henFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDQ1MzMsImV4cCI6MjA5NzI4MDUzM30.IYJP174jcGDFZ2liHg0zcAa1cCAbR-q4VJZWmQB3fvY';
const BUCKET             = 'activity-images';
const IDLE_LIMIT_MS      = 30 * 60 * 1000; // auto-logout admins after this many ms of inactivity

// True once someone has pasted a real anon key in place of the placeholder.
// While false, render() shows setupScreen() instead of the app (see app.js).
const CONFIGURED = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.indexOf('PASTE_YOUR') !== 0;

// `sb` is our Supabase client instance. Named "sb" (not "supabase") so it doesn't
// shadow the `window.supabase` SDK namespace that creates it on the line below.
let sb = null;
if (CONFIGURED && window.supabase) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Fallback cover gradients for activity/member photos, cycled by list position
// (see the `_i` index trick in ui-kit.js's activityCard, and the member cards
// in views-public.js / views-admin.js) so cards without an image still look distinct.
const GRADS = [
  'linear-gradient(135deg,#34A573,#155C3A)',
  'linear-gradient(135deg,#1F7A4D,#0F3A26)',
  'linear-gradient(135deg,#3C8F6E,#1B4D38)',
  'linear-gradient(135deg,#5B9B6E,#256B45)',
  'linear-gradient(135deg,#2D8364,#123524)',
  'linear-gradient(135deg,#6FA37A,#2F6B4A)'
];

/* ------------------------------------------------------------
   T — all user-facing text in one place (English copy today;
   swap values here to retranslate without touching view code).
   Every screen reads from this object as T.<key>, so keys must
   stay exactly as named below — only the *values* are meant to change.
   ------------------------------------------------------------ */
const T = {
  // Top navigation + header
  nav_home: 'Home', nav_activities: 'Activities', nav_history: 'Our Story', nav_members: 'Our Team',
  admin: 'Admin', logout: 'Log out',

  // Home page (hero + latest activities)
  hero_badge: 'Community health on the border', cta_activities: 'See our activities', cta_about: 'Our story',
  latest_kicker: 'What we do', latest: 'Latest Activities', view_all: 'View all',
  readmore: 'Read more', images: 'photos',
  empty_pub: 'No activities yet', empty_members: 'No team members yet',

  // Activities page
  act_title: 'Our Activities', act_sub: 'Everything we have done, newest first',

  // Our Story page (history + milestones timeline)
  hist_kicker: 'Who we are', hist_title: 'Our Story', timeline_title: 'Milestones',

  // Our Team page
  team_kicker: 'Our people', mem_title: 'Our Team', mem_sub: 'The people making it happen',

  // Admin — login screen
  login_title: 'Admin Login', login_sub: 'For organization staff only', login_user: 'Email', login_pass: 'Password',
  login_btn: 'Log in', login_hint: 'Sign in with the admin account', login_err: 'Incorrect email or password',
  session_timeout: 'You were logged out after 30 minutes of inactivity.',

  // Admin — dashboard shell + shared action labels
  dash_title: 'Admin Dashboard', dash_orginfo: 'Organization Info', dash_actmgr: 'Manage Activities', dash_memmgr: 'Manage Team',
  total_visits: 'Total visits',
  saved: 'Saved', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
  at_org: 'Organization', at_act: 'Activities', at_hist: 'Our Story', at_mem: 'Our Team',

  // Admin — activity add/edit form
  add_activity: 'Add activity', edit_activity: 'Edit activity',
  f_title: 'Activity title', f_desc: 'Description', f_date: 'Date', f_images: 'Images', f_add: 'Add image',
  f_hint: 'Up to 30 images', f_full: 'Reached the 30-image limit',
  empty_admin: 'No activities yet — tap "Add activity" to start',

  // Admin — organization info form
  // org_namefull labels the brand-name field (org.nameFull.en); org_fullname labels the
  // org's full-name field (org.fullName.en), shown as the homepage hero heading — see
  // the mapping note in state.js orgFromRow().
  org_logo: 'Logo', org_logo_hint: 'Shown in the header and footer instead of the monogram', org_logo_remove: 'Remove',
  org_short: 'Monogram', org_short_hint: 'Used as a placeholder when there\'s no logo',
  org_namefull: 'Name', org_fullname: 'Full Name', org_about: 'About',
  org_contact: 'Contact', c_place: 'Working area', c_email: 'Email',

  // Admin — our story + milestones form
  hist_story: 'Organization story', m_add: 'Add milestone', m_edit: 'Edit milestone',
  m_year: 'Year', m_title: 'Title', m_desc: 'Description',

  // Admin — team member form
  mb_add: 'Add member', mb_edit: 'Edit member', mb_name: 'Name', mb_role: 'Role', mb_photo: 'Photo',
  mb_order: 'Order', mb_order_hint: 'Position on the Our Team page (1 = shown first)',
  empty_members_admin: 'No team members yet — tap "Add member".',

  // Footer
  footer_contact: 'Contact', footer_explore: 'Explore', footer_rights: 'All rights reserved',

  // Delete confirmations (window.confirm prompts)
  confirm_del: 'Delete this activity?', confirm_del_member: 'Remove this team member?', confirm_del_ms: 'Remove this milestone?',

  // Generic status messages
  loading: 'Loading…', saving: 'Saving…'
};
