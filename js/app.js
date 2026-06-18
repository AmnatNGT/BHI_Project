"use strict";
/* ============================================================
   RENDER + BOOTSTRAP
   ============================================================ */

function render(){
  const root=document.getElementById('app');
  if(!CONFIGURED){ root.innerHTML=setupScreen(); return; }
  if(state.loading){ root.innerHTML=loadingScreen(); return; }

  const v=state.view;
  let body='';
  if(v==='home') body=homeView();
  else if(v==='activities') body=activitiesView();
  else if(v==='history') body=historyView();
  else if(v==='members') body=membersView();
  else if(v==='admin') body = state.loggedIn ? dashView() : loginView();

  const isPublic = v==='home'||v==='activities'||v==='history'||v==='members';

  let html = `<div style="min-height:100vh">` + nav() + body;
  if(isPublic) html += footer();
  html += `</div>`;
  if(state.formOpen) html += formModal();
  if(state.memForm.open) html += memberModal();
  if(state.msForm.open) html += milestoneModal();
  if(state.detailOpen) html += detailModal();
  html += errorToast();

  root.innerHTML = html;
}

async function boot(){
  render(); // shows setup screen or loading spinner
  if(!sb) return;
  try{
    const { data:{ session } } = await sb.auth.getSession();
    state.loggedIn = !!session;
    await loadData();
  }catch(e){ state.errorMsg = (e&&e.message)||String(e); }
  finally{ state.loading=false; render(); }
}
boot();
