"use strict";
/* ============================================================
   GENERIC HELPERS (formatting, escaping, image handling)
   ============================================================ */

function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attr(s){ return esc(s).replace(/"/g,'&quot;'); }
function bg(url){ return "background-image:url('"+String(url).replace(/'/g,"%27")+"');background-size:cover;background-position:center"; }
function today(){ return new Date().toISOString().slice(0,10); }
function fmtDate(iso){ if(!iso) return ''; const d=new Date(iso); if(isNaN(d.getTime())) return iso; try{ return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return iso; } }
function initials(name){ const parts=(name||'').trim().split(/\s+/).filter(Boolean); if(!parts.length) return '—'; let p=parts; if(parts[0].toLowerCase().replace('.','')==='dr') p=parts.slice(1); return (p.slice(0,2).map(w=>w[0]).join('')||parts[0][0]).toUpperCase(); }
function excerpt(d){ d=d||''; return d.length>120 ? d.slice(0,120).trim()+'…' : d; }
function setPath(obj, path, val){ const p=path.split('.'); let o=obj; for(let i=0;i<p.length-1;i++) o=o[p[i]]; o[p[p.length-1]]=val; }
function sortedActivities(){ return state.activities.slice().sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')) || (b.createdAt||0)-(a.createdAt||0)); }
function dataURLtoBlob(d){ const [meta,b64]=d.split(','); const mime=(meta.match(/:(.*?);/)||[])[1]||'image/jpeg'; const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return new Blob([arr],{type:mime}); }

function flashSaved(){ state.orgSaved=true; render(); clearTimeout(flashSaved._t); flashSaved._t=setTimeout(()=>{ state.orgSaved=false; render(); },1600); }
function notifyError(e){ state.errorMsg = (e&&e.message)?e.message:String(e); render(); }

/* image resize -> data URL (preview); uploaded on save */
function resize(file){
  return new Promise(res=>{
    const fr=new FileReader();
    fr.onload=()=>{ const img=new Image(); img.onload=()=>{ const max=1280; let w=img.width,h=img.height; if(w>max||h>max){ const r=Math.min(max/w,max/h); w=Math.round(w*r); h=Math.round(h*r);} const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(img,0,0,w,h); try{ res(c.toDataURL('image/jpeg',0.82)); }catch(err){ res(fr.result);} }; img.onerror=()=>res(fr.result); img.src=fr.result; };
    fr.onerror=()=>res(''); fr.readAsDataURL(file);
  });
}
async function uploadImage(dataUrl, prefix){
  const blob = dataURLtoBlob(dataUrl);
  const path = prefix+'/'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.jpg';
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType:'image/jpeg', upsert:false });
  if(error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
