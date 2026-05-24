// VIM — bootstrap (runs last, on DOMContentLoaded)


/** Indice campo corrente all'interno della sezione (reset ad ogni navigazione) */
window._fieldIdx = 0;

/**
 * Avvio: mostra la schermata di selezione lingua.
 * renderLangScreen() popola la lista lingue da UI_LANGS.
 */
renderLangScreen();
updateConnectivity();
