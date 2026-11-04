/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser integration fixture */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3299/api before this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { createECDH } = require('node:crypto');
const { chromium } = require('playwright');

test('PWA installation, explicit push consent, account cleanup and logout work on the owner profile', { timeout: 120000 }, async t => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3111';
  const first = { id: 1, nickname: 'PwaOwner', nickname_jp: '所有者', email: 'owner@example.test', treeScore: 50 };
  const second = { id: 2, nickname: 'NextOwner', nickname_jp: '次の所有者', email: 'next@example.test', treeScore: 50 };
  const curve = createECDH('prime256v1');
  const publicKey = curve.generateKeys().toString('base64url');
  const state = { user: first, configEnabled: true, failDelete: false, postCount: 0, deleteCount: 0, logoutCount: 0, holds: [], holdPost: false, postArrived: null, events: [] };
  function response(path, method = 'GET', body) {
    if (path === '/api/users/profile') return state.user ? { status: 200, json: state.user } : { status: 401, json: { message: 'Unauthorized' } };
    if (path === '/api/users/1') return { json: first };
    if (path === '/api/users/2') return { json: second };
    if (path === '/api/push/config') return { json: { enabled: state.configEnabled, publicKey: state.configEnabled ? publicKey : null } };
    if (path === '/api/push/subscriptions' && method === 'POST') {
      state.postCount++;
      assert.deepEqual(Object.keys(body).sort(), ['endpoint', 'keys']);
      assert.deepEqual(Object.keys(body.keys).sort(), ['auth', 'p256dh']);
      return { status: 201, json: { subscribed: true } };
    }
    if (path === '/api/push/subscriptions' && method === 'DELETE') {
      state.deleteCount++;
      state.events.push('push-delete');
      return state.failDelete ? { status: 503, json: { message: 'Private provider error must not block logout' } } : { json: { subscribed: false } };
    }
    if (path === '/api/auth/logout') {
      state.logoutCount++;
      state.events.push('auth-logout');
      state.user = null;
      return { json: {}, headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/' } };
    }
    if (path === '/api/auth/refresh') return { status: 401, json: { message: 'Unauthorized' } };
    return { json: [] };
  }
  const server = createServer((req, res) => {
    const value = response(new URL(req.url, 'http://fixture').pathname, req.method);
    res.writeHead(value.status || 200, { 'content-type': 'application/json', ...value.headers });
    res.end(JSON.stringify(value.json));
  });
  await new Promise(resolve => server.listen(3299, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  async function pageWithPush({ japanese = false, ios = false, standalone = false, permission = 'default', deny = false, mock = true } = {}) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addCookies([{ name: 'accessToken', value: 'pwa-fixture', url: base }, ...(japanese ? [{ name: 'language', value: 'japanese', url: base }] : [])]);
    await context.addInitScript(({ ios, standalone, permission, deny, mock, publicKey }) => {
      localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' }));
      if (!mock) {
        window.pwaNativePermission = Notification.permission;
        window.pwaNativePermissionCalls = 0;
        const request = Notification.requestPermission.bind(Notification);
        Notification.requestPermission = (...args) => { window.pwaNativePermissionCalls++; return request(...args); };
        return;
      }
      const fixture = window.pwaFixture = { permissionCalls: 0, gesture: false, subscribed: false, subscribeCalls: 0, unsubscribeCalls: 0, closed: 0, promptCalls: 0, localFailure: false, localFalse: false };
      if (ios) Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1' });
      if (standalone) Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
      class MockNotification {
        static permission = permission;
        static requestPermission() {
          fixture.permissionCalls++;
          fixture.gesture = navigator.userActivation.isActive;
          MockNotification.permission = deny ? 'denied' : 'granted';
          return Promise.resolve(MockNotification.permission);
        }
      }
      Object.defineProperty(window, 'Notification', { configurable: true, value: MockNotification });
      Object.defineProperty(window, 'PushManager', { configurable: true, value: function PushManager() {} });
      let activeSubscription = null;
      const createSubscription = () => {
        const subscription = {
          endpoint: `https://fcm.googleapis.com/fcm/send/pwa-fixture-${fixture.subscribeCalls}`,
          toJSON: () => ({ endpoint: subscription.endpoint, expirationTime: null, keys: { p256dh: publicKey, auth: 'AAAAAAAAAAAAAAAAAAAAAA' } }),
          unsubscribe: async () => {
            fixture.unsubscribeCalls++;
            if (fixture.localFailure) throw new Error('Private browser failure');
            if (fixture.localFalse || activeSubscription !== subscription) return false;
            activeSubscription = null;
            fixture.subscribed = false;
            return true;
          },
        };
        return subscription;
      };
      const registration = {
        pushManager: {
          getSubscription: async () => activeSubscription,
          subscribe: async options => { fixture.subscribeCalls++; fixture.userVisibleOnly = options.userVisibleOnly; fixture.subscribed = true; activeSubscription = createSubscription(); return activeSubscription; },
        },
        getNotifications: async () => [{ close: () => { fixture.closed++; } }],
      };
      Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
        register: async (url, options) => { fixture.worker = { url, ...options }; return registration; },
        ready: Promise.resolve(registration), getRegistration: async () => registration,
      } });
    }, { ios, standalone, permission, deny, mock, publicKey });
    await context.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const body = request.postData() ? JSON.parse(request.postData()) : undefined;
      const result = response(path, request.method(), body);
      if (path === '/api/push/subscriptions' && request.method() === 'POST' && state.holdPost) {
        await new Promise(resolve => { state.holds.push(resolve); state.postArrived?.(); state.postArrived = null; });
      }
      await route.fulfill(result);
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    return { page, context };
  }

  try {
    browser = await chromium.launch();
    await t.test('manifest and real browser service worker register without requesting notification permission', async () => {
      state.user = first;
      const { page, context } = await pageWithPush({ mock: false });
      try {
        await page.goto(base + '/user/1');
        const info = await page.evaluate(async () => {
          const registration = await navigator.serviceWorker.ready;
          const manifest = await fetch('/manifest.webmanifest').then(response => response.json());
          const worker = await fetch('/sw.js');
          return { scope: registration.scope, worker: registration.active.scriptURL, manifest, cache: worker.headers.get('cache-control'), permission: Notification.permission, initialPermission: window.pwaNativePermission, permissionCalls: window.pwaNativePermissionCalls };
        });
        assert.equal(info.scope, base + '/');
        assert.equal(info.worker, base + '/sw.js');
        assert.equal(info.manifest.display, 'standalone');
        assert.equal(info.manifest.start_url, '/home');
        assert.ok(info.cache.includes('no-store'));
        assert.equal(info.permission, info.initialPermission);
        assert.equal(info.permissionCalls, 0);
      } finally { await context.close(); }
    });

    await t.test('owner can install and toggle push only by clicking, and another profile has no controls', async () => {
      state.user = first;
      const { page, context } = await pageWithPush();
      try {
        await page.goto(base + '/user/1');
        const enable = page.getByRole('button', { name: '채팅 알림 켜기', exact: true });
        await enable.waitFor();
        assert.equal(await page.evaluate(() => window.pwaFixture.permissionCalls), 0);
        assert.equal(await page.evaluate(() => window.pwaFixture.subscribeCalls), 0);
        await page.evaluate(() => {
          const event = new Event('beforeinstallprompt', { cancelable: true });
          event.prompt = async () => { window.pwaFixture.promptCalls++; };
          event.userChoice = Promise.resolve({ outcome: 'accepted' });
          window.dispatchEvent(event);
        });
        await page.getByRole('button', { name: '앱 설치', exact: true }).click();
        assert.equal(await page.evaluate(() => window.pwaFixture.promptCalls), 1);
        await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
        await page.getByRole('button', { name: '설치됨', exact: true }).waitFor();
        await enable.click();
        await page.getByRole('button', { name: '채팅 알림 끄기', exact: true }).waitFor();
        assert.equal(await page.evaluate(() => window.pwaFixture.permissionCalls), 1);
        assert.equal(await page.evaluate(() => window.pwaFixture.gesture), true);
        assert.equal(await page.evaluate(() => window.pwaFixture.userVisibleOnly), true);
        await page.getByRole('button', { name: '채팅 알림 끄기', exact: true }).click();
        await enable.waitFor();
        assert.equal(await page.evaluate(() => window.pwaFixture.subscribed), false);
        assert.ok(state.deleteCount > 0);
        await page.goto(base + '/user/2');
        await page.getByRole('heading', { name: 'NextOwner', exact: true }).waitFor();
        assert.equal(await page.getByRole('heading', { name: '앱 설치 및 알림', exact: true }).count(), 0);
      } finally { await context.close(); }
    });

    await t.test('denied permissions and iPhone installation instructions are actionable in both languages', async () => {
      state.user = first;
      let fixture = await pageWithPush({ deny: true });
      try {
        await fixture.page.goto(base + '/user/1');
        await fixture.page.getByRole('button', { name: '채팅 알림 켜기', exact: true }).click();
        await fixture.page.getByText('알림이 차단되어 있습니다. 브라우저의 사이트 설정에서 허용해주세요.', { exact: true }).waitFor();
        assert.equal(await fixture.page.getByRole('button', { name: '채팅 알림 켜기', exact: true }).isDisabled(), true);
        assert.equal(await fixture.page.evaluate(() => window.pwaFixture.subscribeCalls), 0);
      } finally { await fixture.context.close(); }
      fixture = await pageWithPush({ ios: true, japanese: true });
      try {
        await fixture.page.goto(base + '/user/1');
        await fixture.page.getByText('ホーム画面に追加したアプリを開いて、通知をオンにしてください。', { exact: true }).waitFor();
        await fixture.page.getByRole('button', { name: 'アプリをインストール', exact: true }).click();
        await fixture.page.getByText('Safariの共有メニューから「ホーム画面に追加」を選んでください。', { exact: true }).waitFor();
        assert.equal(await fixture.page.evaluate(() => window.pwaFixture.permissionCalls), 0);
      } finally { await fixture.context.close(); }
    });

    await t.test('account switch revokes the old browser subscription, and failed cleanup cannot block logout', async () => {
      state.user = first;
      state.holdPost = true;
      const { page, context } = await pageWithPush();
      try {
        await page.goto(base + '/user/1');
        await page.getByRole('button', { name: '채팅 알림 켜기', exact: true }).click();
        await page.waitForFunction(() => window.pwaFixture.subscribed);
        if (!state.holds.length) await new Promise(resolve => { state.postArrived = resolve; });
        state.user = second;
        await page.evaluate(user => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: user })), second);
        await page.waitForFunction(() => !window.pwaFixture.subscribed);
        assert.equal(await page.evaluate(() => window.pwaFixture.permissionCalls), 1);
        state.holdPost = false;
        for (const release of state.holds.splice(0)) release();
        await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '내 정보', exact: true }).click();
        await page.waitForURL('**/user/2');
        await page.getByRole('button', { name: '채팅 알림 켜기', exact: true }).click();
        await page.getByRole('button', { name: '채팅 알림 끄기', exact: true }).waitFor();
        state.failDelete = true;
        await page.evaluate(() => { window.pwaFixture.localFailure = true; });
        state.events = [];
        await page.getByRole('button', { name: '로그아웃', exact: true }).click();
        await page.waitForURL('**/login');
        assert.ok(state.logoutCount > 0, 'notification cleanup errors must not block authentication logout');
        assert.equal(state.events[0], 'push-delete', 'the visible logout button must remove push before deleting its authentication session');
        assert.ok(state.events.indexOf('auth-logout') > state.events.indexOf('push-delete'));
      } finally {
        state.failDelete = false;
        state.holdPost = false;
        for (const release of state.holds.splice(0)) release();
        await context.close();
      }
    });

    await t.test('failed browser and server removal stays enabled, and normal visible logout removes push first', async () => {
      state.user = first;
      const { page, context } = await pageWithPush();
      try {
        await page.goto(base + '/user/1');
        await page.getByRole('button', { name: '채팅 알림 켜기', exact: true }).click();
        const disable = page.getByRole('button', { name: '채팅 알림 끄기', exact: true });
        await disable.waitFor();
        state.failDelete = true;
        await page.evaluate(() => { window.pwaFixture.localFalse = true; });
        await disable.click();
        await page.getByRole('alert').filter({ hasText: '알림 설정을 변경하지 못했습니다.' }).waitFor();
        await disable.waitFor();
        assert.equal(await page.evaluate(() => window.pwaFixture.subscribed), true);
        state.failDelete = false;
        await page.evaluate(() => { window.pwaFixture.localFalse = false; });
        state.events = [];
        await page.getByRole('button', { name: '로그아웃', exact: true }).click();
        await page.waitForURL('**/login');
        assert.equal(state.events[0], 'push-delete');
        assert.ok(state.events.indexOf('auth-logout') > state.events.indexOf('push-delete'));
        assert.equal(await page.evaluate(() => window.pwaFixture.subscribed), false);
      } finally {
        state.failDelete = false;
        await context.close();
      }
    });
    assert.deepEqual(errors, []);
  } finally {
    for (const release of state.holds.splice(0)) release();
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
