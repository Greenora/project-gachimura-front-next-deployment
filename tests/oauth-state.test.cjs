/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node security regression tests */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { webcrypto } = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync('app/lib/oauth-state.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture() {
  const stored = new Map();
  let clock = 1_800_000_000_000;
  const context = {
    exports: {}, crypto: webcrypto, Date: { now: () => clock },
    sessionStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
      removeItem: key => stored.delete(key),
    },
  };
  vm.runInNewContext(source, context);
  return { context, stored, setTime: value => { clock = value; }, ...context.exports };
}

test('provider states use independent random values and can be consumed only once', () => {
  const f = fixture();
  const kakao = f.createOAuthState('kakao');
  const line = f.createOAuthState('line');
  assert.match(kakao, /^[a-f0-9]{64}$/);
  assert.match(line, /^[a-f0-9]{64}$/);
  assert.notEqual(kakao, line);
  assert.equal(f.consumeOAuthState('kakao', line), false);
  assert.equal(f.consumeOAuthState('kakao', kakao), false, 'a rejected callback also consumes its attempt');
  assert.equal(f.consumeOAuthState('line', line), true);
  assert.equal(f.consumeOAuthState('line', line), false, 'refresh or replay cannot reuse a completed attempt');
});

test('missing, altered and malformed callback state cannot validate an authorization code', () => {
  for (const received of [null, '', 'not-the-saved-state']) {
    const f = fixture();
    f.createOAuthState('line');
    assert.equal(f.consumeOAuthState('line', received), false);
    assert.equal(f.stored.has('line_auth_state'), false);
  }
  const empty = fixture();
  assert.equal(empty.consumeOAuthState('line', null), false, 'both values missing must not pass');
  assert.equal(empty.consumeOAuthState('line', 'a'.repeat(64)), false);
  for (const pending of ['legacy-state', '{', 'null', '[]', '{}', '{"state":4,"createdAt":1800000000000}']) {
    const f = fixture();
    f.stored.set('line_auth_state', pending);
    assert.equal(f.consumeOAuthState('line', 'a'.repeat(64)), false);
  }
});

test('expired or future state fails and beginning another login invalidates the previous one', () => {
  for (const elapsed of [600_001, -1]) {
    const f = fixture();
    const state = f.createOAuthState('kakao');
    f.setTime(1_800_000_000_000 + elapsed);
    assert.equal(f.consumeOAuthState('kakao', state), false);
  }
  const fresh = fixture();
  const state = fresh.createOAuthState('kakao');
  fresh.setTime(1_800_000_600_000);
  assert.equal(fresh.consumeOAuthState('kakao', state), true);
  const replaced = fixture();
  const previous = replaced.createOAuthState('kakao');
  const current = replaced.createOAuthState('kakao');
  assert.notEqual(previous, current);
  assert.equal(replaced.consumeOAuthState('kakao', previous), false);
  assert.equal(replaced.consumeOAuthState('kakao', current), false, 'a mismatched attempt cannot be retried');
});

test('blocked storage and missing cryptographic randomness fail safely', () => {
  const noCrypto = fixture();
  noCrypto.context.crypto = undefined;
  assert.throws(() => noCrypto.createOAuthState('line'));
  assert.equal(noCrypto.consumeOAuthState('line', null), false);
  const writeBlocked = fixture();
  writeBlocked.context.sessionStorage.setItem = () => { throw new Error('blocked storage'); };
  assert.throws(() => writeBlocked.createOAuthState('kakao'));
  for (const operation of ['getItem', 'removeItem']) {
    const f = fixture();
    const state = f.createOAuthState('kakao');
    f.context.sessionStorage[operation] = () => { throw new Error('blocked storage'); };
    assert.equal(f.consumeOAuthState('kakao', state), false);
  }
  const randomFailed = fixture();
  randomFailed.context.crypto = { getRandomValues: () => { throw new Error('random failure'); } };
  assert.throws(() => randomFailed.createOAuthState('line'));
});
