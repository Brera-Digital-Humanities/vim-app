// VIM — sent screen: read-only list of sent forms (text only, no media)

/** renderSent() — Populate the sent-forms list (name + date); a row opens the
 *  read-only detail. Same card style as drafts/outbox. */
function renderSent() {
  const header = document.getElementById('sent-header-label');
  if (header) header.textContent = tr().sentHeader;
  // Hide the detail-only back button when we go back to the list
  const backBtn = document.getElementById('sent-back-btn');
  if (backBtn) backBtn.style.display = 'none';

  const list = document.getElementById('sent-list');
  if (!sentForms.length) {
    list.innerHTML = '<p class="list-empty">' + tr().noInviati + '</p>';
    return;
  }
  list.innerHTML = '';
  sentForms.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'list-card';
    el.style.cursor = 'pointer';
    el.onclick = () => showSentDetail(i);
    el.innerHTML = `
      <div class="sent-card-row">
        <div>
          <div class="card-title">${f.label || ('#' + (i + 1))}</div>
          <div class="card-meta">${f.sentAt}</div>
        </div>
        <span class="sent-arrow">›</span>
      </div>`;
    list.appendChild(el);
  });
}

/** showSentDetail(i) — Read-only view of a sent form: field labels + values,
 *  media shown as the file name (no media is stored). Back returns to the list. */
function showSentDetail(i) {
  const f = sentForms[i];
  if (!f) return;
  let rows = '';
  PAGES.forEach(pg => pg.fields.forEach(q => {
    const v = f.answers ? f.answers[q.name] : undefined;
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return;
    rows += `<div class="sent-detail-row">
      <div class="sent-detail-label">${getLabel(q)}</div>
      <div class="sent-detail-value">${_sentValueText(q, v)}</div>
    </div>`;
  }));
  if (!rows) rows = '<p class="list-empty">—</p>';
  document.getElementById('sent-list').innerHTML = `
    <div class="sent-detail-title">${f.label || ('#' + (i + 1))}</div>
    <div class="sent-detail-meta">${f.sentAt}</div>
    ${rows}`;
  // Reveal the bottom-bar back button (returns to the sent list)
  const backBtn = document.getElementById('sent-back-btn');
  if (backBtn) backBtn.style.display = '';
}

// Display text for a sent value: resolve choice labels; text/date/media shown as-is.
function _sentValueText(q, v) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const t = q.type || '';
  if (t.startsWith('select_')) {
    const list = CHOICES[t.split(' ')[1]] || [];
    return (Array.isArray(v) ? v : [v])
      .map(n => { const c = list.find(x => x.name === n); return esc(c ? getChoiceLabel(c) : n); })
      .join(', ');
  }
  return esc(v);   // text / number / date / media filename
}
