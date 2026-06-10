// VIM — field/choice/group label helpers (multilingual)


/** getLabel(field) — Field label in the current language (label_it/en/ar). */
function getLabel(field) {
  const k = langKey();
  if (k.startsWith('Italian')) return field.label_it || field.label_en || field.name;
  if (k.startsWith('English')) return field.label_en || field.label_it || field.name;
  if (k.startsWith('Arabic'))  return field.label_ar || field.label_en || field.name;
  return field.label_it || field.name;
}

/** getChoiceLabel(choice) — Choice label in the current language (it/en/ar). */
function getChoiceLabel(choice) {
  const k = langKey();
  if (k.startsWith('Italian')) return choice.it || choice.en || choice.name;
  if (k.startsWith('English')) return choice.en || choice.it || choice.name;
  if (k.startsWith('Arabic'))  return choice.ar || choice.en || choice.name;
  return choice.it || choice.name;
}

/** getHint(field) — Optional field hint in the current language (hint_it/en/ar). */
function getHint(field) {
  const k = langKey();
  if (k.startsWith('Italian')) return field.hint_it || '';
  if (k.startsWith('English')) return field.hint_en || '';
  if (k.startsWith('Arabic'))  return field.hint_ar || '';
  return field.hint_it || '';
}

/** getGroupLabel(page) — Section label in the current language. */
function getGroupLabel(page) {
  const k = langKey();
  if (k.startsWith('Italian')) return page.label_it || page.label_en;
  if (k.startsWith('English')) return page.label_en || page.label_it;
  if (k.startsWith('Arabic'))  return page.label_ar || page.label_en;
  return page.label_it;
}


