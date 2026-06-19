"use strict";
/* ============================================================
   MODALS + misc screens (forms, detail viewer, setup/loading/error)
   ============================================================ */

function formModal() {
  const imageCount = state.form.images.length;
  const isValid = state.form.title.trim().length > 0 && state.form.date.trim().length > 0;
  const saveBtnStyle = "padding:12px 26px;border:none;border-radius:12px;font-weight:600;font-size:14.5px;color:#fff;background:" + (isValid && !state.busy ? 'var(--primary)' : '#B9D6C5') + ";cursor:" + (isValid && !state.busy ? 'pointer' : 'not-allowed');

  const imageTiles = state.form.images.map((imageSrc, index) => `
    <div style="position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;border:1px solid #DCEBE2;${bg(imageSrc)}">
      <button onclick="App.removeFormImage(${index})" aria-label="Remove image ${index + 1}" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:8px;background:rgba(16,36,26,.72);color:#fff;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center">✕</button>
    </div>`).join('');

  const addImageTile = imageCount < 30 ? `
    <label class="add-img" style="aspect-ratio:1;border:1.5px dashed #BCD9C8;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;color:var(--primary);background:#F4FBF7">
      <span style="font-size:22px;line-height:1" aria-hidden="true">＋</span>
      <span style="font-size:11px;font-weight:600">${T.f_add}</span>
      <input type="file" accept="image/*" multiple onchange="App.onPickImages(this)" style="position:absolute;width:1px;height:1px;opacity:0">
    </label>` : '';

  return `
  <div class="modal-wrap" style="position:fixed;inset:0;z-index:120;background:rgba(16,36,26,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow:auto;animation:fadeIn .2s ease both">
    <div class="modal-card" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="act-modal-title" style="background:#fff;border-radius:22px;width:100%;max-width:600px;padding:30px;box-shadow:var(--shadow-lg);animation:pop .35s ease both">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">
        <h3 id="act-modal-title" style="font-family:var(--font-display);font-weight:600;font-size:22px;margin:0;color:var(--ink)">${state.editingId ? T.edit_activity : T.add_activity}</h3>
        <button onclick="App.closeForm()" aria-label="${attr(T.cancel)}" style="background:#EAF4EE;border:none;width:34px;height:34px;border-radius:10px;cursor:pointer;color:#3a4d44;font-size:18px;flex:none">✕</button>
      </div>
      <div style="margin-bottom:16px">
        <label for="act-title" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.f_title} <span style="color:#C0392B">*</span></label>
        <input id="act-title" class="field" required value="${attr(state.form.title)}" data-path="title" oninput="App.onFormInput(this)" placeholder="${attr(T.f_title)}" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none">
      </div>
      <div style="margin-bottom:16px">
        <label for="act-date" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.f_date} <span style="color:#C0392B">*</span></label>
        <input id="act-date" class="field" required type="date" value="${attr(state.form.date)}" data-path="date" onchange="App.onFormInput(this)" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none">
      </div>
      <div style="margin-bottom:18px">
        <label for="act-desc" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.f_desc}</label>
        <textarea id="act-desc" class="field" data-path="desc" oninput="App.onFormInput(this)" rows="4" placeholder="${attr(T.f_desc)}" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none;line-height:1.65">${esc(state.form.desc)}</textarea>
      </div>
      <div style="margin-bottom:22px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span id="act-images-label" style="font-size:12.5px;font-weight:600;color:var(--muted)">${T.f_images}</span>
          <span style="font-size:12px;color:var(--muted)">${imageCount} / 30</span>
        </div>
        <div role="group" aria-labelledby="act-images-label" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px">
          ${imageTiles}${addImageTile}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:8px">${imageCount >= 30 ? T.f_full : T.f_hint}</div>
      </div>
      ${modalError()}
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button onclick="App.closeForm()" style="background:#fff;color:#3a4d44;border:1px solid #D2E5D9;padding:12px 22px;border-radius:12px;font-weight:600;font-size:14.5px;cursor:pointer">${T.cancel}</button>
        <button id="saveActivityBtn" onclick="App.saveActivity()" ${isValid && !state.busy ? '' : 'disabled'} style="${saveBtnStyle}">${state.busy ? T.saving : T.save}</button>
      </div>
    </div>
  </div>`;
}

function memberModal() {
  const form = state.memForm;
  const hasPhoto = !!form.photo;
  const avatar = hasPhoto ? bg(form.photo) : ('background:' + GRADS[0]);
  const isValid = form.name.trim().length > 0 && form.role.trim().length > 0 && String(form.sort).trim().length > 0;
  return `
  <div class="modal-wrap" style="position:fixed;inset:0;z-index:120;background:rgba(16,36,26,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow:auto;animation:fadeIn .2s ease both">
    <div class="modal-card" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="mem-modal-title" style="background:#fff;border-radius:22px;width:100%;max-width:540px;padding:30px;box-shadow:var(--shadow-lg);animation:pop .35s ease both">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">
        <h3 id="mem-modal-title" style="font-family:var(--font-display);font-weight:600;font-size:22px;margin:0;color:var(--ink)">${form.id ? T.mb_edit : T.mb_add}</h3>
        <button onclick="App.closeMemberForm()" aria-label="${attr(T.cancel)}" style="background:#EAF4EE;border:none;width:34px;height:34px;border-radius:10px;cursor:pointer;color:#3a4d44;font-size:18px;flex:none">✕</button>
      </div>
      <div style="display:flex;gap:18px;align-items:flex-start;margin-bottom:16px">
        <label style="width:96px;height:96px;border-radius:16px;flex:none;cursor:pointer;background:#E8F2EC;${avatar};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
          ${!hasPhoto ? `<span aria-hidden="true" style="font-family:var(--font-ui);font-weight:700;font-size:26px;color:rgba(255,255,255,.92)">${esc(initials(form.name))}</span>` : ''}
          <span aria-hidden="true" style="position:absolute;bottom:0;left:0;right:0;background:rgba(16,36,26,.55);color:#fff;font-size:10px;text-align:center;padding:3px">${T.mb_photo}</span>
          <input type="file" accept="image/*" onchange="App.onMemFormPhoto(this)" aria-label="${attr(T.mb_photo)}" style="position:absolute;width:1px;height:1px;opacity:0">
        </label>
        <div style="flex:1;min-width:0">
          <label for="mem-name" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.mb_name} <span style="color:#C0392B">*</span></label>
          <input id="mem-name" class="field" required value="${attr(form.name)}" data-path="name" oninput="App.onMemForm(this)" placeholder="${attr(T.mb_name)}" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none;margin-bottom:12px">
          <label for="mem-role" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.mb_role} <span style="color:#C0392B">*</span></label>
          <input id="mem-role" class="field" required value="${attr(form.role)}" data-path="role" oninput="App.onMemForm(this)" placeholder="${attr(T.mb_role)}" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none;margin-bottom:12px">
          <label for="mem-sort" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.mb_order} <span style="color:#C0392B">*</span></label>
          <input id="mem-sort" class="field" required type="number" min="1" value="${attr(form.sort)}" data-path="sort" oninput="App.onMemForm(this)" style="width:100px;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none">
          <div style="font-size:11.5px;color:var(--muted);margin-top:6px">${T.mb_order_hint}</div>
        </div>
      </div>
      ${modalError()}
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button onclick="App.closeMemberForm()" style="background:#fff;color:#3a4d44;border:1px solid #D2E5D9;padding:12px 22px;border-radius:12px;font-weight:600;font-size:14.5px;cursor:pointer">${T.cancel}</button>
        <button id="saveMemBtn" onclick="App.saveMemberForm()" ${isValid && !state.busy ? '' : 'disabled'} style="${modalSaveStyle(isValid)}">${state.busy ? T.saving : T.save}</button>
      </div>
    </div>
  </div>`;
}

function milestoneModal() {
  const form = state.msForm;
  const isValid = form.title.trim().length > 0 && form.year.trim().length > 0;
  return `
  <div class="modal-wrap" style="position:fixed;inset:0;z-index:120;background:rgba(16,36,26,.55);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow:auto;animation:fadeIn .2s ease both">
    <div class="modal-card" onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="ms-modal-title" style="background:#fff;border-radius:22px;width:100%;max-width:520px;padding:30px;box-shadow:var(--shadow-lg);animation:pop .35s ease both">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">
        <h3 id="ms-modal-title" style="font-family:var(--font-display);font-weight:600;font-size:22px;margin:0;color:var(--ink)">${form.id ? T.m_edit : T.m_add}</h3>
        <button onclick="App.closeMilestoneForm()" aria-label="${attr(T.cancel)}" style="background:#EAF4EE;border:none;width:34px;height:34px;border-radius:10px;cursor:pointer;color:#3a4d44;font-size:18px;flex:none">✕</button>
      </div>
      <div style="margin-bottom:16px">
        <label for="ms-year" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.m_year} <span style="color:#C0392B">*</span></label>
        <input id="ms-year" class="field" required value="${attr(form.year)}" data-path="year" inputmode="numeric" maxlength="4" oninput="App.onMsForm(this)" placeholder="${attr(T.m_year)}" style="width:160px;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none" autofocus>
      </div>
      <div style="margin-bottom:16px">
        <label for="ms-title" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.m_title} <span style="color:#C0392B">*</span></label>
        <input id="ms-title" class="field" required value="${attr(form.title)}" data-path="title" oninput="App.onMsForm(this)" placeholder="${attr(T.m_title)}" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none">
      </div>
      <div style="margin-bottom:22px">
        <label for="ms-desc" style="display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin:0 0 6px">${T.m_desc}</label>
        <textarea id="ms-desc" class="field" data-path="desc" oninput="App.onMsForm(this)" rows="3" placeholder="${attr(T.m_desc)}" style="width:100%;padding:11px 13px;border:1px solid #D2E5D9;border-radius:11px;font-size:15px;background:#F7FBF9;outline:none;line-height:1.6">${esc(form.desc)}</textarea>
      </div>
      ${modalError()}
      <div style="display:flex;gap:12px;justify-content:flex-end">
        <button onclick="App.closeMilestoneForm()" style="background:#fff;color:#3a4d44;border:1px solid #D2E5D9;padding:12px 22px;border-radius:12px;font-weight:600;font-size:14.5px;cursor:pointer">${T.cancel}</button>
        <button id="saveMsBtn" onclick="App.saveMilestoneForm()" ${isValid && !state.busy ? '' : 'disabled'} style="${modalSaveStyle(isValid)}">${state.busy ? T.saving : T.save}</button>
      </div>
    </div>
  </div>`;
}

function detailModal() {
  const activity = state.activities.find(x => x.id === state.detailId);
  if (!activity) return '';

  // Recomputed here (rather than reusing a cached `_i`) because the detail
  // modal can be reopened from either the public card grid or the admin
  // activities list, and we can't be sure activity._i was set by whichever
  // view rendered last — so we just find this activity's position fresh.
  const sorted = sortedActivities();
  const activityIndex = sorted.findIndex(x => x.id === activity.id);

  const images = activity.images || [];
  const hasImages = images.length > 0;
  const currentIndex = Math.min(state.detailImageIndex, Math.max(0, images.length - 1));
  const coverStyle = hasImages ? bg(images[currentIndex]) : ('background:' + GRADS[(activityIndex < 0 ? 0 : activityIndex) % GRADS.length]);
  const hasMultipleImages = images.length > 1;
  const imageA11yAttrs = hasImages ? `role="img" aria-label="${attr(activity.title)} — ${T.images} ${currentIndex + 1} / ${images.length}"` : 'aria-hidden="true"';

  const thumbnails = images.map((imageSrc, index) => `
    <button class="detail-thumb" onclick="App.detailGo(${index})" aria-label="${T.images} ${index + 1}" aria-current="${index === currentIndex}" style="width:66px;height:66px;border-radius:11px;cursor:pointer;border:none;padding:0;${bg(imageSrc)};${index === currentIndex ? 'outline:3px solid var(--primary);outline-offset:1px' : 'opacity:.7'}"></button>`).join('');

  return `
  <div class="modal-wrap" style="position:fixed;inset:0;z-index:110;background:rgba(13,28,19,.66);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s ease both">
    <div onclick="event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title" style="background:#fff;border-radius:22px;max-width:840px;width:100%;max-height:90vh;overflow:auto;box-shadow:var(--shadow-lg);animation:pop .35s ease both">
      <div class="detail-hero" ${imageA11yAttrs} style="position:relative;height:380px;background:#E8F2EC;${coverStyle}">
        ${!hasImages ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center" aria-hidden="true"><span style="font-family:var(--font-ui);font-weight:700;font-size:46px;color:rgba(255,255,255,.92)">${esc(state.org.short)}</span></div>` : ''}
        <button onclick="App.closeDetail()" aria-label="${attr(T.cancel)}" style="position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.92);border:none;cursor:pointer;font-size:17px;color:#3a4d44;display:flex;align-items:center;justify-content:center">✕</button>
        ${hasMultipleImages ? `
          <button onclick="event.stopPropagation();App.detailPrev()" aria-label="Previous image" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.92);border:none;cursor:pointer;font-size:18px;color:#3a4d44">‹</button>
          <button onclick="event.stopPropagation();App.detailNext()" aria-label="Next image" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.92);border:none;cursor:pointer;font-size:18px;color:#3a4d44">›</button>` : ''}
      </div>
      <div style="padding:26px 30px 30px">
        <span style="display:inline-block;background:var(--primary-soft);color:var(--primary-strong);padding:5px 13px;border-radius:999px;font-size:12.5px;font-weight:600">${esc(fmtDate(activity.date))}</span>
        <h2 id="detail-modal-title" style="font-family:var(--font-display);font-weight:600;font-size:28px;margin:14px 0 0;line-height:1.25;color:var(--ink)">${esc(activity.title)}</h2>
        <p style="font-size:15.5px;line-height:1.8;color:var(--ink-soft);margin:14px 0 0;white-space:pre-wrap">${esc(activity.desc)}</p>
        ${hasMultipleImages ? `<div role="group" aria-label="${T.images}" style="display:flex;gap:9px;margin-top:22px;flex-wrap:wrap">${thumbnails}</div>` : ''}
      </div>
    </div>
  </div>`;
}

// Paging through the gallery (App.detailPrev/Next/Go in actions.js) patches
// just the hero image + thumbnail highlighting instead of calling render().
// A full render() would rebuild the whole #app HTML on every arrow click,
// which is unnecessary work and can feel less instant than a direct DOM update.
function refreshDetailImage() {
  const activity = state.activities.find(x => x.id === state.detailId);
  if (!activity) return;
  const images = activity.images || [];
  if (!images.length) return;

  const currentIndex = Math.min(state.detailImageIndex, Math.max(0, images.length - 1));

  const hero = document.querySelector('.detail-hero');
  if (hero) {
    hero.style.backgroundImage = "url('" + String(images[currentIndex]).replace(/'/g, '%27') + "')";
    hero.setAttribute('aria-label', activity.title + ' — ' + T.images + ' ' + (currentIndex + 1) + ' / ' + images.length);
  }

  document.querySelectorAll('.detail-thumb').forEach((thumbEl, index) => {
    const isCurrent = index === currentIndex;
    thumbEl.style.outline = isCurrent ? '3px solid var(--primary)' : 'none';
    thumbEl.style.outlineOffset = isCurrent ? '1px' : '';
    thumbEl.style.opacity = isCurrent ? '' : '.7';
    thumbEl.setAttribute('aria-current', isCurrent ? 'true' : 'false');
  });
}

function setupScreen() {
  return `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;background:var(--primary-pale)">
    <div style="background:#fff;max-width:560px;border:1px solid #DCEBE2;border-radius:22px;padding:36px 34px;box-shadow:var(--shadow-lg)">
      <div aria-hidden="true" style="width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,var(--primary),var(--primary-strong));color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-ui);font-weight:700;font-size:18px">BHI</div>
      <h2 style="font-family:var(--font-display);font-weight:600;font-size:23px;margin:18px 0 0;color:var(--ink)">Connect your Supabase project</h2>
      <p style="color:var(--ink-soft);font-size:14.5px;line-height:1.7;margin:12px 0 0">Open <b>js/config.js</b> and paste your <b>anon public</b> key into <code style="background:#EAF4EE;padding:2px 6px;border-radius:6px">SUPABASE_ANON_KEY</code> near the top of the file. Find it in Supabase → Project Settings → API.</p>
      <p style="color:var(--muted);font-size:13px;line-height:1.7;margin:14px 0 0">Project URL is already set to:<br><code style="background:#EAF4EE;padding:2px 6px;border-radius:6px">${esc(SUPABASE_URL)}</code></p>
    </div>
  </div>`;
}

function loadingScreen() {
  return `<div role="status" style="min-height:100vh;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;color:var(--muted)"><div class="spinner" aria-hidden="true"></div><div style="font-size:14px">${T.loading}</div></div>`;
}

function errorToast() {
  if (!state.errorMsg) return '';
  return `
  <div role="alert" style="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:200;background:#C0392B;color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 16px 40px -16px rgba(0,0,0,.4);display:flex;align-items:center;gap:14px;max-width:90vw">
    <span style="font-size:13.5px">${esc(state.errorMsg)}</span>
    <button onclick="App.dismissError()" aria-label="Dismiss" style="background:rgba(255,255,255,.2);color:#fff;border:none;width:26px;height:26px;border-radius:8px;cursor:pointer;flex:none">✕</button>
  </div>`;
}
