"use strict";
/* ============================================================
   ACTIONS — the App controller object (all onclick/oninput handlers)
   ============================================================ */

let dragCtx = null;

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
    state.busy=true;
    const btn=document.getElementById('login-btn');
    if(btn){ btn.disabled=true; btn.textContent=T.loading; }
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
  removeOrgLogo(){ state.org.logo=''; render(); },
  async saveOrg(){ if(!sb) return; state.busy=true; render(); try{ const { error }=await sb.from('org').upsert(orgToRow(state.org)); if(error) throw error; state.edit.org=false; state.snap=null; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },

  // activities
  openAdd(){ state.errorMsg=''; state.formOpen=true; state.editingId=null; state.form={title:'',desc:'',date:today(),images:[]}; render(); },
  openEdit(id){ const a=state.activities.find(x=>x.id===id); if(!a) return; state.errorMsg=''; state.formOpen=true; state.editingId=id; state.form={title:a.title,desc:a.desc,date:a.date,images:(a.images||[]).slice()}; render(); },
  closeForm(){ state.formOpen=false; render(); },
  onFormInput(el){ state.form[el.dataset.path]=el.value; if(el.dataset.path==='title'||el.dataset.path==='date') updateSaveBtn(); },
  removeFormImage(i){ state.form.images=state.form.images.filter((_,idx)=>idx!==i); render(); },
  onPickImages(el){
    const files=Array.from(el.files||[]); el.value='';
    const remaining=30-state.form.images.length; const take=files.slice(0,Math.max(0,remaining));
    Promise.all(take.map(f=>resize(f))).then(urls=>{ state.form.images=state.form.images.concat(urls.filter(Boolean)); render(); });
  },
  async saveActivity(){
    const f=state.form; if(!f.title.trim()||!f.date.trim()||!sb) return;
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
  openMemberAdd(){ App._resetEdit(); state.errorMsg=''; state.memForm={ open:true, id:null, name:'', role:'', photo:'', sort:state.members.length+1 }; render(); },
  openMemberEdit(id){ const m=state.members.find(x=>x.id===id); if(!m) return; App._resetEdit(); state.errorMsg=''; state.memForm={ open:true, id:m.id, name:m.name, role:m.role, photo:m.photo||'', sort:(m.sort||0)+1 }; render(); },
  closeMemberForm(){ state.memForm.open=false; render(); },
  onMemForm(el){ state.memForm[el.dataset.path]=el.value; const f=state.memForm; toggleSave('saveMemBtn', f.name.trim().length>0 && f.role.trim().length>0 && String(f.sort).trim().length>0); },
  onMemFormPhoto(el){ const file=(el.files||[])[0]; el.value=''; if(!file) return; state.busy=true; render(); resize(file).then(d=>uploadImage(d,'members')).then(url=>{ state.memForm.photo=url; }).catch(notifyError).finally(()=>{ state.busy=false; render(); }); },
  async saveMemberForm(){
    const f=state.memForm; if(!sb||!f.name.trim()||!f.role.trim()||!String(f.sort).trim()) return;
    state.busy=true; render();
    try{
      const sort=Math.max(1,parseInt(f.sort,10)||1)-1;
      if(f.id){
        const { error }=await sb.from('members').update({ name:f.name, role:f.role, photo:f.photo, sort }).eq('id',f.id);
        if(error) throw error;
      } else {
        const { error }=await sb.from('members').insert({ name:f.name, role:f.role, photo:f.photo, sort });
        if(error) throw error;
      }
      await loadData(); state.memForm.open=false; flashSaved();
    }catch(e){ notifyError(e); } finally{ state.busy=false; render(); }
  },
  async removeMember(id){ if(!window.confirm(T.confirm_del_member)) return; try{ const { error }=await sb.from('members').delete().eq('id',id); if(error) throw error; await loadData(); render(); }catch(e){ notifyError(e); } },

  // team (members) — drag to reorder
  memDragStart(e,id){
    e.preventDefault();
    const listEl=document.querySelector('.mem-list'); if(!listEl) return;
    const rows=Array.from(listEl.querySelectorAll('.mem-row'));
    const row=rows.find(r=>r.dataset.id===id); if(!row) return;
    const order=state.members.map(m=>m.id);
    const startIndex=order.indexOf(id);
    const step=row.getBoundingClientRect().height+12;
    dragCtx={ id, rows, order, startIndex, currentIndex:startIndex, startY:e.clientY, step };
    row.style.zIndex='50'; row.style.position='relative'; row.style.boxShadow='0 14px 30px -10px rgba(20,50,35,.35)'; row.style.cursor='grabbing';
    rows.forEach(r=>{ if(r!==row) r.style.transition='transform .15s ease'; });
    document.addEventListener('pointermove', App._memDragMove);
    document.addEventListener('pointerup', App._memDragEnd, { once:true });
  },
  _memDragMove(e){
    if(!dragCtx) return;
    const dy=e.clientY-dragCtx.startY;
    const row=dragCtx.rows.find(r=>r.dataset.id===dragCtx.id);
    row.style.transform=`translateY(${dy}px)`;
    let newIndex=dragCtx.startIndex+Math.round(dy/dragCtx.step);
    newIndex=Math.max(0, Math.min(dragCtx.order.length-1, newIndex));
    if(newIndex!==dragCtx.currentIndex){
      const arr=dragCtx.order;
      arr.splice(dragCtx.currentIndex,1);
      arr.splice(newIndex,0,dragCtx.id);
      dragCtx.currentIndex=newIndex;
      dragCtx.rows.forEach(r=>{
        if(r===row) return;
        const idx=arr.indexOf(r.dataset.id);
        const origIdx=state.members.findIndex(m=>m.id===r.dataset.id);
        const shift=(idx-origIdx)*dragCtx.step;
        r.style.transform=shift?`translateY(${shift}px)`:'';
      });
    }
  },
  _memDragEnd(){
    document.removeEventListener('pointermove', App._memDragMove);
    if(!dragCtx) return;
    const { order, rows }=dragCtx;
    rows.forEach(r=>{ r.style.transition=''; r.style.transform=''; r.style.position=''; r.style.zIndex=''; r.style.boxShadow=''; r.style.cursor=''; });
    dragCtx=null;
    App.reorderMembers(order);
  },
  reorderMembers(order){
    const map=new Map(state.members.map(m=>[m.id,m]));
    state.members=order.map((id,i)=>{ const m=map.get(id); m.sort=i; return m; });
    render();
    if(!sb) return;
    Promise.all(order.map((id,i)=>sb.from('members').update({ sort:i }).eq('id',id))).catch(notifyError);
  },
  memKeyMove(e,id){
    if(e.key!=='ArrowUp'&&e.key!=='ArrowDown') return;
    e.preventDefault();
    const order=state.members.map(m=>m.id);
    const i=order.indexOf(id), j=i+(e.key==='ArrowUp'?-1:1);
    if(j<0||j>=order.length) return;
    const tmp=order[i]; order[i]=order[j]; order[j]=tmp;
    App.reorderMembers(order);
    const el=document.querySelector('.mem-row[data-id="'+id+'"] .drag-handle');
    if(el) el.focus();
  },

  // our story — story block + per-milestone edit
  editStory(){ App._resetEdit(); state.snap={ story:(state.org.history&&state.org.history.story)||'' }; state.edit.story=true; render(); },
  cancelStory(){ if(state.snap){ if(!state.org.history) state.org.history={}; state.org.history.story=state.snap.story; } state.snap=null; state.edit.story=false; render(); },
  onStoryField(el){ setPath(state.org, el.dataset.path, el.value); },
  async saveStory(){ if(!sb) return; state.busy=true; render(); try{ const { error }=await sb.from('org').upsert(orgToRow(state.org)); if(error) throw error; state.edit.story=false; state.snap=null; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },
  // milestones — popup form (add + edit)
  openMilestoneAdd(){ App._resetEdit(); state.errorMsg=''; state.msForm={ open:true, id:null, year:'', title:'', desc:'' }; render(); },
  openMilestoneEdit(id){ const m=state.milestones.find(x=>x.id===id); if(!m) return; App._resetEdit(); state.errorMsg=''; state.msForm={ open:true, id:m.id, year:m.year, title:m.title, desc:m.desc }; render(); },
  closeMilestoneForm(){ state.msForm.open=false; render(); },
  onMsForm(el){ if(el.dataset.path==='year') el.value=el.value.replace(/\D/g,''); state.msForm[el.dataset.path]=el.value; toggleSave('saveMsBtn', state.msForm.title.trim().length>0 && state.msForm.year.trim().length>0); },
  async saveMilestoneForm(){ const f=state.msForm; if(!sb||!f.title.trim()||!f.year.trim()) return; state.busy=true; render(); try{ if(f.id){ const { error }=await sb.from('milestones').update({ year:f.year, title:f.title, description:f.desc }).eq('id',f.id); if(error) throw error; } else { const { error }=await sb.from('milestones').insert({ year:f.year, title:f.title, description:f.desc }); if(error) throw error; } await loadData(); state.msForm.open=false; flashSaved(); }catch(e){ notifyError(e); } finally{ state.busy=false; render(); } },
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
  const valid=state.form.title.trim().length>0 && state.form.date.trim().length>0;
  btn.disabled=!valid;
  btn.style.background=valid?'var(--primary)':'#B9D6C5';
  btn.style.cursor=valid?'pointer':'not-allowed';
}
function toggleSave(id, valid){ const b=document.getElementById(id); if(!b) return; b.disabled=!valid; b.style.background=valid?'var(--primary)':'#B9D6C5'; b.style.cursor=valid?'pointer':'not-allowed'; }
function modalSaveStyle(valid){ const on=valid&&!state.busy; return "padding:12px 26px;border:none;border-radius:12px;font-weight:600;font-size:14.5px;color:#fff;background:"+(on?'var(--primary)':'#B9D6C5')+";cursor:"+(on?'pointer':'not-allowed'); }

document.addEventListener('keydown', function(e){
  if(e.key!=='Escape') return;
  if(state.detailOpen) App.closeDetail();
  else if(state.formOpen) App.closeForm();
  else if(state.memForm.open) App.closeMemberForm();
  else if(state.msForm.open) App.closeMilestoneForm();
});
