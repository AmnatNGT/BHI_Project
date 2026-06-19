"use strict";
/* ============================================================
   ACTIONS — the App controller object (all onclick/oninput handlers)
   ============================================================ */

const App = {
  // nav
  toggleMenu(){ state.menuOpen=!state.menuOpen; render(); },
  goHome(){ state.view='home'; state.menuOpen=false; render(); },
  goActivities(){ state.view='activities'; state.menuOpen=false; render(); },
  goHistory(){ state.view='history'; state.menuOpen=false; render(); },
  goMembers(){ state.view='members'; state.menuOpen=false; render(); },
  goAdmin(){ state.view='admin'; state.menuOpen=false; render(); },
  _resetEdit(){ state.edit={ org:false, story:false }; state.snap=null; if(state.memForm) state.memForm.open=false; if(state.msForm) state.msForm.open=false; },
  adminToOrg(){ App._resetEdit(); state.adminTab='org'; render(); },
  adminToActs(){ App._resetEdit(); state.adminTab='activities'; render(); },
  adminToHist(){ App._resetEdit(); state.adminTab='history'; render(); },
  adminToMem(){ App._resetEdit(); state.adminTab='members'; render(); },

  // login (Supabase Auth)
  onLoginInput(el){ state.login[el.dataset.path]=el.value; state.loginErr=false; },
  async onLogin(){
    if(!sb) return;
    const { user, pass } = state.login;
    state.busy=true; render();
    try{
      const { error } = await sb.auth.signInWithPassword({ email:user.trim(), password:pass });
      if(error){ state.loginErr=true; }
      else { state.loggedIn=true; state.loginErr=false; state.login={user:'',pass:''}; await loadData(); }
    }catch(e){ state.loginErr=true; }
    finally{ state.busy=false; render(); }
  },
  onLoginKey(e){ if(e.key==='Enter') App.onLogin(); },
  async logout(){ if(sb) await sb.auth.signOut(); state.loggedIn=false; state.view='home'; state.menuOpen=false; render(); },

  // ---- per-block Edit / Save / Cancel ----
  // organization
  editOrg(){ App._resetEdit(); state.snap=JSON.parse(JSON.stringify(state.org)); state.edit.org=true; render(); },
  cancelOrg(){ if(state.snap) state.org=state.snap; state.snap=null; state.edit.org=false; render(); },
  onOrgField(el){ setPath(state.org, el.dataset.path, el.value); },
  onOrgLogo(el){ const file=(el.files||[])[0]; el.value=''; if(!file) return; state.busy=true; render(); resize(file).then(d=>uploadImage(d,'org')).then(url=>{ state.org.logo=url; }).catch(notifyError).finally(()=>{ state.busy=false; render(); }); },
  async saveOrg(){ if(!sb) return; state.busy=true; render(); try{ const { error }=await sb.from('org').upsert(orgToRow(state.org)); if(error) throw error; state.edit.org=false; state.snap=null; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },

  // activities
  openAdd(){ state.formOpen=true; state.editingId=null; state.form={title:'',desc:'',date:today(),images:[]}; render(); },
  openEdit(id){ const a=state.activities.find(x=>x.id===id); if(!a) return; state.formOpen=true; state.editingId=id; state.form={title:a.title,desc:a.desc,date:a.date,images:(a.images||[]).slice()}; render(); },
  closeForm(){ state.formOpen=false; render(); },
  onFormInput(el){ state.form[el.dataset.path]=el.value; if(el.dataset.path==='title') updateSaveBtn(); },
  removeFormImage(i){ state.form.images=state.form.images.filter((_,idx)=>idx!==i); render(); },
  onPickImages(el){
    const files=Array.from(el.files||[]); el.value='';
    const remaining=30-state.form.images.length; const take=files.slice(0,Math.max(0,remaining));
    Promise.all(take.map(f=>resize(f))).then(urls=>{ state.form.images=state.form.images.concat(urls.filter(Boolean)); render(); });
  },
  async saveActivity(){
    const f=state.form; if(!f.title.trim()||!sb) return;
    state.busy=true; render();
    try{
      const urls=[];
      for(const img of f.images){ urls.push(img.indexOf('data:')===0 ? await uploadImage(img,'activities') : img); }
      if(state.editingId){ const { error }=await sb.from('activities').update({ title:f.title, description:f.desc, date:f.date||null, images:urls }).eq('id',state.editingId); if(error) throw error; }
      else { const { error }=await sb.from('activities').insert({ title:f.title, description:f.desc, date:f.date||today(), images:urls }); if(error) throw error; }
      await loadData(); state.formOpen=false;
    }catch(e){ notifyError(e); }
    finally{ state.busy=false; render(); }
  },
  async deleteActivity(id){ if(!window.confirm(T.confirm_del)) return; try{ const { error }=await sb.from('activities').delete().eq('id',id); if(error) throw error; await loadData(); render(); }catch(e){ notifyError(e); } },

  // team (members) — popup form (add + edit)
  openMemberAdd(){ App._resetEdit(); state.memForm={ open:true, id:null, name:'', role:'', photo:'' }; render(); },
  openMemberEdit(id){ const m=state.members.find(x=>x.id===id); if(!m) return; App._resetEdit(); state.memForm={ open:true, id:m.id, name:m.name, role:m.role, photo:m.photo||'' }; render(); },
  closeMemberForm(){ state.memForm.open=false; render(); },
  onMemForm(el){ state.memForm[el.dataset.path]=el.value; if(el.dataset.path==='name') toggleSave('saveMemBtn', state.memForm.name.trim().length>0); },
  onMemFormPhoto(el){ const file=(el.files||[])[0]; el.value=''; if(!file) return; state.busy=true; render(); resize(file).then(d=>uploadImage(d,'members')).then(url=>{ state.memForm.photo=url; }).catch(notifyError).finally(()=>{ state.busy=false; render(); }); },
  async saveMemberForm(){ const f=state.memForm; if(!sb||!f.name.trim()) return; state.busy=true; render(); try{ if(f.id){ const { error }=await sb.from('members').update({ name:f.name, role:f.role, photo:f.photo }).eq('id',f.id); if(error) throw error; } else { const sort=state.members.length; const { error }=await sb.from('members').insert({ name:f.name, role:f.role, photo:f.photo, sort }); if(error) throw error; } await loadData(); state.memForm.open=false; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },
  async removeMember(id){ if(!window.confirm(T.confirm_del_member)) return; try{ const { error }=await sb.from('members').delete().eq('id',id); if(error) throw error; await loadData(); render(); }catch(e){ notifyError(e); } },

  // our story — story block + per-milestone edit
  editStory(){ App._resetEdit(); state.snap={ story:(state.org.history&&state.org.history.story)||'' }; state.edit.story=true; render(); },
  cancelStory(){ if(state.snap){ if(!state.org.history) state.org.history={}; state.org.history.story=state.snap.story; } state.snap=null; state.edit.story=false; render(); },
  onStoryField(el){ setPath(state.org, el.dataset.path, el.value); },
  async saveStory(){ if(!sb) return; state.busy=true; render(); try{ const { error }=await sb.from('org').upsert(orgToRow(state.org)); if(error) throw error; state.edit.story=false; state.snap=null; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },
  // milestones — popup form (add + edit)
  openMilestoneAdd(){ App._resetEdit(); state.msForm={ open:true, id:null, year:'', title:'', desc:'' }; render(); },
  openMilestoneEdit(id){ const m=state.milestones.find(x=>x.id===id); if(!m) return; App._resetEdit(); state.msForm={ open:true, id:m.id, year:m.year, title:m.title, desc:m.desc }; render(); },
  closeMilestoneForm(){ state.msForm.open=false; render(); },
  onMsForm(el){ state.msForm[el.dataset.path]=el.value; if(el.dataset.path==='title') toggleSave('saveMsBtn', state.msForm.title.trim().length>0); },
  async saveMilestoneForm(){ const f=state.msForm; if(!sb||!f.title.trim()) return; state.busy=true; render(); try{ if(f.id){ const { error }=await sb.from('milestones').update({ year:f.year, title:f.title, description:f.desc }).eq('id',f.id); if(error) throw error; } else { const sort=state.milestones.length; const { error }=await sb.from('milestones').insert({ year:f.year, title:f.title, description:f.desc, sort }); if(error) throw error; } await loadData(); state.msForm.open=false; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },
  async removeMilestone(id){ if(!window.confirm(T.confirm_del_ms)) return; try{ const { error }=await sb.from('milestones').delete().eq('id',id); if(error) throw error; await loadData(); render(); }catch(e){ notifyError(e); } },

  // detail
  openDetail(id){ state.detailOpen=true; state.detailId=id; state.di=0; render(); },
  closeDetail(){ state.detailOpen=false; render(); },
  detailPrev(){ const a=state.activities.find(x=>x.id===state.detailId); const n=a&&a.images?a.images.length:0; if(n<2) return; state.di=(state.di-1+n)%n; refreshDetailImage(); },
  detailNext(){ const a=state.activities.find(x=>x.id===state.detailId); const n=a&&a.images?a.images.length:0; if(n<2) return; state.di=(state.di+1)%n; refreshDetailImage(); },
  detailGo(i){ state.di=i; refreshDetailImage(); },
  dismissError(){ state.errorMsg=''; render(); }
};

function updateSaveBtn(){
  const btn=document.getElementById('saveActivityBtn'); if(!btn) return;
  const valid=state.form.title.trim().length>0;
  btn.disabled=!valid;
  btn.style.background=valid?'var(--primary)':'#B9D6C5';
  btn.style.cursor=valid?'pointer':'not-allowed';
}
function toggleSave(id, valid){ const b=document.getElementById(id); if(!b) return; b.disabled=!valid; b.style.background=valid?'var(--primary)':'#B9D6C5'; b.style.cursor=valid?'pointer':'not-allowed'; }
function modalSaveStyle(valid){ const on=valid&&!state.busy; return "padding:12px 26px;border:none;border-radius:12px;font-weight:600;font-size:14.5px;color:#fff;background:"+(on?'var(--primary)':'#B9D6C5')+";cursor:"+(on?'pointer':'not-allowed'); }
