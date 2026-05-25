#!/usr/bin/env node
/**
 * watch.js — Rebuild the app whenever a source file under src/ changes.
 *
 * Runs an initial build, then re-runs scripts/build-app.sh on every change
 * (debounced). No extra dependencies: uses the built-in recursive fs.watch
 * (Node >= 20). Keep `npm run demo` / `npm start` running in another terminal
 * and just refresh after each rebuild.
 *
 * Usage: npm run watch
 */

const { spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT  = path.resolve(__dirname, '..');
const SRC   = path.join(ROOT, 'src');
const BUILD = path.join(ROOT, 'scripts', 'build-app.sh');

let building = false;   // a build is in progress
let queued   = false;   // a change arrived during a build
let timer    = null;    // debounce timer

function build() {
  if (building) { queued = true; return; }   // coalesce changes into one rebuild
  building = true;
  const t = new Date().toLocaleTimeString();
  console.log(`\n[watch ${t}] building…`);
  const p = spawn('bash', [BUILD], { stdio: 'inherit' });
  p.on('exit', code => {
    building = false;
    console.log(code === 0 ? '[watch] ✓ done — refresh the browser' : `[watch] build failed (exit ${code})`);
    if (queued) { queued = false; build(); }   // run once more for changes during the build
  });
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(build, 250);   // debounce bursts of save events
}

console.log('[watch] watching src/ … (Ctrl+C to stop)');
build();   // initial build

try {
  fs.watch(SRC, { recursive: true }, schedule);
} catch (e) {
  console.error('[watch] recursive fs.watch not available (needs Node >= 20):', e.message);
  process.exit(1);
}
