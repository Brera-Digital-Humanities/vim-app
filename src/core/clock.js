// VIM — live status-bar clock


/** Update #clock every 15s with the current HH:MM; starts automatically. */
(function tick() {
  // #clock only exists on the demo page (fake status bar); no-op in the PWA.
  const el = document.getElementById('clock');
  if (el) {
    const n = new Date();
    el.textContent =
      n.getHours().toString().padStart(2,'0') + ':' +
      n.getMinutes().toString().padStart(2,'0');
  }
  setTimeout(tick, 15000);
})();


