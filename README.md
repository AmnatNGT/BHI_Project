# BHI — Border Health Initiative

A static site (no build step) backed by Supabase for data, auth, and image storage.

## Structure

```
index.html              entry point — loads css/js, mounts the app into #app
css/style.css           global styles
js/
  config.js             Supabase connection + static text content
  state.js               app state + DB row <-> view data mapping + loadData()
  helpers.js             formatting/escaping helpers, image resize/upload
  ui-kit.js               shared UI fragments (nav, footer, activity card, buttons)
  views-public.js        public pages: home, activities, our story, our team
  views-admin.js          login screen + admin dashboard
  modals.js               activity/member/milestone/detail modals + setup/loading/error screens
  actions.js              the App controller object (all click/input handlers)
  app.js                  render() + boot() — loaded last
supabase-setup.sql       run once in the Supabase SQL editor to create tables, policies, storage bucket
```

Scripts are loaded as plain (non-module) `<script>` tags in dependency order, so the site runs
by opening `index.html` directly or from any static host — no bundler required.

## Setup

1. Run `supabase-setup.sql` in your Supabase project's SQL editor.
2. Create an admin user under Authentication → Users.
3. Paste your project's anon public key into `SUPABASE_ANON_KEY` in [js/config.js](js/config.js).
