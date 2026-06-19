"use strict";
/* ============================================================
   ACTIONS — the App controller object (all onclick/oninput handlers)
   ============================================================ */

// Holds the in-progress drag state while a team member row is being dragged
// (see "team (members) — drag to reorder" below). null whenever nothing is
// being dragged.
let dragCtx = null;

const App = {
  // ---- navigation ----
  toggleMenu() { state.menuOpen = !state.menuOpen; render(); },
  goHome() { state.view = 'home'; state.menuOpen = false; render(); },
  goActivities() { state.view = 'activities'; state.menuOpen = false; render(); },
  goHistory() { state.view = 'history'; state.menuOpen = false; render(); },
  goMembers() { state.view = 'members'; state.menuOpen = false; render(); },
  goAdmin() { state.view = 'admin'; state.menuOpen = false; render(); },

  // Closes any open inline-edit panel/popup form. Called when switching admin
  // tabs so leftover edit state from one tab doesn't bleed into another.
  _resetEdit() {
    state.edit = { org: false, story: false };
    state.snap = null;
    if (state.memForm) state.memForm.open = false;
    if (state.msForm) state.msForm.open = false;
  },
  adminToOrg() { App._resetEdit(); state.adminTab = 'org'; render(); },
  adminToActs() { App._resetEdit(); state.adminTab = 'activities'; render(); },
  adminToHist() { App._resetEdit(); state.adminTab = 'history'; render(); },
  adminToMem() { App._resetEdit(); state.adminTab = 'members'; render(); },

  // ---- login (Supabase Auth) ----
  onLoginInput(inputEl) { state.login[inputEl.dataset.path] = inputEl.value; state.loginErr = false; },
  async onLogin() {
    if (!sb) return;
    const { user, pass } = state.login;
    state.busy = true;
    // Patch the button directly so it shows a loading label immediately,
    // before the await below resolves (render() only happens after).
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = T.loading; }
    try {
      const { error } = await sb.auth.signInWithPassword({ email: user.trim(), password: pass });
      if (error) {
        state.loginErr = true;
      } else {
        state.loggedIn = true;
        state.loginErr = false;
        state.login = { user: '', pass: '' };
        await loadData();
      }
    } catch (e) {
      state.loginErr = true;
    } finally {
      state.busy = false;
      render();
    }
  },
  onLoginKey(event) { if (event.key === 'Enter') App.onLogin(); },
  async logout() {
    if (sb) await sb.auth.signOut();
    state.loggedIn = false;
    state.view = 'home';
    state.menuOpen = false;
    render();
  },

  /* ---- per-block Edit / Save / Cancel ----
     Organization info and "our story" both follow the same pattern:
     editOrg()/editStory() take a deep-copy snapshot into state.snap before
     editing starts, so cancelOrg()/cancelStory() can restore it untouched.
     Saving clears the snapshot since there's nothing left to roll back to. */

  // organization
  editOrg() { App._resetEdit(); state.snap = JSON.parse(JSON.stringify(state.org)); state.edit.org = true; render(); },
  cancelOrg() { if (state.snap) state.org = state.snap; state.snap = null; state.edit.org = false; render(); },
  onOrgField(inputEl) { setPath(state.org, inputEl.dataset.path, inputEl.value); },
  onOrgLogo(inputEl) {
    const file = (inputEl.files || [])[0];
    inputEl.value = '';
    if (!file) return;
    state.busy = true;
    render();
    resize(file)
      .then(dataUrl => uploadImage(dataUrl, 'org'))
      .then(url => { state.org.logo = url; })
      .catch(notifyError)
      .finally(() => { state.busy = false; render(); });
  },
  removeOrgLogo() { state.org.logo = ''; render(); },
  async saveOrg() {
    if (!sb) return;
    state.busy = true;
    render();
    try {
      const { error } = await sb.from('org').upsert(orgToRow(state.org));
      if (error) throw error;
      state.edit.org = false;
      state.snap = null;
      flashSaved();
    } catch (e) {
      notifyError(e);
    } finally {
      state.busy = false;
      render();
    }
  },

  // activities — add/edit modal (js/modals.js formModal)
  openAdd() {
    state.errorMsg = '';
    state.formOpen = true;
    state.editingId = null;
    state.form = { title: '', desc: '', date: today(), images: [] };
    render();
  },
  openEdit(id) {
    const activity = state.activities.find(x => x.id === id);
    if (!activity) return;
    state.errorMsg = '';
    state.formOpen = true;
    state.editingId = id;
    // Deep-copy each image object (not just the array) so soft-deleting a
    // photo in this form — before Save is clicked — can't mutate state.activities.
    state.form = { title: activity.title, desc: activity.desc, date: activity.date, images: activity.images.map(img => ({ url: img.url, isactive: img.isactive })) };
    render();
  },
  closeForm() { state.formOpen = false; render(); },
  onFormInput(fieldEl) {
    state.form[fieldEl.dataset.path] = fieldEl.value;
    if (fieldEl.dataset.path === 'title' || fieldEl.dataset.path === 'date') updateSaveBtn();
  },
  // `index` is the position in the full state.form.images array (see
  // formModal() in modals.js, which keeps that index even though it only
  // renders the still-active photos). A photo that was never uploaded yet
  // (still a data: URL) is simply dropped; one that's already saved is kept
  // and just flagged isactive:false, so Save persists it as a soft delete.
  removeFormImage(index) {
    const image = state.form.images[index];
    if (!image) return;
    if (image.url.indexOf('data:') === 0) {
      state.form.images = state.form.images.filter((_, i) => i !== index);
    } else {
      image.isactive = false;
    }
    render();
  },
  onPickImages(inputEl) {
    const pickedFiles = Array.from(inputEl.files || []);
    inputEl.value = '';
    const activeCount = state.form.images.filter(img => img.isactive !== false).length;
    const remainingSlots = 30 - activeCount;
    const filesToAdd = pickedFiles.slice(0, Math.max(0, remainingSlots));
    Promise.all(filesToAdd.map(file => resize(file))).then(dataUrls => {
      const newImages = dataUrls.filter(Boolean).map(url => ({ url, isactive: true }));
      state.form.images = state.form.images.concat(newImages);
      render();
    });
  },
  async saveActivity() {
    const form = state.form;
    if (!form.title.trim() || !form.date.trim() || !sb) return;
    state.busy = true;
    render();
    try {
      // Only newly-picked images are still data: URLs (from resize()) and
      // need uploading; images kept from the original activity are already
      // public URLs, so re-uploading them would be wasted work. Soft-deleted
      // photos (isactive:false) are still written back so the row keeps them.
      const images = [];
      for (const image of form.images) {
        const url = image.url.indexOf('data:') === 0 ? await uploadImage(image.url, 'activities') : image.url;
        images.push({ url, isactive: image.isactive !== false });
      }
      if (state.editingId) {
        const { error } = await sb.from('activities')
          .update({ title: form.title, description: form.desc, date: form.date || null, images })
          .eq('id', state.editingId);
        if (error) throw error;
      } else {
        const { error } = await sb.from('activities')
          .insert({ title: form.title, description: form.desc, date: form.date || today(), images });
        if (error) throw error;
      }
      await loadData();
      state.formOpen = false;
    } catch (e) {
      notifyError(e);
    } finally {
      state.busy = false;
      render();
    }
  },
  // Soft delete: flips isactive to false instead of removing the row, so the
  // activity stays in the database but loadData() (filtered to isactive=true)
  // never fetches it back into the app.
  async deleteActivity(id) {
    if (!window.confirm(T.confirm_del)) return;
    try {
      const { error } = await sb.from('activities').update({ isactive: false }).eq('id', id);
      if (error) throw error;
      await loadData();
      render();
    } catch (e) {
      notifyError(e);
    }
  },

  /* team (members) — add/edit popup form.
     `sort` is stored 0-based in the DB but shown to admins as a 1-based
     "Order" field (see T.mb_order_hint), so each place that touches it
     adds/subtracts 1 at the boundary. */
  openMemberAdd() {
    App._resetEdit();
    state.errorMsg = '';
    state.memForm = { open: true, id: null, name: '', role: '', photo: '', sort: state.members.length + 1 };
    render();
  },
  openMemberEdit(id) {
    const member = state.members.find(x => x.id === id);
    if (!member) return;
    App._resetEdit();
    state.errorMsg = '';
    state.memForm = { open: true, id: member.id, name: member.name, role: member.role, photo: member.photo || '', sort: (member.sort || 0) + 1 };
    render();
  },
  closeMemberForm() { state.memForm.open = false; render(); },
  onMemForm(fieldEl) {
    state.memForm[fieldEl.dataset.path] = fieldEl.value;
    const form = state.memForm;
    toggleSave('saveMemBtn', form.name.trim().length > 0 && form.role.trim().length > 0 && String(form.sort).trim().length > 0);
  },
  onMemFormPhoto(inputEl) {
    const file = (inputEl.files || [])[0];
    inputEl.value = '';
    if (!file) return;
    state.busy = true;
    render();
    resize(file)
      .then(dataUrl => uploadImage(dataUrl, 'members'))
      .then(url => { state.memForm.photo = url; })
      .catch(notifyError)
      .finally(() => { state.busy = false; render(); });
  },
  async saveMemberForm() {
    const form = state.memForm;
    if (!sb || !form.name.trim() || !form.role.trim() || !String(form.sort).trim()) return;
    state.busy = true;
    render();
    try {
      const sort = Math.max(1, parseInt(form.sort, 10) || 1) - 1;
      if (form.id) {
        const { error } = await sb.from('members').update({ name: form.name, role: form.role, photo: form.photo, sort }).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('members').insert({ name: form.name, role: form.role, photo: form.photo, sort });
        if (error) throw error;
      }
      await loadData();
      state.memForm.open = false;
      flashSaved();
    } catch (e) {
      notifyError(e);
    } finally {
      state.busy = false;
      render();
    }
  },
  // Soft delete (see deleteActivity above for why): keeps the row, just hides it.
  async removeMember(id) {
    if (!window.confirm(T.confirm_del_member)) return;
    try {
      const { error } = await sb.from('members').update({ isactive: false }).eq('id', id);
      if (error) throw error;
      await loadData();
      render();
    } catch (e) {
      notifyError(e);
    }
  },

  /* team (members) — drag to reorder.
     A lightweight manual drag implementation (no library): pointerdown
     records where the dragged row started and how tall one row + its gap is
     (rowStep), then every pointermove converts the vertical mouse movement
     into "how many rows did we move past" and visually shifts the *other*
     rows out of the way so it looks like they're swapping places. Nothing is
     saved to Supabase until the pointer is released
     (_memDragEnd -> reorderMembers). */
  memDragStart(event, memberId) {
    event.preventDefault();
    const listEl = document.querySelector('.mem-list');
    if (!listEl) return;
    const rows = Array.from(listEl.querySelectorAll('.mem-row'));
    const draggedRow = rows.find(row => row.dataset.id === memberId);
    if (!draggedRow) return;

    const memberIdOrder = state.members.map(m => m.id);
    const startIndex = memberIdOrder.indexOf(memberId);
    const rowStep = draggedRow.getBoundingClientRect().height + 12; // row height + the gap between rows

    dragCtx = { id: memberId, rows, order: memberIdOrder, startIndex, currentIndex: startIndex, startY: event.clientY, step: rowStep };

    draggedRow.style.zIndex = '50';
    draggedRow.style.position = 'relative';
    draggedRow.style.boxShadow = '0 14px 30px -10px rgba(20,50,35,.35)';
    draggedRow.style.cursor = 'grabbing';
    rows.forEach(row => { if (row !== draggedRow) row.style.transition = 'transform .15s ease'; });

    document.addEventListener('pointermove', App._memDragMove);
    document.addEventListener('pointerup', App._memDragEnd, { once: true });
  },
  _memDragMove(event) {
    if (!dragCtx) return;
    const draggedDistance = event.clientY - dragCtx.startY;
    const draggedRow = dragCtx.rows.find(row => row.dataset.id === dragCtx.id);
    draggedRow.style.transform = `translateY(${draggedDistance}px)`;

    let targetIndex = dragCtx.startIndex + Math.round(draggedDistance / dragCtx.step);
    targetIndex = Math.max(0, Math.min(dragCtx.order.length - 1, targetIndex));
    if (targetIndex === dragCtx.currentIndex) return;

    // Move the dragged id to its new slot in the working order, then shift
    // every other row by however many slots it had to make room.
    const workingOrder = dragCtx.order;
    workingOrder.splice(dragCtx.currentIndex, 1);
    workingOrder.splice(targetIndex, 0, dragCtx.id);
    dragCtx.currentIndex = targetIndex;

    dragCtx.rows.forEach(row => {
      if (row === draggedRow) return;
      const newIndex = workingOrder.indexOf(row.dataset.id);
      const originalIndex = state.members.findIndex(m => m.id === row.dataset.id);
      const shift = (newIndex - originalIndex) * dragCtx.step;
      row.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  },
  _memDragEnd() {
    document.removeEventListener('pointermove', App._memDragMove);
    if (!dragCtx) return;
    const { order, rows } = dragCtx;
    rows.forEach(row => {
      row.style.transition = '';
      row.style.transform = '';
      row.style.position = '';
      row.style.zIndex = '';
      row.style.boxShadow = '';
      row.style.cursor = '';
    });
    dragCtx = null;
    App.reorderMembers(order);
  },
  // Applies a new id order to state.members (sort = position) and persists
  // it to Supabase; shared by both the pointer-drag end and the keyboard
  // reorder below.
  reorderMembers(memberIdOrder) {
    const membersById = new Map(state.members.map(m => [m.id, m]));
    state.members = memberIdOrder.map((id, index) => {
      const member = membersById.get(id);
      member.sort = index;
      return member;
    });
    render();
    if (!sb) return;
    Promise.all(memberIdOrder.map((id, index) => sb.from('members').update({ sort: index }).eq('id', id))).catch(notifyError);
  },
  memKeyMove(event, memberId) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const memberIdOrder = state.members.map(m => m.id);
    const currentIndex = memberIdOrder.indexOf(memberId);
    const targetIndex = currentIndex + (event.key === 'ArrowUp' ? -1 : 1);
    if (targetIndex < 0 || targetIndex >= memberIdOrder.length) return;

    const swap = memberIdOrder[currentIndex];
    memberIdOrder[currentIndex] = memberIdOrder[targetIndex];
    memberIdOrder[targetIndex] = swap;
    App.reorderMembers(memberIdOrder);

    // reorderMembers() re-renders the list, so the handle that had focus is
    // gone — find the same member's handle in the new markup and refocus it.
    const handleEl = document.querySelector('.mem-row[data-id="' + memberId + '"] .drag-handle');
    if (handleEl) handleEl.focus();
  },

  // our story — story text block + per-milestone add/edit popup
  editStory() { App._resetEdit(); state.snap = { story: (state.org.history && state.org.history.story) || '' }; state.edit.story = true; render(); },
  cancelStory() {
    if (state.snap) state.org.history.story = state.snap.story;
    state.snap = null;
    state.edit.story = false;
    render();
  },
  onStoryField(fieldEl) { setPath(state.org, fieldEl.dataset.path, fieldEl.value); },
  async saveStory() {
    if (!sb) return;
    state.busy = true;
    render();
    try {
      const { error } = await sb.from('org').upsert(orgToRow(state.org));
      if (error) throw error;
      state.edit.story = false;
      state.snap = null;
      flashSaved();
    } catch (e) {
      notifyError(e);
    } finally {
      state.busy = false;
      render();
    }
  },

  openMilestoneAdd() {
    App._resetEdit();
    state.errorMsg = '';
    state.msForm = { open: true, id: null, year: '', title: '', desc: '' };
    render();
  },
  openMilestoneEdit(id) {
    const milestone = state.milestones.find(x => x.id === id);
    if (!milestone) return;
    App._resetEdit();
    state.errorMsg = '';
    state.msForm = { open: true, id: milestone.id, year: milestone.year, title: milestone.title, desc: milestone.desc };
    render();
  },
  closeMilestoneForm() { state.msForm.open = false; render(); },
  onMsForm(fieldEl) {
    if (fieldEl.dataset.path === 'year') fieldEl.value = fieldEl.value.replace(/\D/g, ''); // year is digits-only
    state.msForm[fieldEl.dataset.path] = fieldEl.value;
    toggleSave('saveMsBtn', state.msForm.title.trim().length > 0 && state.msForm.year.trim().length > 0);
  },
  async saveMilestoneForm() {
    const form = state.msForm;
    if (!sb || !form.title.trim() || !form.year.trim()) return;
    state.busy = true;
    render();
    try {
      if (form.id) {
        const { error } = await sb.from('milestones').update({ year: form.year, title: form.title, description: form.desc }).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('milestones').insert({ year: form.year, title: form.title, description: form.desc });
        if (error) throw error;
      }
      await loadData();
      state.msForm.open = false;
      flashSaved();
    } catch (e) {
      notifyError(e);
    } finally {
      state.busy = false;
      render();
    }
  },
  // Soft delete (see deleteActivity above for why): keeps the row, just hides it.
  async removeMilestone(id) {
    if (!window.confirm(T.confirm_del_ms)) return;
    try {
      const { error } = await sb.from('milestones').update({ isactive: false }).eq('id', id);
      if (error) throw error;
      await loadData();
      render();
    } catch (e) {
      notifyError(e);
    }
  },

  // activity detail modal / image gallery (js/modals.js detailModal)
  openDetail(id) { state.detailOpen = true; state.detailId = id; state.detailImageIndex = 0; render(); },
  closeDetail() { state.detailOpen = false; render(); },
  detailPrev() {
    const activity = state.activities.find(x => x.id === state.detailId);
    const imageCount = activity ? activeImages(activity).length : 0;
    if (imageCount < 2) return;
    state.detailImageIndex = (state.detailImageIndex - 1 + imageCount) % imageCount;
    refreshDetailImage();
  },
  detailNext() {
    const activity = state.activities.find(x => x.id === state.detailId);
    const imageCount = activity ? activeImages(activity).length : 0;
    if (imageCount < 2) return;
    state.detailImageIndex = (state.detailImageIndex + 1) % imageCount;
    refreshDetailImage();
  },
  detailGo(index) { state.detailImageIndex = index; refreshDetailImage(); },

  dismissError() { state.errorMsg = ''; render(); }
};

/* These DOM-patch helpers exist so typing in a modal's required fields
   enables/disables its Save button without calling render() — a full
   render() would tear down and rebuild the input, losing focus and cursor
   position on every keystroke. */
function updateSaveBtn() {
  const saveBtn = document.getElementById('saveActivityBtn');
  if (!saveBtn) return;
  const isValid = state.form.title.trim().length > 0 && state.form.date.trim().length > 0;
  saveBtn.disabled = !isValid;
  saveBtn.style.background = isValid ? 'var(--primary)' : '#B9D6C5';
  saveBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
}
function toggleSave(buttonId, isValid) {
  const saveBtn = document.getElementById(buttonId);
  if (!saveBtn) return;
  saveBtn.disabled = !isValid;
  saveBtn.style.background = isValid ? 'var(--primary)' : '#B9D6C5';
  saveBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
}
function modalSaveStyle(isValid) {
  const isEnabled = isValid && !state.busy;
  return "padding:12px 26px;border:none;border-radius:12px;font-weight:600;font-size:14.5px;color:#fff;background:" + (isEnabled ? 'var(--primary)' : '#B9D6C5') + ";cursor:" + (isEnabled ? 'pointer' : 'not-allowed');
}

// Esc closes whichever modal is currently open (checked in z-index order).
document.addEventListener('keydown', function (event) {
  if (event.key !== 'Escape') return;
  if (state.detailOpen) App.closeDetail();
  else if (state.formOpen) App.closeForm();
  else if (state.memForm.open) App.closeMemberForm();
  else if (state.msForm.open) App.closeMilestoneForm();
});
