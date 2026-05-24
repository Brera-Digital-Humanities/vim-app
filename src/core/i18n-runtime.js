// VIM — i18n runtime: current-language accessors


/** Current UI language index (into UI_LANGS) */
let currentLangIdx  = 0;
/** Language highlighted on the selection screen, before confirming */
let selectedLangIdx = 0;

/** tr() — UI strings object for the current language. */
function tr() { return UI_LANGS[currentLangIdx].ui; }

/** langKey() — current language key (e.g. "Italian (it)"); used by getLabel(). */
function langKey() { return UI_LANGS[currentLangIdx].key; }


