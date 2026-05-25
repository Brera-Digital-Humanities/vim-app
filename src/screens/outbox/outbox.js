// VIM — outbox screen: list and delete queued forms


/** renderOutbox() — Render the list of queued forms; each has a Send and a delete button. */
function renderOutbox() {
  const list = document.getElementById('outbox-list');
  if (!outbox.length) {
    list.innerHTML = '<p style="font-size:.82rem;color:var(--muted);padding:8px 0;">' + tr().noOutbox + '</p>';
    return;
  }
  list.innerHTML = '';
  outbox.forEach((item, i) => {
    const el = document.createElement('div');
    el.style.cssText = 'padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;';
    // Permanently-failed items (e.g. rejected by the server) show a note and
    // stop auto-retrying; the user can retry manually or delete them.
    const failNote = item.failed
      ? `<div style="font-size:.7rem;color:var(--error);margin-top:4px">⚠️ ${tr().sendFailed}</div>` : '';
    el.innerHTML = `
      <div style="font-size:.88rem;font-weight:500;color:var(--ink)">${item.label}</div>
      <div style="font-size:.7rem;color:var(--muted);margin-top:2px">${tr().formSavedAt} ${item.savedAt}</div>
      ${failNote}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button onclick="sendSingle(${i})"
          style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--ink);color:var(--bg);font-size:.75rem;cursor:pointer;">
          ${item.failed ? tr().retry : tr().invia}
        </button>
        <button onclick="deleteSingle(${i})"
          style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:none;font-size:.75rem;cursor:pointer;color:var(--error)">
          ✕
        </button>
      </div>`;
    list.appendChild(el);
  });
}

// Send one queued item (by reference). On success move it to sentForms and drop
// its record; on a permanent failure flag it so we stop auto-retrying. Returns
// the doSubmit result. instanceID makes the send idempotent.
async function _sendItem(item) {
  const res = await doSubmit(item.answers, item.mediaFiles, item.id);
  if (res.ok) {
    sentForms.push({ sentAt: new Date().toLocaleString() });
    const i = outbox.indexOf(item);
    if (i > -1) outbox.splice(i, 1);
    removeOutboxRecord(item.id);
    saveState();              // persist the sent-forms log
    updateOutboxBadge();
  } else if (res.permanent) {
    item.failed = true;       // won't auto-retry; persist the flag
    saveOutboxRecord(item);
  }
  return res;
}

/** sendSingle(i) — Manually send one queued form (clears any failed flag). */
async function sendSingle(i) {
  const item = outbox[i];
  if (!item) return;
  delete item.failed;         // a manual send is a fresh attempt
  const btns = document.getElementById('outbox-list').querySelectorAll('button');
  if (btns[i * 2]) btns[i * 2].textContent = '…';   // sending feedback
  await _sendItem(item);
  renderOutbox();
}

let _autoSyncing = false;

/**
 * autoSync() — Send queued forms automatically when online. Skips items that
 * permanently failed; guarded against re-entry; retries the rest after a delay.
 * Triggered on connectivity, at startup and after completing a form.
 */
async function autoSync() {
  const pending = () => outbox.filter(it => !it.failed);
  if (_autoSyncing || !navigator.onLine || !pending().length) return;
  _autoSyncing = true;
  try {
    for (const item of pending()) await _sendItem(item);
  } finally {
    _autoSyncing = false;
  }
  if (document.getElementById('outbox-list')) renderOutbox();
  if (pending().length && navigator.onLine) {
    clearTimeout(window._syncRetry);
    window._syncRetry = setTimeout(autoSync, 30000);   // simple retry (transient errors only)
  }
}

/** sendAllOutbox() — "Send all" button: flush the queue now (if online). */
function sendAllOutbox() { autoSync(); }

/** deleteSingle(i) — Remove a form from the queue without sending it. */
function deleteSingle(i) {
  const item = outbox[i];
  if (!item) return;
  removeOutboxRecord(item.id);
  outbox.splice(i, 1);
  updateOutboxBadge();
  renderOutbox();
}


