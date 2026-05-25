// VIM — provisional tester login (client-side only, NOT real security).
// TODO: replace with proper auth before production. The shared tester code is
// injected at build time from .env (VIM_TESTER_CODE); it still ships in clear
// text in the monolith, so this is convenience, not security.
const TESTER_CODE = '__VIM_TESTER_CODE__';

/** isLoggedIn() — True if a tester has already logged in (persisted). */
function isLoggedIn() { return loggedIn === true; }

/** renderLogin() — Localize texts, prefill the known name, hide the error. */
function renderLogin() {
  const s = tr();
  const set = (id, prop, val) => { const e = document.getElementById(id); if (e) e[prop] = val; };
  set('login-title', 'textContent', s.loginTitle);
  set('login-name',  'placeholder', s.loginName);
  set('login-code',  'placeholder', s.loginCode);
  set('login-btn',   'textContent', s.loginBtn);
  set('login-name',  'value', testerName || '');
  // Reset the code field to hidden + open-eye icon
  const codeInp = document.getElementById('login-code');
  if (codeInp) codeInp.type = 'password';
  const eye = document.getElementById('login-eye');
  if (eye) { eye.innerHTML = EYE_OPEN; eye.setAttribute('aria-label', 'Mostra codice'); }
  const err = document.getElementById('login-error');
  if (err) err.style.display = 'none';
}

/**
 * doLogin() — Validate name + code. On success: persist auth and go to the
 * language screen. On error: show an inline message.
 */
function doLogin() {
  const name = (document.getElementById('login-name').value || '').trim();
  const code = (document.getElementById('login-code').value || '').trim();
  const err  = document.getElementById('login-error');
  const show = msg => { if (err) { err.textContent = msg; err.style.display = ''; } };

  if (!name)               return show(tr().loginErrName);
  if (code !== TESTER_CODE) return show(tr().loginErrCode);

  testerName = name;
  loggedIn   = true;
  saveAuth();
  // If a language was already chosen before, go straight home; otherwise
  // show the language screen (first time).
  if (langChosen) {
    goHome();
  } else {
    renderLangScreen();
    showScreen('screen-lang', tr().appTitle, false);
  }
}

// Eye icons for the password show/hide toggle (open = will reveal on click).
const EYE_OPEN  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

/** toggleLoginCode() — Show/hide the tester code field, swapping the eye icon. */
function toggleLoginCode() {
  const inp = document.getElementById('login-code');
  const btn = document.getElementById('login-eye');
  if (!inp || !btn) return;
  const reveal = inp.type === 'password';
  inp.type      = reveal ? 'text' : 'password';
  btn.innerHTML = reveal ? EYE_OFF : EYE_OPEN;
  btn.setAttribute('aria-label', reveal ? 'Nascondi codice' : 'Mostra codice');
  inp.focus();
}

/** logout() — Clears tester session and returns to the login screen. */
function logout() {
  loggedIn = false;
  saveAuth();
  renderLogin();
  showScreen('screen-login', tr().appTitle, false);
}
