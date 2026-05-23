// VIM — success / error feedback UI

function showSuccess() {
  document.getElementById('form-nav').style.display       = 'none';
  document.getElementById('prog-fill').style.width        = '100%';
  document.getElementById('pill').textContent             = '✓';
  document.getElementById('form-area').innerHTML = `
    <div class="state-success">
      <div class="icon">✓</div>
      <h2>${tr().successTitle}</h2>
      <p>${tr().successMsg}</p>
    </div>`;
}

/**
 * showError(msg) — Mostra un messaggio di errore nell'area form.
 * Chiamata da doSubmit() in api.js.
 *
 * @param {string} msg - Messaggio di errore HTML
 */
function showError(msg) {
  document.getElementById('form-area').innerHTML =
    `<div class="state-error"><p>${msg}</p></div>`;
}


