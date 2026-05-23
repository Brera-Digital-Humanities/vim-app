// VIM — live status-bar clock


/**
 * Aggiorna #clock ogni 15 secondi con l'ora corrente HH:MM.
 * Si avvia automaticamente all'inizializzazione del modulo.
 */
(function tick() {
  const n = new Date();
  document.getElementById('clock').textContent =
    n.getHours().toString().padStart(2,'0') + ':' +
    n.getMinutes().toString().padStart(2,'0');
  setTimeout(tick, 15000);
})();


