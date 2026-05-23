// VIM — conditional fields (XLSForm relevant evaluation)


/**
 * RELEVANT — Map fieldName → espressione XLSForm relevant.
 * Estratta automaticamente dalla colonna "relevant" del file XLS.
 *
 * Formato XLSForm: ${fieldName}='valore' oppure selected(${field},'val')
 * I campi NON presenti in questa mappa sono sempre visibili.
 */
const RELEVANT = {
  // media_audio visibile solo se file_type = audio
  "media_audio": "${file_type}='tipo_file_19_1'",
  // media_foto visibile solo se file_type = fotografia
  "media_foto": "${file_type}='tipo_file_19_3'",
  // media_video visibile solo se file_type = video
  "media_video": "${file_type}='tipo_file_19_2'",
  // media_documento visibile per file_type = documento O altro
  "media_documento": "${file_type}='tipo_file_19_4' or ${file_type}='tipo_file_19_5'",
  // bearer_age visibile solo se il portatore è un individuo
  "bearer_age": "${bearer_type}='tipo_port_6_1'",
  // fpic_consent_recording solo se consenso verbale
  "fpic_consent_recording": "${fpic_consent}='consenso_28_1'",
  // fpic_consent_file solo se consenso scritto
  "fpic_consent_file": "${fpic_consent}='consenso_28_2'",
};

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


