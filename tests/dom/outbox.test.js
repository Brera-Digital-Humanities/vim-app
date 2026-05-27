// DOM/flow tests for the outbox (send queue). Uses jsdom + a concatenated
// bundle of the real source; doSubmit and storage are mocked.
const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { bundleContext } = require('../helpers/harness');

// Build a context with the real state + i18n + outbox code and a minimal DOM.
function setup() {
  const dom = new JSDOM('<!DOCTYPE html><div id="outbox-list"></div>');
  const win = dom.window;
  win._compiling = false;
  const ctx = bundleContext(
    ['core/state.js', 'i18n/it.js', 'i18n/en.js', 'i18n/ar.js', 'i18n/index.js',
     'core/i18n-runtime.js', 'screens/outbox/outbox.js'],
    { console, setTimeout, clearTimeout, document: win.document, window: win, navigator: win.navigator }
  );
  // Collaborators not in the bundle → stubs.
  ctx.buildSubmissionXml = () => '<data/>';
  ctx.saveOutboxRecord = () => {};
  ctx.removeOutboxRecord = () => {};
  ctx.saveSentRecord = () => {};
  ctx.saveState = () => {};
  ctx.updateOutboxBadge = () => {};
  return ctx;
}

const item = (id, extra = {}) =>
  Object.assign({ id, label: id, answers: {}, mediaFiles: {} }, extra);

test('double send: a second click is ignored → doSubmit called once', async () => {
  const ctx = setup();
  ctx.__t.outbox = [item('uuid:1', { autoSend: false })];

  let calls = 0, release;
  ctx.doSubmit = () => { calls++; return new Promise(r => { release = () => r({ ok: true, permanent: false, status: 201 }); }); };

  const p1 = ctx.sendSingle(0);
  const p2 = ctx.sendSingle(0);   // immediate double-click on the same item
  release();
  await Promise.all([p1, p2]);

  assert.equal(calls, 1, 'only one network submit');
  assert.equal(ctx.__t.outbox.length, 0, 'item left the queue');
  assert.equal(ctx.__t.sentForms.length, 1, 'recorded once as sent');
  assert.equal(ctx.__t.sentForms[0].id, 'uuid:1');
});

test('permanent failure (400): item stays, flagged failed, auto-send suspended', async () => {
  const ctx = setup();
  ctx.__t.outbox = [item('uuid:2', { autoSend: true })];
  ctx.doSubmit = async () => ({ ok: false, permanent: true, status: 400, message: 'bad request' });

  await ctx.sendSingle(0);

  assert.equal(ctx.__t.outbox.length, 1, 'stays in queue');
  assert.equal(ctx.__t.outbox[0].failed, true);
  assert.equal(ctx.__t.outbox[0].autoSend, false, 'auto-send suspended');
  assert.equal(ctx.__t.sentForms.length, 0);
});

test('autoSync sends only auto + non-failed items', async () => {
  const ctx = setup();
  ctx.__t.outbox = [
    item('uuid:a', { autoSend: true }),
    item('uuid:b', { autoSend: true, failed: true, lastError: 'x' }),
    item('uuid:c', { autoSend: false }),
  ];
  ctx.doSubmit = async () => ({ ok: true, permanent: false, status: 201 });

  await ctx.autoSync();

  assert.deepEqual(ctx.__t.sentForms.map(s => s.id), ['uuid:a'], 'only the auto+ok item sent');
  assert.equal(ctx.__t.outbox.length, 2, 'failed and manual remain queued');
});
