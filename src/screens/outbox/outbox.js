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
    el.innerHTML = `
      <div style="font-size:.88rem;font-weight:500;color:var(--ink)">${item.label}</div>
      <div style="font-size:.7rem;color:var(--muted);margin-top:2px">${tr().formSavedAt} ${item.savedAt}</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button onclick="sendSingle(${i})"
          style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--ink);color:var(--bg);font-size:.75rem;cursor:pointer;">
          ${tr().invia}
        </button>
        <button onclick="deleteSingle(${i})"
          style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:none;font-size:.75rem;cursor:pointer;color:var(--error)">
          ✕
        </button>
      </div>`;
    list.appendChild(el);
  });
}

// Send one queued item (by reference); on success move it to sentForms and drop
// its record. Returns the submit result. instanceID makes the send idempotent.
async function _sendItem(item) {
  const ok = await doSubmit(item.answers, item.mediaFiles, item.id);
  if (ok) {
    sentForms.push({ sentAt: new Date().toLocaleString() });
    const i = outbox.indexOf(item);
    if (i > -1) outbox.splice(i, 1);
    removeOutboxRecord(item.id);
    saveState();              // persist the sent-forms log
    updateOutboxBadge();
  }
  return ok;
}

/** sendSingle(i) — Manually send one queued form; refresh the list on success. */
async function sendSingle(i) {
  const item = outbox[i];
  if (!item) return;
  const btns = document.getElementById('outbox-list').querySelectorAll('button');
  if (btns[i * 2]) btns[i * 2].textContent = '…';   // sending feedback
  const ok = await _sendItem(item);
  if (ok) renderOutbox();
  else if (btns[i * 2]) btns[i * 2].textContent = '⚠️ ' + tr().invia;
}

let _autoSyncing = false;

/**
 * autoSync() — Send queued forms automatically when online. Guarded against
 * re-entry; if any item remains and we're still online, retries after a delay.
 * Triggered on connectivity, at startup and after completing a form.
 */
async function autoSync() {
  if (_autoSyncing || !navigator.onLine || !outbox.length) return;
  _autoSyncing = true;
  try {
    for (const item of [...outbox]) await _sendItem(item);
  } finally {
    _autoSyncing = false;
  }
  if (document.getElementById('outbox-list')) renderOutbox();
  if (outbox.length && navigator.onLine) {
    clearTimeout(window._syncRetry);
    window._syncRetry = setTimeout(autoSync, 30000);   // simple retry
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


