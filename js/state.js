"use strict";
/* ============================================================
   STATE + DB <-> view data mapping
   ============================================================ */

// Single global state object. Every view function reads from this; every
// App.* action mutates it and then calls render() (see app.js) to redraw.
// There is no framework here — render() just rebuilds the whole #app HTML
// from this object, so "update the UI" always means "update state, then render()".
let state = {
  // current screen + mobile menu
  view: 'home', adminTab: 'activities', menuOpen: false,

  // admin login (Supabase Auth)
  loggedIn: false, login: { user: '', pass: '' }, loginErr: false,

  // activity add/edit modal (js/modals.js formModal)
  formOpen: false, editingId: null,
  form: { title: '', desc: '', date: '', images: [] },

  // activity detail modal / image gallery (js/modals.js detailModal)
  detailOpen: false, detailId: null, detailImageIndex: 0,

  // organization info + "our story" inline edit-in-place panels
  // edit.org / edit.story toggle the panel between read view and form view;
  // snap holds a deep copy taken on "Edit" so "Cancel" can restore it untouched.
  edit: { org: false, story: false }, snap: null, orgSaved: false,

  // team member add/edit modal (js/modals.js memberModal)
  memForm: { open: false, id: null, name: '', role: '', photo: '', sort: 1 },

  // milestone add/edit modal (js/modals.js milestoneModal)
  msForm: { open: false, id: null, year: '', title: '', desc: '' },

  // app-wide status flags
  loading: true, busy: false, errorMsg: '',

  // data loaded from Supabase via loadData() below
  org: emptyOrg(), activities: [], members: [], milestones: [],

  // total site visits, shown in the public footer (see ui-kit.js footer())
  siteVisits: 0
};

// Default org values, used before loadData() resolves and as the fallback
// when no row exists yet in the `org` table.
function emptyOrg() {
  return {
    short: 'BHI',
    logo: '',
    nameFull: { en: 'Border Health Initiative' },
    tagline: { en: '' },
    about: { en: '' },
    history: { story: '' },
    contact: { place: '', email: '' },
    stats: {}
  };
}

/* ----- org: DB row <-> view model -----
   NOTE: the DB column names don't line up with the view-model names below —
   this is legacy naming, not a bug:
     DB "name"      -> view "nameFull.en"  (brand name shown in header/footer)
     DB "name_full" -> view "tagline.en"   (long headline shown on the homepage hero)
   Renaming either side would need a DB migration, so keep this mapping as-is. */
function orgFromRow(row) {
  if (!row) return emptyOrg();
  return {
    short: row.short || 'BHI',
    logo: row.logo || '',
    nameFull: { en: row.name || '' },
    tagline: { en: row.name_full || '' },
    about: { en: row.about || '' },
    history: { story: row.story || '' },
    contact: { place: row.place || '', email: row.email || '' },
    stats: row.stats || {}
  };
}
function orgToRow(org) {
  return {
    id: 1,
    short: org.short,
    logo: org.logo || '',
    name: org.nameFull.en,
    name_full: org.tagline.en,
    about: org.about.en,
    story: (org.history && org.history.story) || '',
    place: org.contact.place,
    email: org.contact.email,
    stats: org.stats || {},
    updated_at: new Date().toISOString()
  };
}

// Activities and milestones map straight across (DB column -> view field),
// only renaming "description" to "desc" and filling in safe defaults.
const activityFromRow = (row) => ({
  id: row.id,
  title: row.title || '',
  desc: row.description || '',
  date: row.date || '',
  images: normalizeImages(row.images),
  createdAt: row.created_at ? new Date(row.created_at).getTime() : 0
});
const milestoneFromRow = (row) => ({
  id: row.id,
  year: row.year || '',
  title: row.title || '',
  desc: row.description || '',
  sort: row.sort || 0
});

// Fetches everything the app needs in one go and replaces `state`'s data
// fields in place. Called on boot() and again after every admin save/delete
// so the UI always reflects what's actually in the database.
async function loadData() {
  if (!sb) return;

  // .eq('isactive', true) on each list query is what makes the admin's
  // "delete" buttons a soft delete: deleted rows stay in the database but are
  // never fetched back into the app (see deleteActivity/removeMember/removeMilestone
  // in actions.js, which flip isactive to false instead of removing the row).
  const [orgResult, activitiesResult, membersResult, milestonesResult] = await Promise.all([
    sb.from('org').select('*').eq('id', 1).maybeSingle(),
    sb.from('activities').select('*').eq('isactive', true),
    sb.from('members').select('*').eq('isactive', true).order('sort', { ascending: true }).order('created_at', { ascending: true }),
    sb.from('milestones').select('*').eq('isactive', true).order('created_at', { ascending: true })
  ]);

  // Supabase returns { data, error } per query — bail out on the first failure
  // so we don't render the app with only some of its data loaded.
  const firstError = orgResult.error || activitiesResult.error || membersResult.error || milestonesResult.error;
  if (firstError) throw firstError;

  state.org = orgFromRow(orgResult.data);
  state.activities = (activitiesResult.data || []).map(activityFromRow);
  state.members = (membersResult.data || []).map(row => ({
    id: row.id, name: row.name || '', role: row.role || '', photo: row.photo || '', sort: row.sort || 0
  }));
  // Milestones are stored unordered (sorted by created_at in the query above);
  // re-sort by year here so the timeline always reads oldest -> newest.
  state.milestones = (milestonesResult.data || [])
    .map(milestoneFromRow)
    .sort((a, b) => (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0));

  // Kept out of the Promise.all/firstError check above on purpose: this table
  // may not exist yet on a project that hasn't re-run supabase-setup.sql —
  // a failure here must not block the rest of the app from loading.
  try {
    const { data } = await sb.from('site_stats').select('visits').eq('id', 1).maybeSingle();
    state.siteVisits = (data && data.visits) || 0;
  } catch (e) {
    state.siteVisits = 0;
  }
}
