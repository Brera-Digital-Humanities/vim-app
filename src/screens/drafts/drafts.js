// VIM — drafts screen: list saved drafts, resume or delete

/** renderDrafts() — Populate the saved-drafts list (label + date + Resume/Delete). */
function renderDrafts() {
  const note = document.getElementById('drafts-persist-note');
  if (note) note.textContent = drafts.length ? tr().persistNote : '';

  const list = document.getElementById('drafts-list');
  if (!drafts.length) {
    list.innerHTML = '<p style="font-size:.82rem;color:var(--muted);padding:8px 0;">' + tr().noBozza + '</p>';
    return;
  }
  list.innerHTML = '';
  drafts.forEach((item, i) => {
    const el = document.createElement('div');
    el.style.cssText = 'padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:12px;';
    el.innerHTML = `
      <div style="font-size:.88rem;font-weight:500;color:var(--ink)">${item.label}</div>
      <div style="font-size:.7rem;color:var(--muted);margin-top:2px">${tr().formSavedAt} ${item.savedAt}</div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button onclick="resumeDraft(${i})"
          style="flex:1;padding:8px;border:none;border-radius:8px;background:var(--ink);color:var(--bg);font-size:.75rem;cursor:pointer;">
          ${tr().resume}
        </button>
        <button onclick="deleteDraft(${i})"
          style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:none;font-size:.75rem;cursor:pointer;color:var(--error)">
          ✕
        </button>
      </div>`;
    list.appendChild(el);
  });
}

/** deleteDraft(i) — Remove a draft from the list (and its stored record). */
function deleteDraft(i) {
  const item = drafts[i];
  if (!item) return;
  removeDraftRecord(item.id);
  drafts.splice(i, 1);
  renderDrafts();
}
