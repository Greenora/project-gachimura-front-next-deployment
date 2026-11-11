/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser integration fixture */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3431/api before this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdirSync } = require('node:fs');
const { chromium } = require('playwright');

test('site chat notices and session badges work without requesting browser permission', { timeout: 120000 }, async () => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3146';
  const users = { 1: { id: 1, nickname: '예시 사용자' }, 2: { id: 2, nickname: '다른 사용자' } };
  const sockets = new Map();
  const contexts = [];
  const errors = [];
  let currentUser = 1;
  let nextMessageId = 1;
  function response(path, userId) {
    if (path === '/api/users/profile') return users[userId];
    if (path === '/api/push/config') return { enabled: false, publicKey: null };
    if (path === '/api/parties/joined-parties') return [{ id: 1, title: '함께 장보기', host: users[1] }];
    if (/^\/api\/parties\/\d+$/.test(path)) return { id: Number(path.split('/').at(-1)), title: '함께 장보기', status: 'RECRUITING', meetingDate: '2027-01-01T12:00:00Z', location: { name: '테스트 매장' }, host: users[1], hostId: 1 };
    if (/^\/api\/party-members\/\d+$/.test(path)) return [1, 2].map(userId => ({ userId, status: 'APPROVED', user: users[userId] }));
    if (path.startsWith('/api/reviews')) return { canReview: false, hasReviewed: false };
    if (path.startsWith('/api/settlements')) return null;
    return [];
  }
  const server = createServer((request, res) => {
    const userId = Number(request.headers.authorization?.match(/notice-user-(\d+)/)?.[1] || currentUser);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response(new URL(request.url, 'http://fixture').pathname, userId)));
  });
  await new Promise(resolve => server.listen(3431, '127.0.0.1', resolve));
  let browser;
  async function openPage(width = 1280) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    contexts.push(context);
    await context.addCookies([{ name: 'accessToken', value: `notice-user-${currentUser}`, url: base }]);
    await context.addInitScript(() => {
      localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' }));
      window.fixturePermissionRequests = 0;
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.fixtureVisibility || 'visible' });
      if ('Notification' in window) Notification.requestPermission = async () => { window.fixturePermissionRequests++; return 'denied'; };
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (url.pathname.startsWith('/api/')) return route.fulfill({ json: response(url.pathname, currentUser) });
      return route.continue();
    });
    await page.routeWebSocket(/socket\.io/, socket => {
      const owner = currentUser;
      const owned = sockets.get(page) || new Set();
      const entry = { socket, owner };
      owned.add(entry);
      sockets.set(page, owned);
      socket.onClose(() => owned.delete(entry));
      socket.send('0{"sid":"notice-fixture","upgrades":[],"pingInterval":25000,"pingTimeout":20000}');
      socket.onMessage(message => {
        if (message === '40') return socket.send('40{"sid":"notice-fixture"}');
        if (message === '2') return socket.send('3');
        const match = /^42(\d+)?(\[.*)$/.exec(String(message));
        if (!match) return;
        const [, ack, encoded] = match;
        const [event] = JSON.parse(encoded);
        if (event === 'joinRoom' && ack) socket.send(`43${ack}[{"ok":true}]`);
      });
    });
    await page.goto(base + '/home');
    await page.getByRole('heading', { name: '지금 바로 참여 가능한 모임', exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('a[href="/user/1"]'));
    await new Promise(resolve => setTimeout(resolve, 100));
    return page;
  }
  const badge = page => page.locator('span[aria-label^="이 탭의 새 채팅"]:visible');
  const notice = page => page.getByRole('button', { name: '채팅방 보기', exact: true });
  const noNotices = page => page.waitForFunction(() => ![...document.querySelectorAll('button')].some(button => button.textContent === '채팅방 보기'));
  async function emit(page, payload) {
    const owned = [...(sockets.get(page) || [])].filter(value => value.owner === currentUser);
    assert.ok(owned.length, 'authenticated global socket exists');
    for (const { socket } of owned) socket.send(`42${JSON.stringify(['chatNotification', payload])}`);
    await page.waitForTimeout(25);
  }
  try {
    browser = await chromium.launch();
    const page = await openPage();
    await page.evaluate(() => { window.notificationDocument = 'same-document'; });
    const payload = { partyId: 1, messageId: nextMessageId++, message: 'PRIVATE_BANK_MESSAGE', nickname: 'PRIVATE_SENDER' };
    await emit(page, payload);
    await notice(page).waitFor();
    await badge(page).getByText('1', { exact: true }).waitFor();
    assert.equal((await page.locator('body').innerText()).includes('PRIVATE_'), false);
    await emit(page, payload);
    assert.equal(await badge(page).innerText(), '1', 'duplicate event IDs are counted once');
    for (const invalid of [{ partyId: -1, messageId: 3 }, { partyId: 1, messageId: '3' }, null]) await emit(page, invalid);
    assert.equal(await badge(page).innerText(), '1');
    await notice(page).click();
    await page.waitForURL(base + '/chat/1');
    await emit(page, { partyId: 1, messageId: nextMessageId++ });
    await noNotices(page);
    await page.locator('a[href="/home"]').first().click();
    await page.waitForURL(base + '/home');
    assert.equal(await page.evaluate(() => window.notificationDocument), 'same-document', 'notification and room navigation keep the same provider session');
    assert.equal(await badge(page).count(), 0, 'entering the room clears its unread messages');
    await emit(page, { partyId: 2, messageId: nextMessageId++ });
    await badge(page).getByText('1', { exact: true }).waitFor();
    await page.evaluate(() => { window.fixtureVisibility = 'hidden'; });
    const beforeHidden = await notice(page).count();
    await emit(page, { partyId: 3, messageId: nextMessageId++ });
    assert.equal(await notice(page).count(), beforeHidden, 'hidden tabs only update the unread badge');
    await page.evaluate(() => { window.fixtureVisibility = 'visible'; document.dispatchEvent(new Event('visibilitychange')); });
    await badge(page).getByText('2', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.fixturePermissionRequests), 0, 'site notices must not request OS notification permission');
    for (const { socket } of sockets.get(page)) {
      for (let index = 0; index < 105; index++) socket.send(`42${JSON.stringify(['chatNotification', { partyId: 4, messageId: nextMessageId++ }])}`);
    }
    await badge(page).getByText('99+', { exact: true }).waitFor();

    currentUser = 2;
    await page.evaluate(user => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: user })), users[2]);
    await badge(page).waitFor({ state: 'hidden' });
    await noNotices(page);
    await page.waitForTimeout(100);
    assert.equal([...sockets.get(page)].filter(value => value.owner === 1).length, 0, 'previous user connections close');
    await emit(page, { partyId: 2, messageId: nextMessageId++ });
    await badge(page).getByText('1', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: null })));
    await badge(page).waitFor({ state: 'hidden' });
    await noNotices(page);

    currentUser = 1;
    for (const [name, width] of [['mobile', 390], ['desktop', 1280]]) {
      const sample = await openPage(width);
      await emit(sample, { partyId: 1, messageId: nextMessageId++ });
      await notice(sample).waitFor();
      await badge(sample).getByText('1', { exact: true }).waitFor();
      assert.equal(await sample.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (process.env.TEST_SCREENSHOT_DIR) {
        mkdirSync(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
        await sample.screenshot({ path: `${process.env.TEST_SCREENSHOT_DIR}/implemented-notification-${name}.png`, animations: 'disabled' });
      }
      assert.equal(await sample.evaluate(() => window.fixturePermissionRequests), 0);
    }
    assert.deepEqual(errors, []);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
