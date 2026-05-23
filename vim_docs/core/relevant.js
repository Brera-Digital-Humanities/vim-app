// VIM — conditional fields (XLSForm relevant evaluation)
//
// The RELEVANT map (fieldName → XLSForm expression) lives in data.js,
// generated from the Kobo form by `npm run sync`. This file holds only the
// evaluation logic. RELEVANT is loaded before this file (data.js comes first).


/**
 * isVisible(fieldName) — Valuta se un campo deve essere mostrato.
 * Usa evalRelevant() per interpretare l'espressione XLSForm.
 *
 * @param {string} fieldName - Nome del campo da valutare
 * @returns {boolean} True se il campo deve essere mostrato
 */
function isVisible(fieldName) {
  const expr = RELEVANT[fieldName];
  if (!expr) return true; // Nessuna condizione = sempre visibile
  try {
    return evalRelevant(expr);
  } catch(e) {
    return true; // In caso di errore di parsing, mostra il campo
  }
}

/**
 * evalRelevant(expr) — Interpreta un'espressione XLSForm relevant.
 *
 * Supporta:
 *   ${field}='value'           → uguaglianza
 *   ${field}!='value'          → disuguaglianza
 *   selected(${field},'value') → selezione in campo multiplo
 *   ${field}!=''               → campo non vuoto
 *   ${field}=''                → campo vuoto
 *   ${field} > N               → confronto numerico
 *   expr1 and expr2            → AND
 *   expr1 or expr2             → OR
 *
 * @param {string} expr - Espressione XLSForm
 * @returns {boolean} Risultato della valutazione
 */
function evalRelevant(expr) {
  expr = expr.trim();

  // AND: tutte le sotto-espressioni devono essere vere
  if (expr.includes(' and ')) {
    return expr.split(' and ').every(e => evalRelevant(e.trim()));
  }
  // OR: almeno una sotto-espressione deve essere vera
  if (expr.includes(' or ')) {
    return expr.split(' or ').some(e => evalRelevant(e.trim()));
  }

  let m;

  // selected(${field}, 'val') — usato per select_multiple
  m = expr.match(/selected\(\$\{(\w+)\},\s*'([^']+)'\)/);
  if (m) {
    const val = answers[m[1]];
    return Array.isArray(val) ? val.includes(m[2]) : val === m[2];
  }

  // ${field}!='val'
  m = expr.match(/\$\{(\w+)\}\s*!=\s*'([^']*)'/);
  if (m) return (answers[m[1]] || '') !== m[2];

  // ${field}='val'
  m = expr.match(/\$\{(\w+)\}\s*=\s*'([^']*)'/);
  if (m) return (answers[m[1]] || '') === m[2];

  // ${field}!='' — campo non vuoto
  m = expr.match(/\$\{(\w+)\}\s*!=\s*''/);
  if (m) return !!(answers[m[1]]);

  // ${field}='' — campo vuoto
  m = expr.match(/\$\{(\w+)\}\s*=\s*''/);
  if (m) return !(answers[m[1]]);

  // ${field} > N — comparazione numerica
  m = expr.match(/\$\{(\w+)\}\s*([><=!]+)\s*(\d+)/);
  if (m) {
    const v = parseFloat(answers[m[1]] || 0);
    const n = parseFloat(m[3]);
    if (m[2] === '>')  return v > n;
    if (m[2] === '>=') return v >= n;
    if (m[2] === '<')  return v < n;
    if (m[2] === '<=') return v <= n;
    if (m[2] === '=')  return v === n;
  }

  return true; // Espressione non riconosciuta = mostra campo
}


