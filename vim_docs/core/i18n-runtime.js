// VIM — i18n runtime: current-language accessors


/** Indice lingua corrente (0=IT, 1=EN, 2=AR) */
let currentLangIdx  = 0;
/** Indice lingua selezionata nella schermata selezione (prima di confermare) */
let selectedLangIdx = 0;

/**
 * tr() — Restituisce l'oggetto UI strings per la lingua corrente.
 * @returns {Object} Oggetto con tutte le stringhe UI
 */
function tr() { return UI_LANGS[currentLangIdx].ui; }

/**
 * langKey() — Restituisce la chiave della lingua corrente.
 * Usata da getLabel() per selezionare la label corretta dall'XLS.
 * @returns {string} Es. "Italian (it)", "English (en)", "Arabic (ar)"
 */
function langKey() { return UI_LANGS[currentLangIdx].key; }


