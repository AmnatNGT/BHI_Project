"use strict";
/* ============================================================
   ADMIN VIEWS — login screen + dashboard (org / activities / story / team)
   ============================================================ */

function loginView(){
  return `
  <section id="main-content" tabindex="-1" style="outline:none;position:relative;min-height:calc(100vh - 70px);display:flex;align-items:center;justify-content:center;padding:40px 24px;overflow:hidden">
    <div class="hero-glow" aria-hidden="true"></div>
    <div style="position:relative;background:#fff;width:100%;max-width:408px;border-radius:22px;padding:38px 34px;border:1px solid #DCEBE2;box-shadow:var(--shadow-lg);animation:pop .45s ease both">
      <div aria-hidden="true" style="width:54px;height:54px;border-radius:16px;background:var(--primary-soft);display:flex;align-items:center;justify-content:center;margin-bottom:18px">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <h2 style="font-family:var(--font-display);font-weight:600;font-size:25px;margin:0;color:var(--ink)">${T.login_title}</h2>
      <p style="color:var(--muted);font-size:14px;margin:7px 0 24px">${T.login_sub}</p>
      <div style="margin-bottom:14px">
        <label for="login-user" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.login_user}</label>
        <input id="login-user" class="field" type="email" value="${attr(state.login.user)}" data-path="user" oninput="App.onLoginInput(this)" autocomplete="username" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:14.5px;background:#F7FBF9;color:#1F2D26;outline:none">
      </div>
      <div style="margin-bottom:6px">
        <label for="login-pass" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.login_pass}</label>
        <input id="login-pass" class="field" type="password" value="${attr(state.login.pass)}" data-path="pass" oninput="App.onLoginInput(this)" onkeydown="App.onLoginKey(event)" autocomplete="current-password" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:14.5px;background:#F7FBF9;color:#1F2D26;outline:none">
      </div>
      ${state.loginErr?`<div role="alert" style="color:#C0392B;font-size:13px;margin:10px 0 0">${T.login_err}</div>`:''}
      <button id="login-btn" class="btn-primary" type="button" onclick="App.onLogin()" ${state.busy?'disabled':''} style="width:100%;margin-top:20px;background:var(--primary);color:#fff;padding:13px;border:none;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer">${state.busy?T.loading:T.login_btn}</button>
      <div style="margin-top:16px;padding:10px 12px;background:#EAF4EE;border-radius:10px;color:var(--muted);font-size:12.5px;text-align:center">${T.login_hint}</div>
    </div>
  </section>`;
}

function dashView(){
  const tab=state.adminTab;
  const sorted=sortedActivities(); sorted.forEach((a,i)=>a._i=i);

  const o=state.org;
  const orgPanel = state.edit.org ? `
    <div style="background:#fff;border:1px solid #DCEBE2;border-radius:18px;padding:26px;max-width:620px;animation:fadeIn .2s ease both">
      <h3 style="font-family:var(--font-display);font-weight:600;font-size:19px;margin:0 0 20px;color:var(--ink)">${T.dash_orginfo}</h3>
      <div style="margin-bottom:16px">
        <span id="org-logo-label" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.org_logo}</span>
        <div style="display:flex;align-items:center;gap:14px">
          <label style="width:64px;height:64px;border-radius:14px;flex:none;cursor:pointer;${o.logo?bg(o.logo):'background:linear-gradient(135deg,var(--primary),var(--primary-strong))'};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
            ${!o.logo?`<span aria-hidden="true" style="font-family:var(--font-ui);font-weight:700;font-size:18px;color:rgba(255,255,255,.92)">${esc(o.short)}</span>`:''}
            <span aria-hidden="true" style="position:absolute;bottom:0;left:0;right:0;background:rgba(16,36,26,.55);color:#fff;font-size:9px;text-align:center;padding:2px">${T.mb_photo}</span>
            <input type="file" accept="image/*" onchange="App.onOrgLogo(this)" aria-labelledby="org-logo-label" style="position:absolute;width:1px;height:1px;opacity:0">
          </label>
          <div>
            <span style="font-size:12.5px;color:var(--muted)">${T.org_logo_hint}</span>
            ${o.logo?`<div style="margin-top:6px"><button onclick="App.removeOrgLogo()" style="background:transparent;color:#C0392B;border:1px solid #F0D5CF;padding:5px 11px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer">${T.org_logo_remove}</button></div>`:''}
          </div>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <label for="org-short" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.org_short}</label>
        <input id="org-short" class="field" value="${attr(o.short)}" data-path="short" oninput="App.onOrgField(this)" maxlength="4" style="width:120px;padding:10px 12px;border:1px solid #D2E5D9;border-radius:10px;font-size:14px;background:#F7FBF9;outline:none">
        <div style="font-size:11.5px;color:var(--muted);margin-top:6px">${T.org_short_hint}</div>
      </div>
      <div style="margin-bottom:16px">
        <label for="org-namefull" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.org_namefull}</label>
        <input id="org-namefull" class="field" value="${attr(o.nameFull.en)}" data-path="nameFull.en" oninput="App.onOrgField(this)" style="width:100%;padding:10px 12px;border:1px solid #D2E5D9;border-radius:10px;font-size:14px;background:#F7FBF9;outline:none">
      </div>
      <div style="margin-bottom:16px">
        <label for="org-tagline" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.org_tagline}</label>
        <input id="org-tagline" class="field" value="${attr(o.tagline.en)}" data-path="tagline.en" oninput="App.onOrgField(this)" style="width:100%;padding:10px 12px;border:1px solid #D2E5D9;border-radius:10px;font-size:14px;background:#F7FBF9;outline:none">
      </div>
      <div style="margin-bottom:16px">
        <label for="org-about" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.org_about}</label>
        <textarea id="org-about" class="field" data-path="about.en" oninput="App.onOrgField(this)" rows="4" style="width:100%;padding:10px 12px;border:1px solid #D2E5D9;border-radius:10px;font-size:14px;background:#F7FBF9;outline:none;line-height:1.6">${esc(o.about.en)}</textarea>
      </div>
      <label for="org-place" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:6px 0 6px">${T.org_contact}</label>
      <input id="org-place" class="field" value="${attr(o.contact.place)}" data-path="contact.place" oninput="App.onOrgField(this)" placeholder="${attr(T.c_place)}" style="width:100%;padding:10px 12px;border:1px solid #D2E5D9;border-radius:10px;font-size:14px;background:#F7FBF9;outline:none;margin-bottom:10px">
      <label for="org-email" style="display:block;font-size:0;margin:0">${T.c_email}</label>
      <input id="org-email" class="field" type="email" value="${attr(o.contact.email)}" data-path="contact.email" oninput="App.onOrgField(this)" placeholder="${attr(T.c_email)}" style="width:100%;padding:10px 12px;border:1px solid #D2E5D9;border-radius:10px;font-size:14px;background:#F7FBF9;outline:none">
      <div style="display:flex;gap:10px;margin-top:22px">${saveBtnEl('App.saveOrg()')}${cancelBtnEl('App.cancelOrg()')}</div>
    </div>`
  : `
    <div style="background:#fff;border:1px solid #DCEBE2;border-radius:18px;padding:26px;max-width:620px;animation:fadeIn .2s ease both">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:4px">
        <h3 style="font-family:var(--font-display);font-weight:600;font-size:19px;margin:0;color:var(--ink)">${T.dash_orginfo}</h3>
        ${editBtn('App.editOrg()', T.edit)}
      </div>
      <div style="padding:11px 0;border-top:1px solid #EFF6F1;display:flex;align-items:center;gap:14px">
        <div style="font-size:12px;font-weight:600;color:var(--muted);flex:none">${T.org_logo}</div>
        <div role="img" aria-label="${o.logo?attr(o.nameFull.en)+' logo':'No logo set'}" style="width:48px;height:48px;border-radius:12px;flex:none;${o.logo?bg(o.logo):'background:linear-gradient(135deg,var(--primary),var(--primary-strong))'};display:flex;align-items:center;justify-content:center">
          ${!o.logo?`<span aria-hidden="true" style="font-family:var(--font-ui);font-weight:700;font-size:14px;color:rgba(255,255,255,.92)">${esc(o.short)}</span>`:''}
        </div>
      </div>
      ${infoRow(T.org_short, o.short)}
      ${infoRow(T.org_namefull, o.nameFull.en)}
      ${infoRow(T.org_tagline, o.tagline.en)}
      ${infoRow(T.org_about, o.about.en)}
      ${infoRow(T.c_place, o.contact.place)}
      ${infoRow(T.c_email, o.contact.email)}
    </div>`;

  const actRow=(a)=>{
    const has=a.images&&a.images.length>0, n=a.images?a.images.length:0;
    const cover=has?bg(a.images[0]):('background:'+GRADS[a._i%GRADS.length]);
    const imgA11y = has ? `role="img" aria-label="${attr(a.title)}"` : 'aria-hidden="true"';
    return `
    <div style="display:flex;gap:14px;align-items:center;padding:12px;border:1px solid #DCEBE2;border-radius:14px;background:#fff">
      <div ${imgA11y} style="width:62px;height:62px;border-radius:11px;overflow:hidden;flex:none;background:#E8F2EC;${cover}"></div>
      <div style="flex:1;min-width:0">
        <div style="font-family:var(--font-display);font-weight:600;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)">${esc(a.title)}</div>
        <div style="font-size:12.5px;color:var(--muted);margin-top:3px">${esc(fmtDate(a.date))} · ${n} ${T.images}</div>
      </div>
      <div style="display:flex;gap:8px;flex:none">
        <button class="chip-edit" onclick="App.openEdit('${a.id}')" style="background:#EAF4EE;color:#3a4d44;border:none;padding:8px 13px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer">${T.edit}</button>
        <button class="chip-del" onclick="App.deleteActivity('${a.id}')" style="background:transparent;color:#C0392B;border:1px solid #F0D5CF;padding:8px 12px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer">${T.delete}</button>
      </div>
    </div>`;
  };
  const actsPanel=`
    <div style="animation:fadeIn .2s ease both">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h3 style="font-family:var(--font-display);font-weight:600;font-size:19px;margin:0;color:var(--ink)">${T.dash_actmgr}</h3>
        <button class="btn-primary" onclick="App.openAdd()" style="background:var(--primary);color:#fff;padding:10px 17px;border:none;border-radius:11px;font-weight:600;font-size:14px;cursor:pointer">＋ ${T.add_activity}</button>
      </div>
      ${sorted.length?`<div style="display:flex;flex-direction:column;gap:11px">${sorted.map(actRow).join('')}</div>`
        :`<div style="text-align:center;padding:54px 20px;background:#fff;border:1px dashed #CFE5D8;border-radius:16px;color:var(--muted);font-size:14.5px">${T.empty_admin}</div>`}
    </div>`;

  const story=(state.org.history&&state.org.history.story)||'';
  const storyBlock = state.edit.story ? `
      <div style="background:#fff;border:1px solid #DCEBE2;border-radius:18px;padding:24px;max-width:760px;margin-bottom:22px">
        <label for="org-story" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 8px">${T.hist_story}</label>
        <textarea id="org-story" class="field" data-path="history.story" oninput="App.onStoryField(this)" rows="6" style="width:100%;padding:12px 14px;border:1px solid #D2E5D9;border-radius:12px;font-size:14.5px;background:#F7FBF9;outline:none;line-height:1.7">${esc(story)}</textarea>
        <div style="display:flex;gap:10px;margin-top:14px">${saveBtnEl('App.saveStory()')}${cancelBtnEl('App.cancelStory()')}</div>
      </div>`
    : `
      <div style="background:#fff;border:1px solid #DCEBE2;border-radius:18px;padding:24px;max-width:760px;margin-bottom:22px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px">
          <span style="font-size:12.5px;font-weight:600;color:var(--muted)">${T.hist_story}</span>
          ${editBtn('App.editStory()', T.edit)}
        </div>
        <p style="margin:0;font-size:14.5px;line-height:1.7;color:var(--ink-soft);white-space:pre-wrap">${esc(story||'—')}</p>
      </div>`;
  const msBlock = state.milestones.map((m)=> `
          <div class="ms-row" style="background:#fff;border:1px solid #DCEBE2;border-radius:14px;padding:14px;display:grid;grid-template-columns:96px 1fr auto;gap:12px;align-items:center;max-width:760px">
            <div style="font-family:var(--font-display);font-weight:600;font-size:19px;color:var(--primary)">${esc(m.year||'—')}</div>
            <div style="min-width:0">
              <div style="font-weight:600;font-size:15px;color:var(--ink)">${esc(m.title||'—')}</div>
              <p style="margin:4px 0 0;font-size:13.5px;line-height:1.6;color:var(--ink-soft)">${esc(m.desc)}</p>
            </div>
            <div style="display:flex;gap:8px;flex:none">${editBtn("App.openMilestoneEdit('"+m.id+"')")}${delBtnEl("App.removeMilestone('"+m.id+"')")}</div>
          </div>`).join('');
  const histPanel=`
    <div style="animation:fadeIn .2s ease both">
      ${storyBlock}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;max-width:760px">
        <h3 style="font-family:var(--font-display);font-weight:600;font-size:19px;margin:0;color:var(--ink)">${T.timeline_title}</h3>
        <button class="btn-primary" onclick="App.openMilestoneAdd()" style="background:var(--primary);color:#fff;padding:9px 15px;border:none;border-radius:10px;font-weight:600;font-size:13.5px;cursor:pointer">＋ ${T.m_add}</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:11px">
        ${msBlock}
      </div>
    </div>`;

  const memPanel=`
    <div style="animation:fadeIn .2s ease both">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <h3 style="font-family:var(--font-display);font-weight:600;font-size:19px;margin:0;color:var(--ink)">${T.dash_memmgr}</h3>
        <button class="btn-primary" onclick="App.openMemberAdd()" style="background:var(--primary);color:#fff;padding:10px 17px;border:none;border-radius:11px;font-weight:600;font-size:14px;cursor:pointer">＋ ${T.mb_add}</button>
      </div>
      <p style="color:var(--muted);font-size:12.5px;margin:0 0 16px">Drag the handle to reorder, or focus it and use ↑ / ↓.</p>
      <div class="mem-list" style="display:flex;flex-direction:column;gap:12px">
        ${state.members.map((m,i)=>{
          const has=!!m.photo; const av=has?bg(m.photo):('background:'+GRADS[i%GRADS.length]);
          const imgA11y = has ? `role="img" aria-label="${attr(m.name)}"` : 'aria-hidden="true"';
          return `
          <div class="mem-row" data-id="${m.id}" style="background:#fff;border:1px solid #DCEBE2;border-radius:16px;padding:16px;display:flex;gap:12px;align-items:center">
            <div class="drag-handle" tabindex="0" role="button" aria-label="Move ${attr(m.name||T.mb_name)} — use arrow up or arrow down" onpointerdown="App.memDragStart(event,'${m.id}')" onkeydown="App.memKeyMove(event,'${m.id}')" style="flex:none;width:26px;height:40px;display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;color:#B7CCBE;font-size:18px;user-select:none;border-radius:8px">⠿</div>
            <div aria-hidden="true" style="flex:none;width:30px;height:30px;border-radius:9px;background:var(--primary-soft);color:var(--primary-strong);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700">${(m.sort||0)+1}</div>
            <div ${imgA11y} style="width:72px;height:72px;border-radius:14px;flex:none;background:#E8F2EC;${av};display:flex;align-items:center;justify-content:center;overflow:hidden">
              ${!has?`<span aria-hidden="true" style="font-family:var(--font-ui);font-weight:700;font-size:24px;color:rgba(255,255,255,.92)">${esc(initials(m.name))}</span>`:''}
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-family:var(--font-display);font-weight:600;font-size:17px;color:var(--ink)">${esc(m.name||'—')}</div>
              <div style="color:var(--primary);font-weight:600;font-size:13.5px;margin-top:2px">${esc(m.role)}</div>
            </div>
            <div style="display:flex;gap:8px;flex:none">${editBtn("App.openMemberEdit('"+m.id+"')")}${delBtnEl("App.removeMember('"+m.id+"')")}</div>
          </div>`;
        }).join('')}
      </div>
      ${!state.members.length?`<div style="text-align:center;padding:40px 20px;background:#fff;border:1px dashed #CFE5D8;border-radius:16px;color:var(--muted);font-size:14px;margin-top:12px">${T.empty_members_admin}</div>`:''}
    </div>`;

  let panel='';
  if(tab==='org') panel=orgPanel;
  else if(tab==='activities') panel=actsPanel;
  else if(tab==='history') panel=histPanel;
  else if(tab==='members') panel=memPanel;

  return `
  <section id="main-content" tabindex="-1" style="outline:none;max-width:1140px;margin:0 auto;padding:34px 24px 90px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px">
      <div>
        <h1 style="font-family:var(--font-display);font-weight:600;font-size:29px;margin:0;color:var(--ink)">${T.dash_title}</h1>
        <p style="color:var(--muted);font-size:14px;margin:5px 0 0">${esc(state.org.nameFull.en)}</p>
      </div>
      ${state.orgSaved?`<span role="status" style="display:inline-flex;align-items:center;gap:7px;background:#DBF0E4;color:#27704a;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;animation:fadeIn .2s ease both">✓ ${T.saved}</span>`:''}
    </div>
    <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;border-bottom:1px solid #DCEBE2;padding-bottom:16px">
      <button onclick="App.adminToOrg()" aria-current="${tab==='org'?'page':'false'}" style="${subTab(tab==='org')}">${T.at_org}</button>
      <button onclick="App.adminToActs()" aria-current="${tab==='activities'?'page':'false'}" style="${subTab(tab==='activities')}">${T.at_act}</button>
      <button onclick="App.adminToHist()" aria-current="${tab==='history'?'page':'false'}" style="${subTab(tab==='history')}">${T.at_hist}</button>
      <button onclick="App.adminToMem()" aria-current="${tab==='members'?'page':'false'}" style="${subTab(tab==='members')}">${T.at_mem}</button>
    </div>
    ${panel}
  </section>`;
}
