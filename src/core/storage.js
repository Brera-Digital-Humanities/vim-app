// VIM — offline persistence (IndexedDB): drafts, outbox, sent forms.
// IndexedDB stores File/Blob natively, so media in drafts/outbox survive too.

const VIM_DB = 'vim';
const VIM_STORE = 'state';

function _vimOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VIM_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(VIM_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** saveState() — Persist drafts, outbox and sentForms (fire-and-forget). */
function saveState() {
  if (!('indexedDB' in window)) return;
  _vimOpenDB().then(db => {
    const st = db.transaction(VIM_STORE, 'readwrite').objectStore(VIM_STORE);
    st.put(drafts,    'drafts');
    st.put(outbox,    'outbox');
    st.put(sentForms, 'sentForms');
  }).catch(() => {});
}

/** saveAuth() — Persist the tester login state (provisional). */
function saveAuth() {
  if (!('indexedDB' in window)) return;
  _vimOpenDB().then(db => {
    const st = db.transaction(VIM_STORE, 'readwrite').objectStore(VIM_STORE);
    st.put({ loggedIn, testerName }, 'auth');
  }).catch(() => {});
}

/** saveLang() — Persist the chosen language (to skip the language screen next time). */
function saveLang() {
  if (!('indexedDB' in window)) return;
  _vimOpenDB().then(db => {
    const st = db.transaction(VIM_STORE, 'readwrite').objectStore(VIM_STORE);
    st.put({ currentLangIdx, langChosen }, 'lang');
  }).catch(() => {});
}

/** loadState() — Load the persisted state into the global variables. */
function loadState() {
  if (!('indexedDB' in window)) return Promise.resolve();
  return _vimOpenDB().then(db => new Promise(resolve => {
    const st  = db.transaction(VIM_STORE, 'readonly').objectStore(VIM_STORE);
    const get = key => new Promise(r => {
      const q = st.get(key);
      q.onsuccess = () => r(q.result);
      q.onerror   = () => r(undefined);
    });
    Promise.all([get('drafts'), get('outbox'), get('sentForms'), get('auth'), get('lang')]).then(([d, o, s, a, l]) => {
      if (Array.isArray(d)) drafts    = d;
      if (Array.isArray(o)) outbox    = o;
      if (Array.isArray(s)) sentForms = s;
      if (a && typeof a === 'object') { loggedIn = !!a.loggedIn; testerName = a.testerName || ''; }
      if (l && typeof l === 'object' && typeof l.currentLangIdx === 'number') {
        currentLangIdx = l.currentLangIdx;
        langChosen     = !!l.langChosen;
      }
      resolve();
    });
  })).catch(() => {});
}

/**
 * persistStorage() — Ask the browser to keep our data (not evict it under
 * storage pressure / after inactivity). Best-effort: returns true if granted
 * or already persisted, false otherwise. Idempotent.
 */
function persistStorage() {
  if (!navigator.storage || !navigator.storage.persist) return Promise.resolve(false);
  return navigator.storage.persisted()
    .then(already => already ? true : navigator.storage.persist())
    .catch(() => false);
}

/** storageEstimate() — { usage, quota, pct } or null if unsupported. */
function storageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) return Promise.resolve(null);
  return navigator.storage.estimate()
    .then(({ usage = 0, quota = 0 }) => quota > 0 ? { usage, quota, pct: usage / quota } : null)
    .catch(() => null);
}

/**
 * updateStorageWarning() — Show the home warning when storage is nearly full
 * (>= 90% used), so the tester knows to send forms before running out of space.
 */
function updateStorageWarning() {
  const el = document.getElementById('storage-warn');
  if (!el) return Promise.resolve();
  return storageEstimate().then(est => {
    const low = !!(est && est.pct >= 0.9);
    el.style.display = low ? '' : 'none';
    if (low) el.textContent = tr().storageLow;
  });
}
