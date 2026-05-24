// VIM — bootstrap (runs last, on DOMContentLoaded)


/** Indice campo corrente all'interno della sezione (reset ad ogni navigazione) */
window._fieldIdx = 0;

/**
 * Avvio: mostra la schermata di selezione lingua.
 * renderLangScreen() popola la lista lingue da UI_LANGS.
 */
// Carica lo stato persistito (bozze/outbox/inviati) prima di avviare.
Promise.resolve(loadState()).then(() => {
  renderLangScreen();
  updateConnectivity();
  updateOutboxBadge();
});
