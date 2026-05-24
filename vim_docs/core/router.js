// VIM — screen navigation / router


/** Elenco ID di tutte le schermate disponibili */
const SCREENS = ['screen-lang', 'screen-home', 'screen-form', 'screen-outbox'];

/**
 * showScreen(id, title, showPill) — Attiva una schermata e aggiorna l'app bar.
 *
 * @param {string}  id       - ID della schermata da attivare
 * @param {string}  title    - Titolo da mostrare nell'app bar
 * @param {boolean} showPill - True per mostrare pill contatore e progress bar
 */
function showScreen(id, title, showPill) {
  SCREENS.forEach(s => document.getElementById(s).classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('bar-title').textContent = title;
  const isHome = id === 'screen-home' || id === 'screen-lang';
  document.getElementById('bar-back-btn').style.display = isHome ? 'none' : '';
  document.getElementById('prog-track').style.display   = showPill ? '' : 'none';
}

/**
 * goHome() — Torna alla schermata home.
 * Nasconde bottone lingua dall'app bar e riapplica le traduzioni UI.
 */
function goHome() {
  showScreen('screen-home', tr().appTitle, false);
  document.getElementById('lang-btn').style.display = 'none';
  applyUILang();
}

/**
 * startFillForm() — Avvia la compilazione del form.
 * Il form è già incorporato (sync Kobo), quindi si parte subito.
 * Se esiste una bozza, la riprende dal punto salvato.
 */
function startFillForm() {
  // Riprendi bozza o inizia nuovo form
  if (draftAnswers) {
    answers = JSON.parse(JSON.stringify(draftAnswers));
    pageIdx = draftPage;
  } else {
    answers = {}; mediaFiles = {}; pageIdx = 0;
  }
  window._fieldIdx = 0;
  showScreen('screen-form', tr().questionnaire, true);
  document.getElementById('lang-btn').style.display     = '';
  document.getElementById('form-nav-extra').style.display = 'flex';
  renderPage(pageIdx);
}

/** changeLang() — Apre la selezione lingua dall'app bar (durante compilazione) */
function changeLang()     { renderLangScreen(); showScreen('screen-lang', tr().cambiaLinguaTitle, false); }

/** homeLangChange() — Apre la selezione lingua dalla home */
function homeLangChange() { renderLangScreen(); showScreen('screen-lang', tr().cambiaLinguaTitle, false); }

/**
 * showDraft() — Apre la bozza salvata o mostra messaggio "nessuna bozza".
 * Se esiste una bozza, chiama startFillForm() che la riprende.
 */
function showDraft() {
  if (!draftAnswers) {
    showScreen('screen-form', tr().bozzaTitle, false);
    document.getElementById('form-area').innerHTML =
      '<div class="state-error"><p style="color:var(--muted)">' + tr().noBozza + '</p></div>';
    document.getElementById('form-nav').style.display       = 'none';
    document.getElementById('form-nav-extra').style.display = 'none';
    return;
  }
  startFillForm();
}

/** showOutbox() — Mostra la coda di moduli da inviare */
function showOutbox() {
  showScreen('screen-outbox', tr().outboxTitle, false);
  renderOutbox();
}

/**
 * showSent() — Mostra l'elenco dei moduli già inviati.
 * In questa versione mostra solo metadati (data invio), non le risposte.
 */
function showSent() {
  showScreen('screen-form', tr().inviatiTitle, false);
  document.getElementById('form-nav').style.display       = 'none';
  document.getElementById('form-nav-extra').style.display = 'none';
  if (!sentForms.length) {
    document.getElementById('form-area').innerHTML =
      '<div class="state-error"><p style="color:var(--muted)">' + tr().noInviati + '</p></div>';
    return;
  }
  let html = '<div style="padding:12px 0">';
  sentForms.forEach((f, i) => {
    html += `<div style="padding:12px 0;border-bottom:1px solid var(--border);font-size:.82rem;">
      <div style="font-weight:500">#${i+1}</div>
      <div style="color:var(--muted);font-size:.72rem">${f.sentAt}</div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('form-area').innerHTML = html;
}


