// VIM — provisional tester login (client-side only, NOT real security).
// TODO: replace with proper auth before production. The code below is shared
// among beta testers and lives in clear text in the app — change it here.
const TESTER_CODE = 'vim-beta-2026';

/** isLoggedIn() — True if a tester has already logged in (persisted). */
function isLoggedIn() { return loggedIn === true; }

/** renderLogin() — Localizza i testi, precompila il nome noto, nasconde l'errore. */
function renderLogin() {
  const s = tr();
  const set = (id, prop, val) => { const e = document.getElementById(id); if (e) e[prop] = val; };
  set('login-title', 'textContent', s.loginTitle);
  set('login-name',  'placeholder', s.loginName);
  set('login-code',  'placeholder', s.loginCode);
  set('login-btn',   'textContent', s.loginBtn);
  set('login-name',  'value', testerName || '');
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
  renderLangScreen();
  showScreen('screen-lang', tr().appTitle, false);
}

/** logout() — Clears tester session and returns to the login screen. */
function logout() {
  loggedIn = false;
  saveAuth();
  renderLogin();
  showScreen('screen-login', tr().appTitle, false);
}
