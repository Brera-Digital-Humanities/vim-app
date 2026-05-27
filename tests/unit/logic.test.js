// Unit tests for VIM pure logic (no DOM). Run with: npm test
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { unitContext, loadFile } = require('../helpers/harness');

test('buildSubmissionXml: OpenRosa XML — values, escaping, media filename, instanceID, skips empty', () => {
  const PAGES = [{ fields: [
    { name: 'title', type: 'text' },
    { name: 'n',     type: 'integer' },
    { name: 'photo', type: 'image' },
    { name: 'empty', type: 'text' },
    { name: 'tags',  type: 'select_multiple list' },
  ] }];
  const ctx = unitContext({ UID: 'FORM1', PAGES });
  loadFile(ctx, 'api.js');

  const ans = { title: 'a & b <c>', n: 5, photo: 'p.jpg', empty: '', tags: ['x', 'y'] };
  const mf  = { photo: { name: 'p.jpg' } };
  const xml = ctx.buildSubmissionXml(ans, mf, 'uuid:123');

  assert.ok(xml.startsWith('<?xml version="1.0" ?><data id="FORM1">'), 'root data id');
  assert.ok(xml.includes('<title>a &amp; b &lt;c&gt;</title>'), 'XML-escaped text');
  assert.ok(xml.includes('<n>5</n>'));
  assert.ok(xml.includes('<photo>p.jpg</photo>'), 'media field = filename');
  assert.ok(xml.includes('<tags>x y</tags>'), 'multi joined by space');
  assert.ok(!xml.includes('<empty>'), 'empty field skipped');
  assert.ok(xml.includes('<meta><instanceID>uuid:123</instanceID></meta>'), 'instanceID in meta');
  assert.ok(xml.endsWith('</data>'));
});

test('evalRelevant: =, !=, selected, empty, numeric, and/or, spaces', () => {
  const ctx = unitContext({ answers: {} });
  loadFile(ctx, 'core/relevant.js');
  const ev = (expr, ans) => { ctx.answers = ans; return ctx.evalRelevant(expr); };

  assert.equal(ev("${a}='x'", { a: 'x' }), true);
  assert.equal(ev("${a} = 'x'", { a: 'y' }), false);            // spaces around =
  assert.equal(ev("${a}!='x'", { a: 'y' }), true);
  assert.equal(ev("${a}!=''", { a: 'y' }), true);               // non-empty
  assert.equal(ev("${a}=''", {}), true);                        // empty
  assert.equal(ev("selected(${a},'v')", { a: ['v', 'w'] }), true);
  assert.equal(ev("selected(${a},'z')", { a: ['v', 'w'] }), false);
  assert.equal(ev("${n} > 3", { n: '5' }), true);
  assert.equal(ev("${a}='x' and ${b}='y'", { a: 'x', b: 'y' }), true);
  assert.equal(ev("${a}='x' and ${b}='y'", { a: 'x', b: 'z' }), false);
  assert.equal(ev("${a}='x' or ${b}='y'", { a: 'x', b: 'z' }), true);
});

test('schemaSig: stable for same schema, changes when a field type/name changes', () => {
  const ctx = unitContext({ PAGES: [{ fields: [{ name: 'a', type: 'text' }] }] });
  loadFile(ctx, 'screens/form/form.js');
  const s1 = ctx.schemaSig();
  assert.equal(ctx.schemaSig(), s1, 'deterministic');
  ctx.PAGES = [{ fields: [{ name: 'a', type: 'integer' }] }];   // type changed
  assert.notEqual(ctx.schemaSig(), s1);
  ctx.PAGES = [{ fields: [{ name: 'b', type: 'text' }] }];      // name changed
  assert.notEqual(ctx.schemaSig(), s1);
});

test('isFieldRequired / isFieldEmpty (media counts as filled via mediaFiles)', () => {
  const ctx = unitContext({ answers: {}, mediaFiles: {} });
  loadFile(ctx, 'screens/form/form.js');

  assert.equal(ctx.isFieldRequired({ required: 'yes' }), true);
  assert.equal(ctx.isFieldRequired({ required: 'true' }), true);
  assert.equal(ctx.isFieldRequired({ required: '' }), false);

  ctx.answers = { t: '' };
  assert.equal(ctx.isFieldEmpty({ name: 't', type: 'text' }), true);
  ctx.answers = { t: 'x' };
  assert.equal(ctx.isFieldEmpty({ name: 't', type: 'text' }), false);
  ctx.answers = {};
  ctx.mediaFiles = { p: { name: 'a.jpg' } };
  assert.equal(ctx.isFieldEmpty({ name: 'p', type: 'image' }), false, 'media present = not empty');
});

test('newId: uuid: prefix and unique', () => {
  const ctx = unitContext({ crypto: { randomUUID: crypto.randomUUID } });
  loadFile(ctx, 'core/storage.js');
  const a = ctx.newId();
  const b = ctx.newId();
  assert.match(a, /^uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.notEqual(a, b);
});
