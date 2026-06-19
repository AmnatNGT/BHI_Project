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

async function boot() {
  render(); // shows the setup screen or a loading spinner immediately
  if (!sb) return;
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
boot();
