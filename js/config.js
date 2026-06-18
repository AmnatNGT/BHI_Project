"use strict";
/* ============================================================
   BHI — Border Health Initiative
   Config: Supabase project + static content strings
   ============================================================ */

/* Find the anon key in:  Supabase Dashboard → Project Settings → API → "Project API keys" → anon public
   The anon key is meant to be used in the browser; access is controlled by RLS. */
const SUPABASE_URL      = 'https://vcokcwnjcwrjisyoazqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjb2tjd25qY3dyamlzeW9henFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDQ1MzMsImV4cCI6MjA5NzI4MDUzM30.IYJP174jcGDFZ2liHg0zcAa1cCAbR-q4VJZWmQB3fvY';
const BUCKET            = 'activity-images';

const CONFIGURED = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.indexOf('PASTE_YOUR') !== 0;
let sb = null;
if (CONFIGURED && window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GRADS = [
  'linear-gradient(135deg,#3FB984,#2E8B57)', 'linear-gradient(135deg,#57A777,#2E8B57)',
  'linear-gradient(135deg,#2E8B86,#2E8B57)', 'linear-gradient(135deg,#6FB36A,#3F8F5B)',
  'linear-gradient(135deg,#2E8B57,#1F6E4A)', 'linear-gradient(135deg,#84B86B,#4E9A6B)'
];

const T = {
  nav_home: 'Home', nav_activities: 'Activities', nav_history: 'Our Story', nav_members: 'Our Team',
  admin: 'Admin', view_site: 'View site', logout: 'Log out',
  hero_badge: 'Community health on the border', cta_activities: 'See our activities', cta_about: 'Our story',
  latest_kicker: 'What we do', latest: 'Latest Activities', view_all: 'View all',
  team_kicker: 'Our people',
  readmore: 'Read more', images: 'photos',
  empty_pub: 'No activities yet', empty_members: 'No team members yet',
  act_title: 'Our Activities', act_sub: 'Everything we have done, newest first',
  hist_kicker: 'Who we are', hist_title: 'Our Story', timeline_title: 'Milestones',
  mem_title: 'Our Team', mem_sub: 'The people making it happen',
  login_title: 'Admin Login', login_sub: 'For organization staff only', login_user: 'Email', login_pass: 'Password',
  login_btn: 'Log in', login_hint: 'Sign in with the admin account you created in Supabase', login_err: 'Incorrect email or password',
  dash_title: 'Admin Dashboard', dash_orginfo: 'Organization Info', dash_actmgr: 'Manage Activities', dash_memmgr: 'Manage Team', autosave: 'Changes save automatically',
  saved: 'Saved', add_activity: 'Add activity', edit_activity: 'Edit activity', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel',
  save_changes: 'Save changes', save_hint: 'Edits are applied only after you click Save', unsaved: 'Unsaved changes',
  f_title: 'Activity title', f_desc: 'Description', f_date: 'Date', f_images: 'Images', f_add: 'Add image',
  f_hint: 'Up to 30 images', f_full: 'Reached the 30-image limit',
  empty_admin: 'No activities yet — tap "Add activity" to start', empty_members_admin: 'No team members yet — tap "Add member".',
  org_short: 'Monogram (logo)', org_namefull: 'Full name', org_tagline: 'Tagline', org_about: 'About',
  org_contact: 'Contact', c_place: 'Working area', c_email: 'Email',
  at_org: 'Organization', at_act: 'Activities', at_hist: 'Our Story', at_mem: 'Our Team',
  hist_story: 'Organization story', m_add: 'Add milestone', m_year: 'Year', m_title: 'Title', m_desc: 'Description',
  mb_add: 'Add member', mb_edit: 'Edit member', m_edit: 'Edit milestone', mb_name: 'Name', mb_role: 'Role', mb_bio: 'Short bio', mb_photo: 'Photo',
  footer_about: 'Join us in bringing health and hope to families along the border', footer_contact: 'Contact', footer_explore: 'Explore', footer_rights: 'All rights reserved',
  confirm_del: 'Delete this activity?', confirm_del_member: 'Remove this team member?', confirm_del_ms: 'Remove this milestone?',
  loading: 'Loading…', saving: 'Saving…'
};
