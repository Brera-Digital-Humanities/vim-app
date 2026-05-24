// VIM — conditional fields (XLSForm relevant evaluation)
//
// The RELEVANT map (fieldName → XLSForm expression) lives in data.js,
// generated from the Kobo form by `npm run sync`. This file holds only the
// evaluation logic. RELEVANT is loaded before this file (data.js comes first).


/** isVisible(fieldName) — Whether a field should show, per its relevant expr. */
function isVisible(fieldName) {
  const expr = RELEVANT[fieldName];
  if (!expr) return true; // no condition = always visible
  try {
    return evalRelevant(expr);
  } catch(e) {
    return true; // on parse error, show the field
  }
}

/**
 * evalRelevant(expr) — Evaluate an XLSForm relevant expression. Supports:
 *   ${f}='v' / ${f}!='v' / ${f}='' / ${f}!='' / ${f} >|>=|<|<= N
 *   selected(${f},'v') (select_multiple) · expr and expr · expr or expr
 */
function evalRelevant(expr) {
  expr = expr.trim();

  // AND: every sub-expression must be true
  if (expr.includes(' and ')) {
    return expr.split(' and ').every(e => evalRelevant(e.trim()));
  }
  // OR: at least one sub-expression must be true
  if (expr.includes(' or ')) {
    return expr.split(' or ').some(e => evalRelevant(e.trim()));
  }

  let m;

  // selected(${field}, 'val') — select_multiple
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

  // ${field}!='' — non-empty
  m = expr.match(/\$\{(\w+)\}\s*!=\s*''/);
  if (m) return !!(answers[m[1]]);

  // ${field}='' — empty
  m = expr.match(/\$\{(\w+)\}\s*=\s*''/);
  if (m) return !(answers[m[1]]);

  // ${field} > N — numeric comparison
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

  return true; // unrecognized expression = show field
}


