// VIM — bootstrap (runs last, on DOMContentLoaded)


/** Current field index within the section (reset on every navigation) */
window._fieldIdx = 0;

// Registra il service worker (apertura offline + installabilità PWA).
// Richiede contesto sicuro: funziona su https e su localhost.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

/**
 * Startup: load persisted state (login + language + drafts/outbox/sent), then:
 * - not logged in              → login screen
 * - logged in, language chosen → straight to home (skip the language screen)
 * - logged in, first time      → language screen
 */
Promise.resolve(loadState()).then(() => {
  selectedLangIdx = currentLangIdx;   // preselect the persisted language
  renderLangScreen();
  if (!isLoggedIn()) {
    renderLogin();
    showScreen('screen-login', tr().appTitle, false);
  } else if (langChosen) {
    goHome();                          // language already chosen: go home
  } else {
    showScreen('screen-lang', tr().appTitle, false);
  }
  updateConnectivity();
  updateOutboxBadge();
});
