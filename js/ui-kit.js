"use strict";
/* ============================================================
   UI KIT — small style helpers + shared fragments (nav, footer, card)
   ============================================================ */

function navTab(on){ return "padding:8px 13px;border:none;background:"+(on?'rgba(255,255,255,.14)':'transparent')+";color:"+(on?'#fff':'rgba(255,255,255,.88)')+";font-size:14px;font-weight:"+(on?'600':'500')+";cursor:pointer;border-radius:9px;font:inherit"+(on?';box-shadow:inset 0 -2px 0 var(--gold)':''); }
function subTab(on){ return "padding:8px 16px;border:none;background:"+(on?'var(--primary)':'#EAF4EE')+";color:"+(on?'#fff':'#3a4d44')+";font-size:13.5px;font-weight:600;cursor:pointer;border-radius:10px;font:inherit"; }
const PENCIL='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg>';
function kicker(label){ return `<div style="display:flex;align-items:center;gap:9px;color:var(--primary);font-weight:600;font-size:13px;letter-spacing:.5px;text-transform:uppercase;font-family:var(--font-ui)"><span style="width:22px;height:2px;background:var(--gold);border-radius:2px;flex:none"></span>${esc(label)}</div>`; }
function editBtn(onclick,label){ return `<button class="chip-edit" onclick="${onclick}" title="${attr(label||T.edit)}" aria-label="${attr(label||T.edit)}" style="display:inline-flex;align-items:center;gap:6px;background:#EAF4EE;color:#3a4d44;border:none;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font:inherit">${PENCIL}${label?'<span>'+esc(label)+'</span>':''}</button>`; }
function saveBtnEl(onclick){ return `<button onclick="${onclick}" ${state.busy?'disabled':''} style="padding:10px 20px;border:none;border-radius:10px;font-weight:600;font-size:14px;color:#fff;background:${state.busy?'#B9D6C5':'var(--primary)'};cursor:${state.busy?'not-allowed':'pointer'}">${state.busy?T.saving:T.save}</button>`; }
function cancelBtnEl(onclick){ return `<button onclick="${onclick}" style="padding:10px 18px;border:1px solid #D2E5D9;border-radius:10px;font-weight:600;font-size:14px;background:#fff;color:#3a4d44;cursor:pointer">${T.cancel}</button>`; }
function delBtnEl(onclick,label){ return `<button class="chip-del" onclick="${onclick}" title="${attr(label||T.delete)}" aria-label="${attr(label||T.delete)}" style="background:transparent;color:#C0392B;border:1px solid #F0D5CF;width:36px;height:36px;border-radius:9px;cursor:pointer;font-size:14px;flex:none">✕</button>`; }
function infoRow(label,val){ return `<div style="padding:11px 0;border-top:1px solid #EFF6F1"><div style="font-size:12px;font-weight:600;color:var(--muted)">${esc(label)}</div><div style="font-size:14.5px;color:var(--ink);margin-top:3px;white-space:pre-wrap;line-height:1.6">${esc(val||'—')}</div></div>`; }
function modalError(){ return state.errorMsg ? `<div role="alert" style="background:#FBEAE7;color:#C0392B;padding:11px 14px;border-radius:10px;font-size:13.5px;margin-bottom:18px;line-height:1.5">${esc(state.errorMsg)}</div>` : ''; }

function brandMark(size, radius, fontSize){
  const has=!!state.org.logo;
  const cover=has?bg(state.org.logo):'background:linear-gradient(135deg,var(--primary),var(--primary-strong))';
  const a11y = has ? `role="img" aria-label="${attr(state.org.nameFull.en)} logo"` : 'aria-hidden="true"';
  return `<div ${a11y} style="width:${size}px;height:${size}px;border-radius:${radius}px;color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-ui);font-weight:700;font-size:${fontSize}px;letter-spacing:.5px;box-shadow:0 6px 16px -6px rgba(16,36,26,.5);flex:none;${cover}">${!has?esc(state.org.short):''}</div>`;
}

function activityCard(a){
  const has=a.images&&a.images.length>0, n=a.images?a.images.length:0;
  const cover=has?bg(a.images[0]):('background:'+GRADS[a._i%GRADS.length]);
  const imgA11y = has ? `role="img" aria-label="${attr(a.title)}"` : 'aria-hidden="true"';
  return `
  <article class="card" onclick="App.openDetail('${a.id}')" role="button" tabindex="0" aria-label="${attr(T.readmore+': '+a.title)}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();App.openDetail('${a.id}')}" style="background:#fff;border:1px solid #DCEBE2;border-radius:18px;overflow:hidden;cursor:pointer;box-shadow:var(--shadow-sm);transition:transform .25s ease,box-shadow .25s ease;display:flex;flex-direction:column">
    <div ${imgA11y} style="position:relative;height:200px;background:#E8F2EC;${cover}">
      ${!has?`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="font-family:var(--font-ui);font-weight:700;font-size:30px;color:rgba(255,255,255,.92)">${esc(state.org.short)}</span></div>`:''}
      <span style="position:absolute;top:12px;left:12px;background:rgba(255,255,255,.94);backdrop-filter:blur(4px);padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;color:#3a4d44">${esc(fmtDate(a.date))}</span>
      ${n>1?`<span style="position:absolute;bottom:12px;right:12px;background:rgba(16,36,26,.74);color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600">${n} ${T.images}</span>`:''}
    </div>
    <div style="padding:18px 20px 20px;display:flex;flex-direction:column;gap:8px;flex:1">
      <h3 style="font-family:var(--font-display);font-weight:600;font-size:20px;margin:0;line-height:1.3;color:var(--ink)">${esc(a.title)}</h3>
      <p style="margin:0;font-size:14.5px;line-height:1.65;color:var(--ink-soft);flex:1">${esc(excerpt(a.desc))}</p>
      <span aria-hidden="true" style="color:var(--primary);font-weight:600;font-size:14px;margin-top:4px">${T.readmore} <span class="read-more-arrow">→</span></span>
    </div>
  </article>`;
}

function nav(){
  const v=state.view;
  const links = `
        <button onclick="App.goHome()" aria-current="${v==='home'?'page':'false'}" style="${navTab(v==='home')}">${T.nav_home}</button>
        <button onclick="App.goActivities()" aria-current="${v==='activities'?'page':'false'}" style="${navTab(v==='activities')}">${T.nav_activities}</button>
        <button onclick="App.goHistory()" aria-current="${v==='history'?'page':'false'}" style="${navTab(v==='history')}">${T.nav_history}</button>
        <button onclick="App.goMembers()" aria-current="${v==='members'?'page':'false'}" style="${navTab(v==='members')}">${T.nav_members}</button>`;
  const cta = `
        <button class="btn-admin-cta" onclick="App.goAdmin()" style="background:#fff;color:var(--primary-strong);padding:9px 16px;border:none;border-radius:10px;font-weight:600;font-size:13.5px;cursor:pointer;white-space:nowrap">${T.admin}</button>
        ${state.loggedIn?`<button onclick="App.logout()" style="background:transparent;color:var(--on-dark-muted);padding:8px 12px;border:none;font-size:13.5px;cursor:pointer;text-align:center;font:inherit">${T.logout}</button>`:''}`;
  return `
  <header style="position:sticky;top:0;z-index:50;background:var(--brand-gradient-scrim);border-bottom:2px solid var(--gold)">
    <div class="nav-wrap" style="max-width:1180px;margin:0 auto;padding:13px 24px;display:flex;align-items:center;gap:16px">
      <button type="button" class="link-btn" onclick="App.goHome()" aria-label="${attr(state.org.nameFull.en)} — ${T.nav_home}" style="display:flex;align-items:center;gap:11px;min-width:0">
        ${brandMark(42,13,17)}
        <span style="min-width:0">
          <span style="display:block;font-family:var(--font-ui);font-weight:600;font-size:15px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff">${esc(state.org.nameFull.en)}</span>
          <span style="display:block;font-size:11px;color:var(--on-dark-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(state.org.tagline.en)}</span>
        </span>
      </button>
      <nav class="nav-desktop" aria-label="Primary" style="margin-left:auto;display:flex;align-items:center;gap:4px">
        ${links}
        <div style="width:1px;height:22px;background:rgba(255,255,255,.2);margin:0 6px"></div>
        ${cta}
      </nav>
      <button class="nav-toggle" onclick="App.toggleMenu()" aria-label="${state.menuOpen?'Close menu':'Open menu'}" aria-expanded="${state.menuOpen}" aria-controls="mobile-nav">${state.menuOpen?'✕':'☰'}</button>
    </div>
    ${state.menuOpen?`
    <div class="nav-mobile" id="mobile-nav" role="navigation" aria-label="Mobile" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px 16px 16px;border-top:1px solid rgba(255,255,255,.14);background:var(--brand-gradient-scrim);animation:fadeIn .2s ease both">
      ${links}
      <div style="height:1px;background:rgba(255,255,255,.14);margin:6px 0"></div>
      ${cta}
    </div>`:''}
  </header>`;
}

function footer(){
  const flink=(label,onclick)=>`<button type="button" class="link-btn" onclick="${onclick}" style="color:var(--on-dark-muted);font-size:12.5px">${esc(label)}</button>`;
  return `
  <footer style="background:var(--brand-gradient-scrim);border-top:2px solid var(--gold);color:#D6E5DC;margin-top:30px">
    <div class="footer-grid" style="max-width:1180px;margin:0 auto;padding:22px 24px 12px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:36px">
      <div>
        <div style="display:flex;align-items:center;gap:11px">
          ${brandMark(40,12,16)}
          <div>
            <div style="font-family:var(--font-ui);font-weight:600;font-size:14px;color:#fff">${esc(state.org.nameFull.en)}</div>
            <div style="font-size:11px;color:var(--on-dark-muted);margin-top:1px">${esc(state.org.tagline.en)}</div>
          </div>
        </div>
      </div>
      <div>
        <div style="font-weight:600;font-size:12.5px;color:#fff;margin-bottom:12px">${T.footer_contact}</div>
        <div style="color:var(--on-dark-muted);font-size:12.5px;line-height:1.8">
          <div>${esc(state.org.contact.place)}</div>
          <div>${esc(state.org.contact.email)}</div>
        </div>
      </div>
      <nav aria-label="Footer">
        <div style="font-weight:600;font-size:12.5px;color:#fff;margin-bottom:12px">${T.footer_explore}</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${flink(T.nav_activities,'App.goActivities()')}
          ${flink(T.nav_history,'App.goHistory()')}
          ${flink(T.nav_members,'App.goMembers()')}
        </div>
      </nav>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.16);padding:10px 24px;text-align:center;color:var(--on-dark-muted);font-size:11px">© ${new Date().getFullYear()} ${esc(state.org.nameFull.en)} · ${T.footer_rights}</div>
  </footer>`;
}
