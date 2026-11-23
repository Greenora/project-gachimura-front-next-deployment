/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node regression tests */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createECDH } = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');
const sharp = require('sharp');

function compile(file, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, require: name => dependencies[name], ...globals };
  vm.runInNewContext(source, context);
  return context.exports;
}

function worker(windows = [], storage = new Map()) {
  const handlers = new Map();
  const notifications = [];
  const opened = [];
  const self = {
    location: { origin: 'https://gachimura.test' },
    addEventListener: (event, handler) => handlers.set(event, handler),
    skipWaiting: async () => undefined,
    registration: { showNotification: async (title, options) => notifications.push({ title, options }) },
    clients: {
      claim: async () => undefined,
      matchAll: async () => windows,
      openWindow: async url => opened.push(url),
    },
  };
  const caches = { open: async () => {
    if (!storage) throw new Error('Storage unavailable');
    return {
      put: async (key, value) => storage.set(key, await value.text()),
      match: async key => storage.has(key) ? new Response(storage.get(key)) : undefined,
    };
  } };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, URL, caches, Response });
  return {
    handlers, notifications, opened,
    async dispatch(name, data) {
      let pending;
      handlers.get(name)({ ...data, waitUntil(value) { pending = value; } });
      await pending;
    },
  };
}

test('install manifest, exact icon sizes and worker headers support standalone installation', async () => {
  const manifest = compile('app/manifest.ts').default();
  assert.equal(manifest.start_url, '/home');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  for (const size of [192, 512]) {
    assert.ok(manifest.icons.some(icon => icon.sizes === `${size}x${size}` && icon.src === `/icons/icon-${size}.png`));
    const metadata = await sharp(`public/icons/icon-${size}.png`).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
  }
  const apple = await sharp('public/icons/apple-touch-icon.png').metadata();
  assert.equal(apple.width, 180);
  assert.equal(apple.height, 180);
  const config = (await import('../next.config.mjs')).default;
  const headers = (await config.headers()).find(route => route.source === '/sw.js').headers;
  assert.ok(headers.some(header => header.key === 'Cache-Control' && header.value.includes('no-store')));
  assert.ok(headers.some(header => header.key === 'Content-Security-Policy' && header.value.includes("default-src 'self'")));
  assert.equal(worker().handlers.has('fetch'), false, 'authenticated pages and APIs must not enter an offline cache');
});

test('push displays fixed generic copy and derives only the party destination', async () => {
  const app = worker();
  await app.dispatch('push', { data: { json: () => ({ partyId: 12, body: 'PRIVATE_MESSAGE_ACCOUNT_NUMBER', title: 'PRIVATE_SENDER', url: 'https://evil.example' }) } });
  assert.equal(app.notifications.length, 1);
  const notification = app.notifications[0];
  assert.equal(notification.options.data.url, '/chat/12');
  assert.equal(notification.options.tag, 'party-12');
  assert.equal(JSON.stringify(notification).includes('PRIVATE_'), false);
  for (const partyId of [-1, 0, '12', 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await app.dispatch('push', { data: { json: () => ({ partyId }) } });
    assert.equal(app.notifications.at(-1).options.data.url, '/chats');
  }
  await app.dispatch('push', { data: { json: () => { throw new Error('malformed data'); } } });
  assert.equal(app.notifications.at(-1).options.data.url, '/chats');
});

test('device language survives worker restarts while untrusted messages and push copy are ignored', async () => {
  const storage = new Map();
  const app = worker([], storage);
  const source = { url: 'https://gachimura.test/user/1' };
  await app.dispatch('message', { source, data: { type: 'PUSH_LANGUAGE', language: 'japanese' } });
  const restarted = worker([], storage);
  for (const data of [
    { source: { url: 'https://evil.example' }, data: { type: 'PUSH_LANGUAGE', language: 'korean' } },
    { source, data: { type: 'PUSH_LANGUAGE', language: 'INVALID_PRIVATE_VALUE' } },
    { source, data: { type: 'OTHER', language: 'korean' } },
  ]) await restarted.dispatch('message', data);
  await restarted.dispatch('push', { data: { json: () => ({ partyId: 12, language: 'korean', body: 'PRIVATE_MESSAGE' }) } });
  assert.equal(restarted.notifications[0].title, 'ガチムラ');
  assert.equal(restarted.notifications[0].options.body, '新しいチャットメッセージが届きました。');
  assert.equal(JSON.stringify(restarted.notifications).includes('PRIVATE_'), false);
  assert.deepEqual([...storage.values()], ['japanese'], 'only a validated language preference may be stored');
  await restarted.dispatch('message', { source, data: { type: 'PUSH_LANGUAGE', language: 'korean' } });
  await restarted.dispatch('push', {});
  assert.equal(restarted.notifications.at(-1).options.body, '새 채팅 메시지가 도착했습니다.');
  const blocked = worker([], null);
  await blocked.dispatch('message', { source, data: { type: 'PUSH_LANGUAGE', language: 'japanese' } });
  await blocked.dispatch('push', {});
  assert.equal(blocked.notifications[0].options.body, '새 채팅 메시지가 도착했습니다.');
});

test('notification click focuses the destination and rejects foreign or malformed URLs', async () => {
  const navigated = [];
  let focused = 0;
  let closed = 0;
  const client = { url: 'https://gachimura.test/home', navigate: async url => { navigated.push(url); return client; }, focus: async () => { focused++; } };
  const app = worker([client]);
  await app.dispatch('notificationclick', { notification: { data: { url: '/chat/7?ignored=1#ignored' }, close: () => { closed++; } } });
  assert.deepEqual(navigated, ['https://gachimura.test/chat/7']);
  assert.equal(focused, 1);
  assert.equal(closed, 1);
  for (const url of ['https://evil.example/chat/7', 'javascript:alert(1)', '/chat/0', '/chat/1/extra', '/chat/99999999999999999999999']) {
    await app.dispatch('notificationclick', { notification: { data: { url }, close() {} } });
    assert.equal(navigated.at(-1), 'https://gachimura.test/chats');
  }
  const fallback = worker([{ ...client, navigate: async () => { throw new Error('window closed'); } }]);
  await fallback.dispatch('notificationclick', { notification: { data: { url: '/chat/8' }, close() {} } });
  assert.deepEqual(fallback.opened, ['https://gachimura.test/chat/8']);
});

function subscriptionHelpers(registration, api) {
  return compile('app/lib/push-subscription.ts', { '@/app/hooks/useClientFetch': { clientFetch: api } }, {
    navigator: { serviceWorker: { getRegistration: async () => registration } },
    atob: value => Buffer.from(value, 'base64').toString('binary'), Uint8Array, setTimeout, clearTimeout,
  });
}

test('public VAPID bytes are validated before subscribing', () => {
  const helpers = subscriptionHelpers();
  const curve = createECDH('prime256v1');
  const publicKey = curve.generateKeys();
  assert.deepEqual(Buffer.from(helpers.vapidPublicKeyBytes(publicKey.toString('base64url'))), publicKey);
  assert.throws(() => helpers.vapidPublicKeyBytes('bad-key'), /PUSH_KEY_INVALID/);
  assert.throws(() => helpers.vapidPublicKeyBytes(Buffer.alloc(65).toString('base64url')), /PUSH_KEY_INVALID/);
});

test('logout revokes the browser subscription and closes notifications even when the API fails', async () => {
  const calls = [];
  const sub = { endpoint: 'https://push.example/private-endpoint', unsubscribe: async () => { calls.push('local'); return true; } };
  const helpers = subscriptionHelpers({
    pushManager: { getSubscription: async () => sub },
    getNotifications: async () => [{ close: () => calls.push('close') }],
  }, async (url, options) => {
    calls.push('api');
    assert.equal(url, '/push/subscriptions');
    assert.equal(options.method, 'DELETE');
    assert.equal(options.body.endpoint, sub.endpoint);
    throw new Error('private error details');
  });
  await helpers.clearPushSubscription();
  assert.deepEqual(calls, ['close', 'local', 'api']);
});

test('logout cleanup is safe without push support, and double failures never leak provider details', async () => {
  await subscriptionHelpers({}).clearPushSubscription();
  const helpers = subscriptionHelpers({
    pushManager: { getSubscription: async () => ({ endpoint: 'private', unsubscribe: async () => { throw new Error('private local failure'); } }) },
    getNotifications: async () => [],
  }, async () => { throw new Error('private API failure'); });
  await assert.rejects(helpers.clearPushSubscription(), error => error.message === 'PUSH_UNSUBSCRIBE_FAILED');
  await assert.rejects(helpers.withPushTimeout(new Promise(() => {}), 10), error => error.message === 'PUSH_TIMEOUT');
});

test('a false unsubscribe result cannot hide a failed server removal', async () => {
  const calls = [];
  const helpers = subscriptionHelpers({
    pushManager: { getSubscription: async () => ({ endpoint: 'private', unsubscribe: async () => { calls.push('local'); return false; } }) },
    getNotifications: async () => [],
  }, async () => { calls.push('api'); throw new Error('private API failure'); });
  await assert.rejects(helpers.clearPushSubscription(), error => error.message === 'PUSH_UNSUBSCRIBE_FAILED');
  assert.deepEqual(calls, ['local', 'api']);
});

test('successful server removal cannot report disabled while the browser subscription survives', async () => {
  let subscription = { endpoint: 'private', unsubscribe: async () => false };
  const helpers = subscriptionHelpers({
    pushManager: { getSubscription: async () => subscription },
    getNotifications: async () => [],
  }, async () => ({ subscribed: false }));
  await assert.rejects(helpers.clearPushSubscription(), error => error.message === 'PUSH_UNSUBSCRIBE_FAILED');
  subscription = { endpoint: 'private', unsubscribe: async () => { subscription = null; return false; } };
  await helpers.clearPushSubscription();
});
