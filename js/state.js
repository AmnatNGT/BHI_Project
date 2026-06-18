"use strict";
/* ============================================================
   STATE + DB <-> view data mapping
   ============================================================ */

let state = {
  view: 'home', adminTab: 'activities', loggedIn: false,
  login: { user: '', pass: '' }, loginErr: false,
  formOpen: false, editingId: null,
  form: { title: '', desc: '', date: '', images: [] },
  detailOpen: false, detailId: null, di: 0,
  orgSaved: false, menuOpen: false,
  edit: { org:false, story:false }, snap: null,
  memForm: { open:false, id:null, name:'', role:'', photo:'' },
  msForm: { open:false, id:null, year:'', title:'', desc:'' },
  loading: true, busy: false, errorMsg: '',
  org: emptyOrg(), activities: [], members: [], milestones: []
};

function emptyOrg(){
  return { short: 'BHI', logo: '', nameFull:{en:'Border Health Initiative'}, tagline:{en:''}, about:{en:''},
           history:{story:''}, contact:{place:'',email:''}, stats:{} };
}

function orgFromRow(r){
  if(!r) return emptyOrg();
  return {
    short: r.short || 'BHI',
    logo: r.logo || '',
    nameFull: { en: r.name_full || '' },
    tagline:  { en: r.tagline   || '' },
    about:    { en: r.about     || '' },
    history:  { story: r.story  || '' },
    contact:  { place: r.place  || '', email: r.email || '' },
    stats: r.stats || {}
  };
}
function orgToRow(o){
  return { id:1, short:o.short, logo:o.logo||'', name_full:o.nameFull.en, tagline:o.tagline.en, about:o.about.en,
           story:(o.history&&o.history.story)||'', place:o.contact.place, email:o.contact.email,
           stats:o.stats||{}, updated_at:new Date().toISOString() };
}
const actFromRow = r => ({ id:r.id, title:r.title||'', desc:r.description||'', date:r.date||'', images:r.images||[], createdAt:r.created_at?new Date(r.created_at).getTime():0 });
const msFromRow  = r => ({ id:r.id, year:r.year||'', title:r.title||'', desc:r.description||'', sort:r.sort||0 });

async function loadData(){
  if(!sb) return;
  const [orgR, actR, memR, msR] = await Promise.all([
    sb.from('org').select('*').eq('id',1).maybeSingle(),
    sb.from('activities').select('*'),
    sb.from('members').select('*').order('sort',{ascending:true}).order('created_at',{ascending:true}),
    sb.from('milestones').select('*').order('sort',{ascending:true}).order('created_at',{ascending:true})
  ]);
  const err = orgR.error||actR.error||memR.error||msR.error;
  if(err) throw err;
  state.org = orgFromRow(orgR.data);
  state.activities = (actR.data||[]).map(actFromRow);
  state.members = (memR.data||[]).map(m=>({ id:m.id, name:m.name||'', role:m.role||'', photo:m.photo||'', sort:m.sort||0 }));
  state.milestones = (msR.data||[]).map(msFromRow);
}
