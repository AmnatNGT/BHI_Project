"use strict";
/* ============================================================
   GENERIC HELPERS (formatting, escaping, image resize/upload)
   ============================================================ */

function esc(value) {
  // Escapes &, <, > so DB/user text can't break out of HTML markup when
  // inserted into a template literal. Use this for any text rendered as
  // element content, e.g. `<h1>${esc(title)}</h1>`.
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function attr(value) {
  // Same as esc(), plus escaping the double quote — use this instead of esc()
  // whenever the text goes inside a double-quoted HTML attribute,
  // e.g. `value="${attr(title)}"`.
  return esc(value).replace(/"/g, '&quot;');
}

function bg(url) {
  // Inline CSS for a photo background. Single quotes in the URL are
  // percent-encoded so they can't close the url('...') early and corrupt
  // the rest of the style string.
  return "background-image:url('" + String(url).replace(/'/g, '%27') + "');background-size:cover;background-position:center";
}

function today() {
  // YYYY-MM-DD, matching what <input type="date"> expects and produces.
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate; // not a parseable date — show the raw value instead of "Invalid Date"
  try {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return isoDate;
  }
}

function initials(name) {
  // Avatar fallback when a team member has no photo: up to 2 letters from
  // their name. A leading honorific ("Dr", "Dr.") is skipped so the initials
  // reflect the person's actual name instead of always starting with "D".
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';

  const hasHonorific = words[0].toLowerCase().replace('.', '') === 'dr';
  const nameWords = hasHonorific ? words.slice(1) : words;

  const letters = nameWords.slice(0, 2).map(w => w[0]).join('');
  return (letters || words[0][0]).toUpperCase();
}

function excerpt(text) {
  // Trims long activity descriptions for card previews; the full text still
  // shows in the activity detail modal.
  text = text || '';
  return text.length > 120 ? text.slice(0, 120).trim() + '…' : text;
}

function setPath(obj, path, value) {
  // Writes into a nested field from a dotted string, e.g.
  // setPath(org, 'contact.email', x) sets org.contact.email = x.
  // This is what makes the generic oninput="App.onOrgField(this)" handlers
  // work: every bound <input>/<textarea> carries data-path="a.b.c" naming
  // the state field it edits (see the org/story forms in views-admin.js).
  const segments = path.split('.');
  let target = obj;
  for (let i = 0; i < segments.length - 1; i++) target = target[segments[i]];
  target[segments[segments.length - 1]] = value;
}

function sortedActivities() {
  // Newest first: by date, then by creation time as a tiebreaker so
  // same-day activities still show the most recently added one first.
  return state.activities.slice().sort((a, b) =>
    String(b.date || '').localeCompare(String(a.date || '')) || (b.createdAt || 0) - (a.createdAt || 0)
  );
}

function dataURLtoBlob(dataUrl) {
  // Converts a "data:<mime>;base64,xxxx" string (produced by resize() below)
  // into a Blob, because Supabase Storage's upload() needs a Blob/File, not
  // a plain string.
  const [meta, base64] = dataUrl.split(',');
  const mime = (meta.match(/:(.*?);/) || [])[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function flashSaved() {
  // Briefly shows a "Saved" badge on the admin dashboard. The timer is
  // stashed on the function itself (flashSaved._t) so repeated saves reset
  // the same timer instead of stacking up separate ones and flashing oddly.
  state.orgSaved = true;
  render();
  clearTimeout(flashSaved._t);
  flashSaved._t = setTimeout(() => { state.orgSaved = false; render(); }, 1600);
}

function notifyError(error) {
  state.errorMsg = (error && error.message) ? error.message : String(error);
  render();
}

/* Downscales a picked image client-side before it's ever uploaded — keeps
   storage usage and upload time down, since admins may pick full-resolution
   phone photos. Resolves to a JPEG data URL used as the live preview in the
   form; the actual upload (uploadImage, below) only happens once the admin
   clicks Save. */
function resize(file) {
  const MAX_DIMENSION = 1280;
  const JPEG_QUALITY = 0.82;

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result); // not a decodable image — fall back to the original file
      img.onload = () => {
        let width = img.width, height = img.height;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        } catch (err) {
          resolve(reader.result); // canvas export failed (e.g. tainted/unsupported) — fall back to the original file
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadImage(dataUrl, prefix) {
  // Uploads a resized image and returns its public URL. `prefix` namespaces
  // the storage path by feature ("org", "activities", "members"); the
  // timestamp + random suffix keeps filenames unique (upsert:false would
  // otherwise reject a name that already exists).
  const blob = dataURLtoBlob(dataUrl);
  const path = prefix + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jpg';
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
