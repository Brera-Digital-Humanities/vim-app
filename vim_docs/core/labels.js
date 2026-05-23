// VIM — field/choice/group label helpers (multilingual)


/**
 * getLabel(field) — Restituisce la label del campo nella lingua corrente.
 * I campi in PAGES hanno label_it, label_en, label_ar estratti dall'XLS.
 *
 * @param {Object} field - Oggetto campo da PAGES[n].fields
 * @returns {string} Testo della label nella lingua corrente
 */
function getLabel(field) {
  const k = langKey();
  if (k.startsWith('Italian')) return field.label_it || field.label_en || field.name;
  if (k.startsWith('English')) return field.label_en || field.label_it || field.name;
  if (k.startsWith('Arabic'))  return field.label_ar || field.label_en || field.name;
  return field.label_it || field.name;
}

/**
 * getChoiceLabel(choice) — Restituisce la label di una scelta nella lingua corrente.
 * Le scelte in CHOICES hanno proprietà it, en, ar estratte dall'XLS.
 *
 * @param {Object} choice - Oggetto scelta da CHOICES[listName][n]
 * @returns {string} Testo della scelta nella lingua corrente
 */
function getChoiceLabel(choice) {
  const k = langKey();
  if (k.startsWith('Italian')) return choice.it || choice.en || choice.name;
  if (k.startsWith('English')) return choice.en || choice.it || choice.name;
  if (k.startsWith('Arabic'))  return choice.ar || choice.en || choice.name;
  return choice.it || choice.name;
}

/**
 * getGroupLabel(page) — Restituisce la label della sezione nella lingua corrente.
 *
 * @param {Object} page - Oggetto pagina da PAGES[n]
 * @returns {string} Testo della sezione nella lingua corrente
 */
function getGroupLabel(page) {
  const k = langKey();
  if (k.startsWith('Italian')) return page.label_it || page.label_en;
  if (k.startsWith('English')) return page.label_en || page.label_it;
  if (k.startsWith('Arabic'))  return page.label_ar || page.label_en;
  return page.label_it;
}


