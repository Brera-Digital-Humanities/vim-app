// Test harness: load VIM source files (browser globals, no modules) into a vm
// context so functions can be called from Node tests, without touching sources.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.resolve(__dirname, '..', '..', 'src');
const readSrc = rel => fs.readFileSync(path.join(SRC, rel), 'utf8');

// Unit context: load each file on its own. Top-level function declarations
// attach to the context global (callable); the function reads its free vars
// (UID, PAGES, answers…) from globals you set on the context.
function unitContext(globals = {}) {
  return vm.createContext(Object.assign({ console }, globals));
}
function loadFile(ctx, rel) {
  vm.runInContext(readSrc(rel), ctx, { filename: rel });
  return ctx;
}

// Bundle context: concatenate files into ONE script (like the browser bundle)
// so top-level let/const globals (outbox, sentForms, currentLangIdx…) are
// shared across files. __t exposes those bindings to the test.
function bundleContext(files, globals = {}) {
  const ctx = vm.createContext(Object.assign({ console }, globals));
  const code = files.map(readSrc).join('\n') + `
;globalThis.__t = {
  get outbox(){return outbox}, set outbox(v){outbox = v;},
  get sentForms(){return sentForms}, set sentForms(v){sentForms = v;},
  get drafts(){return drafts}, set drafts(v){drafts = v;},
};`;
  vm.runInContext(code, ctx, { filename: 'bundle.js' });
  return ctx;
}

module.exports = { SRC, readSrc, unitContext, loadFile, bundleContext };
