/* eslint-disable @typescript-eslint/no-require-imports -- Node hook lifecycle harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync('app/hooks/useVisiblePolling.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function mount(refresh, enabled = true, visibility = 'visible') {
  let cleanup;
  let timer;
  const listeners = new Map();
  const window = {
    setInterval(callback, delay) { assert.equal(delay, 10000); timer = callback; return 1; },
    clearInterval() { timer = undefined; },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { assert.equal(listeners.get(name), callback); listeners.delete(name); },
  };
  const document = { ...window, visibilityState: visibility };
  const context = {
    exports: {}, window, document, AbortController,
    require: () => ({ useEffect(effect) { cleanup = effect(); } }),
  };
  vm.runInNewContext(source, context);
  context.exports.useVisiblePolling(refresh, enabled);
  return {
    window, document, listeners,
    tick: () => timer?.(),
    event: name => listeners.get(name)?.(),
    unmount: () => cleanup?.(),
    hasTimer: () => Boolean(timer),
  };
}

test('visible membership refresh does not overlap, then refreshes after the next interval', async () => {
  let release;
  let calls = 0;
  const poll = mount(async () => { calls++; await new Promise(resolve => { release = resolve; }); });
  assert.equal(calls, 1, 'opening a screen must fetch fresh membership immediately');
  await poll.tick();
  await poll.event('focus');
  assert.equal(calls, 1, 'a slow request must not create simultaneous polls');
  release();
  await new Promise(setImmediate);
  const next = poll.tick();
  assert.equal(calls, 2);
  release();
  await next;
  poll.unmount();
});

test('hidden screens pause polling and returning to the screen updates immediately', async () => {
  let calls = 0;
  const poll = mount(async () => { calls++; }, true, 'hidden');
  await poll.tick();
  assert.equal(calls, 0);
  poll.document.visibilityState = 'visible';
  await poll.event('visibilitychange');
  assert.equal(calls, 1);
  poll.document.visibilityState = 'hidden';
  await poll.tick();
  assert.equal(calls, 1);
  poll.document.visibilityState = 'visible';
  await poll.event('focus');
  assert.equal(calls, 2);
  poll.unmount();
});

test('closing a screen cancels stale responses and removes timer and listeners', async () => {
  let release;
  let applied = false;
  const poll = mount(async signal => {
    await new Promise(resolve => { release = resolve; });
    if (!signal.aborted) applied = true;
  });
  poll.unmount();
  release();
  await Promise.resolve();
  assert.equal(applied, false, 'an old party response must not update a later screen');
  assert.equal(poll.hasTimer(), false);
  assert.equal(poll.listeners.size, 0);
  const disabled = mount(async () => { throw new Error('must not fetch'); }, false);
  assert.equal(disabled.hasTimer(), false);
  assert.equal(disabled.listeners.size, 0);
});
