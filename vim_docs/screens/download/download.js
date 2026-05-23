// VIM — download screen: form selection toggle


/**
 * toggleFormSelect() — Gestisce la selezione/deselezione del modulo
 * nella schermata download. Abilita/disabilita il bottone "Scarica".
 */
function toggleFormSelect() {
  formSelected = !formSelected;
  const cb  = document.getElementById('form-checkbox');
  const btn = document.getElementById('dl-btn');
  if (formSelected) {
    cb.innerHTML    = '<span style="color:white;font-size:.7rem">✓</span>';
    cb.style.background  = 'var(--accent)';
    cb.style.borderColor = 'var(--accent)';
    btn.disabled         = false;
    btn.style.background = 'var(--ink)';
    btn.style.cursor     = 'pointer';
  } else {
    cb.innerHTML         = '';
    cb.style.background  = '';
    cb.style.borderColor = 'var(--border)';
    btn.disabled         = true;
    btn.style.background = 'var(--muted)';
    btn.style.cursor     = 'not-allowed';
  }
}

/**
 * executeDownload() — Simula il download del modulo.
 *
 * NOTA: In questa implementazione il form è hardcoded in vim.data.js,
 * quindi il "download" è una simulazione con delay di 0.8s.
 *
 * In una integrazione Enketo Express completa, qui si chiamerebbe:
 *   GET /api/v2/assets/{uid}/?format=json
 * per scaricare la definizione XForm aggiornata dal server,
 * e si potrebbe salvare in localStorage/IndexedDB per uso offline.
 *
 * Dopo il download va direttamente alla home (NON alla selezione lingua,
 * che avviene solo all'avvio dell'app).
 */
async function executeDownload() {
  const btn = document.getElementById('dl-btn');
  const res = document.getElementById('dl-result');
  btn.textContent      = tr().dlLoading;
  btn.disabled         = true;
  btn.style.background = 'var(--muted)';

  // Simulazione delay download
  await new Promise(r => setTimeout(r, 800));

  formDownloaded = true;
  formSelected   = false;
  document.getElementById('form-dl-status').textContent = tr().downloaded;
  document.getElementById('form-dl-status').style.color = 'var(--accent2)';
  document.getElementById('form-checkbox').innerHTML         = '';
  document.getElementById('form-checkbox').style.background  = '';
  document.getElementById('form-checkbox').style.borderColor = 'var(--border)';
  btn.textContent      = tr().dlBtn;
  btn.disabled         = true;
  btn.style.background = 'var(--muted)';
  btn.style.cursor     = 'not-allowed';
  res.innerHTML = '<p style="font-size:.75rem;color:var(--accent2);padding:8px 0;">' + tr().dlOk + '</p>';

  // Vai alla home dopo breve pausa
  setTimeout(() => goHome(), 900);
}


