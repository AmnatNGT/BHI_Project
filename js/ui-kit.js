"use strict";
/* ============================================================
   UI KIT — small style helpers + shared fragments (nav, footer, card)
   ============================================================ */

function navTab(on){ return "padding:8px 13px;border:none;background:"+(on?'var(--primary-soft)':'transparent')+";color:"+(on?'var(--primary-strong)':'#3a4d44')+";font-size:14px;font-weight:"+(on?'600':'500')+";cursor:pointer;border-radius:9px"; }
function subTab(on){ return "padding:8px 16px;border:none;background:"+(on?'var(--primary)':'#EAF4EE')+";color:"+(on?'#fff':'#3a4d44')+";font-size:13.5px;font-weight:600;cursor:pointer;border-radius:10px"; }
const PENCIL='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>';
function editBtn(onclick,label){ return `<button class="chip-edit" onclick="${onclick}" title="${attr(label||T.edit)}" style="display:inline-flex;align-items:center;gap:6px;background:#EAF4EE;color:#3a4d44;border:none;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer">${PENCIL}${label?'<span>'+esc(label)+'</span>':''}</button>`; }
function saveBtnEl(onclick){ return `<button onclick="${onclick}" ${state.busy?'disabled':''} style="padding:10px 20px;border:none;border-radius:10px;font-weight:600;font-size:14px;color:#fff;background:${state.busy?'#B9D6C5':'var(--primary)'};cursor:${state.busy?'not-allowed':'pointer'}">${state.busy?T.saving:T.save}</button>`; }
function cancelBtnEl(onclick){ return `<button onclick="${onclick}" style="padding:10px 18px;border:1px solid #D2E5D9;border-radius:10px;font-weight:600;font-size:14px;background:#fff;color:#3a4d44;cursor:pointer">${T.cancel}</button>`; }
function delBtnEl(onclick){ return `<button class="chip-del" onclick="${onclick}" title="${attr(T.delete)}" style="background:transparent;color:#C0392B;border:1px solid #F0D5CF;width:36px;height:36px;border-radius:9px;cursor:pointer;font-size:14px;flex:none">✕</button>`; }
function infoRow(label,val){ return `<div style="padding:11px 0;border-top:1px solid #EFF6F1"><div style="font-size:12px;font-weight:600;color:#8aa093">${esc(label)}</div><div style="font-size:14.5px;color:#1F2D26;margin-top:3px;white-space:pre-wrap;line-height:1.6">${esc(val||'—')}</div></div>`; }

function activityCard(a){
  const has=a.images&&a.images.length>0, n=a.images?a.images.length:0;
  const cover=has?bg(a.images[0]):('background:'+GRADS[a._i%GRADS.length]);
  return `
  <article class="card" onclick="App.openDetail('${a.id}')" style="background:#fff;border:1px solid #DCEBE2;border-radius:18px;overflow:hidden;cursor:pointer;box-shadow:0 1px 2px rgba(30,60,40,.04);transition:transform .25s ease,box-shadow .25s ease;display:flex;flex-direction:column">
    <div style="position:relative;height:200px;background:#E8F2EC;${cover}">
      ${!has?`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="font-family:'IBM Plex Sans Thai',sans-serif;font-weight:700;font-size:30px;color:rgba(255,255,255,.92)">${esc(state.org.short)}</span></div>`:''}
      <span style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,.94);backdrop-filter:blur(4px);padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;color:#3a4d44">${esc(fmtDate(a.date))}</span>
      ${n>1?`<span style="position:absolute;bottom:12px;right:12px;background:rgba(22,46,32,.74);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600">${n} ${T.images}</span>`:''}
    </div>
    <div style="padding:18px 20px 20px;display:flex;flex-direction:column;gap:8px;flex:1">
      <h3 style="font-family:'IBM Plex Sans Thai',sans-serif;font-weight:600;font-size:19px;margin:0;line-height:1.3">${esc(a.title)}</h3>
      <p style="margin:0;font-size:14.5px;line-height:1.65;color:#5b6e63;flex:1">${esc(excerpt(a.desc))}</p>
      <span style="color:var(--primary);font-weight:600;font-size:14px;margin-top:4px">${T.readmore} →</span>
    </div>
  </article>`;
}

function nav(){
  const v=state.view;
  const links = `
        <button onclick="App.goHome()" style="${navTab(v==='home')}">${T.nav_home}</button>
        <button onclick="App.goActivities()" style="${navTab(v==='activities')}">${T.nav_activities}</button>
        <button onclick="App.goHistory()" style="${navTab(v==='history')}">${T.nav_history}</button>
        <button onclick="App.goMembers()" style="${navTab(v==='members')}">${T.nav_members}</button>`;
  const cta = `
        ${v!=='admin'?`<button class="btn-primary" onclick="App.goAdmin()" style="background:var(--primary);color:#fff;padding:9px 16px;border:none;border-radius:10px;font-weight:600;font-size:13.5px;cursor:pointer;white-space:nowrap">${T.admin}</button>`:''}
        ${v==='admin'?`<button onclick="App.goHome()" style="background:transparent;color:var(--primary);padding:8px 13px;border:1px solid var(--primary);border-radius:10px;font-weight:600;font-size:13.5px;cursor:pointer">${T.view_site}</button>`:''}
        ${state.loggedIn?`<button onclick="App.logout()" style="background:transparent;color:#6F8479;padding:8px 12px;border:none;font-size:13.5px;cursor:pointer;text-align:left">${T.logout}</button>`:''}`;
  return `
  <header style="position:sticky;top:0;z-index:50;background:rgba(243,249,245,.85);backdrop-filter:blur(12px);border-bottom:1px solid #DCEBE2">
    <div class="nav-wrap" style="max-width:1180px;margin:0 auto;padding:13px 24px;display:flex;align-items:center;gap:16px">
      <div onclick="App.goHome()" style="display:flex;align-items:center;gap:11px;cursor:pointer;min-width:0">
        <div style="width:42px;height:42px;border-radius:13px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans Thai',sans-serif;font-weight:700;font-size:17px;letter-spacing:.5px;box-shadow:0 6px 16px -6px var(--primary);flex:none">${esc(state.org.short)}</div>
        <div style="min-width:0">
          <div style="font-family:'IBM Plex Sans Thai',sans-serif;font-weight:600;font-size:15px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(state.org.nameFull.en)}</div>
          <div style="font-size:11px;color:#6F8479;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(state.org.tagline.en)}</div>
        </div>
      </div>
      <nav class="nav-desktop" style="margin-left:auto;display:flex;align-items:center;gap:4px">
        ${links}
        <div style="width:1px;height:22px;background:#DCEBE2;margin:0 6px"></div>
        ${cta}
      </nav>
      <button class="nav-toggle" onclick="App.toggleMenu()" aria-label="Menu">${state.menuOpen?'✕':'☰'}</button>
    </div>
    ${state.menuOpen?`
    <div class="nav-mobile" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px 16px 16px;border-top:1px solid #DCEBE2;background:rgba(243,249,245,.97);animation:fadeIn .2s ease both">
      ${links}
      <div style="height:1px;background:#DCEBE2;margin:6px 0"></div>
      ${cta}
    </div>`:''}
  </header>`;
}

function footer(){
  return `
  <footer style="background:#16291E;color:#D6E5DC;margin-top:30px">
    <div class="footer-grid" style="max-width:1180px;margin:0 auto;padding:48px 24px 30px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:36px">
      <div>
        <div style="display:flex;align-items:center;gap:11px">
          <div style="width:40px;height:40px;border-radius:12px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans Thai',sans-serif;font-weight:700">${esc(state.org.short)}</div>
          <div style="font-family:'IBM Plex Sans Thai',sans-serif;font-weight:600;font-size:16px">${esc(state.org.nameFull.en)}</div>
        </div>
        <p style="color:#9bb3a6;font-size:14px;line-height:1.7;margin:16px 0 0;max-width:340px">${T.footer_about}</p>
      </div>
      <div>
        <div style="font-weight:600;font-size:14px;color:#fff;margin-bottom:14px">${T.footer_contact}</div>
        <div style="color:#9bb3a6;font-size:14px;line-height:1.9">
          <div>${esc(state.org.contact.place)}</div>
          <div>${esc(state.org.contact.email)}</div>
        </div>
      </div>
      <div>
        <div style="font-weight:600;font-size:14px;color:#fff;margin-bottom:14px">${T.footer_explore}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <span onclick="App.goActivities()" style="color:#9bb3a6;font-size:14px;cursor:pointer">${T.nav_activities}</span>
          <span onclick="App.goHistory()" style="color:#9bb3a6;font-size:14px;cursor:pointer">${T.nav_history}</span>
          <span onclick="App.goMembers()" style="color:#9bb3a6;font-size:14px;cursor:pointer">${T.nav_members}</span>
        </div>
      </div>
    </div>
    <div style="border-top:1px solid #2c4636;padding:16px 24px;text-align:center;color:#728a7e;font-size:12.5px">© ${new Date().getFullYear()} ${esc(state.org.nameFull.en)} · ${T.footer_rights}</div>
  </footer>`;
}
