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

/** saveState() — Persiste drafts, outbox e sentForms (fire-and-forget). */
function saveState() {
  if (!('indexedDB' in window)) return;
  _vimOpenDB().then(db => {
    const st = db.transaction(VIM_STORE, 'readwrite').objectStore(VIM_STORE);
    st.put(drafts,    'drafts');
    st.put(outbox,    'outbox');
    st.put(sentForms, 'sentForms');
  }).catch(() => {});
}

/** saveAuth() — Persiste lo stato di login del tester (provvisorio). */
function saveAuth() {
  if (!('indexedDB' in window)) return;
  _vimOpenDB().then(db => {
    const st = db.transaction(VIM_STORE, 'readwrite').objectStore(VIM_STORE);
    st.put({ loggedIn, testerName }, 'auth');
  }).catch(() => {});
}

/** loadState() — Carica lo stato salvato nelle variabili globali. */
function loadState() {
  if (!('indexedDB' in window)) return Promise.resolve();
  return _vimOpenDB().then(db => new Promise(resolve => {
    const st  = db.transaction(VIM_STORE, 'readonly').objectStore(VIM_STORE);
    const get = key => new Promise(r => {
      const q = st.get(key);
      q.onsuccess = () => r(q.result);
      q.onerror   = () => r(undefined);
    });
    Promise.all([get('drafts'), get('outbox'), get('sentForms'), get('auth')]).then(([d, o, s, a]) => {
      if (Array.isArray(d)) drafts    = d;
      if (Array.isArray(o)) outbox    = o;
      if (Array.isArray(s)) sentForms = s;
      if (a && typeof a === 'object') { loggedIn = !!a.loggedIn; testerName = a.testerName || ''; }
      resolve();
    });
  })).catch(() => {});
}
