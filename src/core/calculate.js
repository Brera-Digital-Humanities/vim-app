// VIM — calculated fields (XLSForm calculate evaluation)
//
// The CALCULATIONS list (ordered [name, expression] pairs) lives in data.js,
// generated from the Kobo form by `npm run sync`. Calculate fields are not
// rendered: their values are derived from other answers and feed cascading
// selects (choice_filter, e.g. region_district uses pg=${paese_group}) and
// submission metadata. This file holds only the evaluation logic; CALCULATIONS
// is loaded before it (data.js comes first). Mirrors XForm calculate semantics.


/**
 * recalc() — Recompute every calculated field into answers[]. Evaluated in form
 * order, so a calc may depend on an earlier one. Returns the names whose value
 * changed, so callers can clear now-invalid cascading-select dependents.
 */
function recalc() {
  const changed = [];
  for (const [name, expr] of (typeof CALCULATIONS !== 'undefined' ? CALCULATIONS : [])) {
    let val;
    try { val = evalCalc(expr); } catch(e) { val = ''; }
    val = (val == null) ? '' : String(val);
    if ((answers[name] || '') !== val) {
      if (val === '') delete answers[name]; else answers[name] = val;
      changed.push(name);
    }
  }
  return changed;
}

/**
 * evalCalc(expr) — Evaluate an XLSForm calculate expression. Supports the
 * subset used by the VIM form: if(cond, then, else) · ${field} · 'literal'.
 * Returns a string ('' for empty/unknown).
 */
function evalCalc(expr) {
  expr = expr.trim();
  if (expr.startsWith('if(') && expr.endsWith(')')) {
    const args = splitTop(expr.slice(3, -1), ',');
    if (args.length === 3) return evalCalc(evalCalcCond(args[0]) ? args[1] : args[2]);
  }
  return calcTerm(expr);
}

/** evalCalcCond(c) — Evaluate a condition: and/or · ${a}='v' / ${a}!='v'. */
function evalCalcCond(c) {
  c = c.trim();
  let p = splitTop(c, ' and '); if (p.length > 1) return p.every(evalCalcCond);
  p     = splitTop(c, ' or ');  if (p.length > 1) return p.some(evalCalcCond);
  p = splitTop(c, '!='); if (p.length === 2) return calcTerm(p[0]) !== calcTerm(p[1]);
  p = splitTop(c, '=');  if (p.length === 2) return calcTerm(p[0]) === calcTerm(p[1]);
  return !!calcTerm(c);
}

/** calcTerm(t) — Resolve a single term to its string value. */
function calcTerm(t) {
  t = t.trim();
  if (t.startsWith('if(')) return evalCalc(t);
  let m = t.match(/^\$\{(\w+)\}$/); if (m) return answers[m[1]] || '';
  m     = t.match(/^'([^']*)'$/);   if (m) return m[1];
  return t; // bare number / token
}

/**
 * splitTop(s, sep) — Split s on sep at the top level only, ignoring sep inside
 * parentheses or single-quoted literals (so if() args and 'a,b' survive).
 */
function splitTop(s, sep) {
  const out = []; let depth = 0, q = false, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { cur += ch; if (ch === "'") q = false; continue; }
    if (ch === "'") { q = true; cur += ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
