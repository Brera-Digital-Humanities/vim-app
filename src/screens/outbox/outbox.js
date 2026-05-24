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

/** sendSingle(i) — Send one queued form (via doSubmit); on success update the queue. */
async function sendSingle(i) {
  const item = outbox[i];
  // Update the button text while sending
  const btns = document.getElementById('outbox-list').querySelectorAll('button');
  if (btns[i * 2]) btns[i * 2].textContent = '…';
  const ok = await doSubmit(item.answers, item.mediaFiles);
  if (ok) {
    sentForms.push({ sentAt: new Date().toLocaleString() });
    outbox.splice(i, 1);
    saveState();
    updateOutboxBadge();
    renderOutbox();
  } else {
    if (btns[i * 2]) btns[i * 2].textContent = '⚠️ ' + tr().invia;
  }
}

/** sendAllOutbox() — Send all queued forms (iterate backwards to splice safely). */
async function sendAllOutbox() {
  for (let i = outbox.length - 1; i >= 0; i--) {
    const ok = await doSubmit(outbox[i].answers, outbox[i].mediaFiles);
    if (ok) {
      sentForms.push({ sentAt: new Date().toLocaleString() });
      outbox.splice(i, 1);
    }
  }
  saveState();
  updateOutboxBadge();
  renderOutbox();
}

/** deleteSingle(i) — Remove a form from the queue without sending it. */
function deleteSingle(i) {
  outbox.splice(i, 1);
  saveState();
  updateOutboxBadge();
  renderOutbox();
}


