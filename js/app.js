"use strict";
/* ============================================================
   RENDER + BOOTSTRAP
   ============================================================ */

// Rebuilds the entire #app HTML from the current `state`. There's no
// framework/diffing here — every App.* action mutates `state` then calls
// this function, and the whole tree is thrown away and rebuilt from the
// template strings in views-public.js / views-admin.js / modals.js.
// (A couple of spots bypass this for snappier feedback — see updateSaveBtn()
// in actions.js and refreshDetailImage() in modals.js.)
function render() {
  const root = document.getElementById('app');
  if (!CONFIGURED) { root.innerHTML = setupScreen(); return; }
  if (state.loading) { root.innerHTML = loadingScreen(); return; }

  const currentView = state.view;
  let body = '';
  if (currentView === 'home') body = homeView();
  else if (currentView === 'activities') body = activitiesView();
  else if (currentView === 'history') body = historyView();
  else if (currentView === 'members') body = membersView();
  else if (currentView === 'admin') body = state.loggedIn ? dashView() : loginView();

  const isPublicPage = currentView === 'home' || currentView === 'activities' || currentView === 'history' || currentView === 'members';

  let html = `<div style="min-height:100vh">` + nav() + body;
  if (isPublicPage) html += footer(); // admin screens (login/dashboard) don't show the public footer
  html += `</div>`;

  // At most one of these is open at a time (each form's own open/close
  // actions and the Escape-key handler in actions.js take care of that), but
  // checking all of them here means render() doesn't need to know which
  // view is currently active.
  if (state.formOpen) html += formModal();
  if (state.memForm.open) html += memberModal();
  if (state.msForm.open) html += milestoneModal();
  if (state.detailOpen) html += detailModal();
  html += errorToast();

  root.innerHTML = html;
}

// Counts this tab once per browser session (sessionStorage survives reloads
// within the same tab, so refreshing doesn't inflate the total) by calling
// increment_site_visit() — a Supabase RPC, not a direct table write, so the
// public anon key can only ever bump the counter by exactly 1 (see
// supabase-setup.sql). Best-effort: failures are swallowed so a visitor never
// sees an error because of this.
function recordVisit() {
  if (sessionStorage.getItem('bhi_visit_counted')) return;
  sessionStorage.setItem('bhi_visit_counted', '1');
  try {
    // sb.rpc(...) returns a "thenable", not a real Promise — it only
    // implements .then(), not .catch(), so the failure handler must be the
    // second .then() argument (calling .catch() on it throws synchronously).
    sb.rpc('increment_site_visit').then(() => {}, () => {});
  } catch (e) {}
}

async function boot() {
  render(); // shows the setup screen or a loading spinner immediately
  if (!sb) return;
  recordVisit();
  try {
    const { data: { session } } = await sb.auth.getSession();
    state.loggedIn = !!session;
    await loadData();
  } catch (e) {
    state.errorMsg = (e && e.message) || String(e);
  } finally {
    state.loading = false;
    render();
  }
}

/* ---- idle auto-logout (admin sessions only) ----
   Plain activity listeners + a slow poll; checkIdle() is a no-op while
   state.loggedIn is false, so this costs nothing for public visitors.
   visibilitychange/focus catch the case where the tab was hidden/asleep for
   the whole 30 minutes, so logout happens the instant the admin comes back
   instead of waiting for the next poll. */
let lastActivityAt = Date.now();
function markActivity() { lastActivityAt = Date.now(); }
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(eventName =>
  document.addEventListener(eventName, markActivity, { passive: true })
);

function checkIdle() {
  if (!state.loggedIn) return;
  if (Date.now() - lastActivityAt < IDLE_LIMIT_MS) return;
  App.autoLogout();
}
setInterval(checkIdle, 30 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkIdle(); });
window.addEventListener('focus', checkIdle);

boot();
