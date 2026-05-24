// VIM — bootstrap (runs last, on DOMContentLoaded)


/** Indice campo corrente all'interno della sezione (reset ad ogni navigazione) */
window._fieldIdx = 0;

/**
 * Avvio: carica lo stato persistito (login + bozze/outbox/inviati), poi
 * mostra il login tester se non autenticato, altrimenti la selezione lingua.
 */
Promise.resolve(loadState()).then(() => {
  renderLangScreen();
  if (isLoggedIn()) {
    showScreen('screen-lang', tr().appTitle, false);
  } else {
    renderLogin();
    showScreen('screen-login', tr().appTitle, false);
  }
  updateConnectivity();
  updateOutboxBadge();
});
