/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3199/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('navigation preserves the verified user and rejects late responses from a previous session', { timeout: 120000 }, async () => {
  const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
  const firstUser = { id: 1, nickname: 'NavigationTester', email: 'first@example.com', treeScore: 50, reviewsCount: 0 };
  const nextUser = { ...firstUser, id: 2, nickname: 'NextAccount', email: 'next@example.com' };
  const state = { user: firstUser, mode: 'hold' };
  const held = [];
  let profileArrived;
  const nextProfile = () => new Promise(resolve => { profileArrived = resolve; });
  const server = createServer((req, res) => {
    const id = Number(new URL(req.url, 'http://fixture').pathname.split('/').pop());
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url.startsWith('/api/users/') ? (id === 2 ? nextUser : firstUser) : []));
  });
  await new Promise(resolve => server.listen(3199, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.context().addCookies([{ name: 'accessToken', value: 'first-account', url: base, httpOnly: true, sameSite: 'Lax' }]);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' }));
    });
    await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === '/api/users/profile' && request.method() === 'GET') {
        let response = state.mode === 'error'
          ? { status: 500, json: { message: 'Temporary failure' } }
          : state.user
            ? { status: 200, json: { ...state.user } }
            : { status: 401, json: { message: 'Unauthorized' } };
        if (state.mode === 'hold') {
          response = await new Promise(resolve => {
            held.push({ resolve, response });
            profileArrived?.();
            profileArrived = undefined;
          });
        }
        return route.fulfill(response);
      }
      if (path === '/api/auth/logout') {
        state.user = null;
        state.mode = 'pass';
        return route.fulfill({ headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/' }, json: {} });
      }
      if (path === '/api/auth/check') return route.fulfill({ json: { exists: true } });
      if (path === '/api/auth/login') {
        state.user = nextUser;
        state.mode = 'pass';
        return route.fulfill({
          headers: { 'Set-Cookie': 'accessToken=next-account; HttpOnly; SameSite=Lax; Path=/' },
          json: { user: nextUser, expiresIn: 3600 },
        });
      }
      if (path === '/api/auth/refresh') return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      return route.fulfill({ json: [] });
    });

    await page.goto(base + '/home');
    const nav = page.getByRole('navigation', { name: '주 메뉴' });
    await nav.getByRole('button', { name: '내 정보' }).waitFor();
    assert.equal(await nav.getByRole('button', { name: '내 정보' }).isDisabled(), true);
    assert.equal(await nav.locator('a[href="/login"]').count(), 0, 'initial profile loading must not offer a wrong login destination');
    state.mode = 'pass';
    for (const request of held.splice(0)) request.resolve(request.response);
    await nav.getByRole('link', { name: '내 정보' }).waitFor();
    assert.equal(await nav.getByRole('link', { name: '내 정보' }).getAttribute('href'), '/user/1');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => { window.navigationDocument = 'preserved'; });

    state.mode = 'hold';
    let arrived = nextProfile();
    await nav.getByRole('link', { name: '채팅', exact: true }).click();
    await page.waitForURL('**/chats');
    await arrived;
    await page.getByRole('link', { name: '내 페이지 가기' }).waitFor();
    assert.equal(await nav.getByRole('link', { name: '내 정보' }).getAttribute('href'), '/user/1');

    arrived = nextProfile();
    await nav.getByRole('link', { name: '내 정보' }).click();
    await page.waitForURL('**/user/1');
    await arrived;
    await page.getByRole('button', { name: '정보 수정', exact: true }).waitFor();
    await page.evaluate(() => window.history.pushState(null, '', '/user/1?error=accountNumber'));
    const dialog = page.getByRole('dialog', { name: '프로필 및 계좌 수정' });
    await dialog.waitFor();
    await dialog.locator('#profile-nickname').fill('UnsavedNickname');
    held.pop().resolve({ status: 200, json: { ...firstUser, nickname: 'ServerNickname' } });
    await page.getByRole('img', { name: 'ServerNickname profile' }).waitFor();
    assert.equal(await dialog.locator('#profile-nickname').inputValue(), 'UnsavedNickname', 'background profile refresh must preserve unsaved form input');
    await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    await page.getByRole('button', { name: '정보 수정', exact: true }).click();
    await dialog.waitFor();
    assert.equal(await dialog.locator('#profile-nickname').inputValue(), 'ServerNickname', 'a reopened form must use the refreshed profile');
    await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    arrived = nextProfile();
    await nav.getByRole('link', { name: '홈', exact: true }).click();
    await page.waitForURL('**/home');
    await arrived;
    assert.equal(held.length, 2, 'each route revalidates one shared profile instead of remounting independent consumers');
    const current = held.pop();
    current.resolve({ status: 200, json: { ...firstUser, nickname: 'CurrentNickname' } });
    await page.getByRole('img', { name: 'CurrentNickname profile' }).waitFor();
    for (const request of held.splice(0)) request.resolve(request.response);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('img', { name: 'CurrentNickname profile' }).count(), 1, 'older route responses must not replace the most recent profile');

    state.mode = 'error';
    const failedProfile = page.waitForResponse(response => new URL(response.url()).pathname === '/api/users/profile' && response.status() === 500);
    await nav.getByRole('link', { name: '채팅', exact: true }).click();
    await failedProfile;
    assert.equal(await nav.getByRole('link', { name: '내 정보' }).getAttribute('href'), '/user/1', 'temporary errors must preserve the last verified user');

    state.mode = 'hold';
    arrived = nextProfile();
    await nav.getByRole('link', { name: '홈', exact: true }).click();
    await page.waitForURL('**/home');
    await arrived;
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await page.waitForURL('**/login');
    await page.locator('input[name="email"]').fill(nextUser.email);
    await page.locator('input[name="email"]').press('Enter');
    await page.locator('input[name="passwordLogin"]').fill('Correct123');
    await Promise.all([page.waitForURL('**/home'), page.locator('input[name="passwordLogin"]').press('Enter')]);
    assert.equal(await nav.getByRole('link', { name: '내 정보' }).getAttribute('href'), '/user/2');
    for (const request of held.splice(0)) request.resolve(request.response);
    await page.waitForLoadState('networkidle');
    assert.equal(await nav.getByRole('link', { name: '내 정보' }).getAttribute('href'), '/user/2', 'a pre-logout profile response must not restore the old account');
    assert.equal(await page.getByRole('img', { name: 'NextAccount profile' }).count(), 1);
    assert.equal(await page.evaluate(() => window.navigationDocument), 'preserved', 'normal navigation and logout must not reload the document');
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('NextAccount') || JSON.stringify(sessionStorage).includes('NextAccount')), false, 'shared profile data must remain in browser memory');

    state.user = null;
    await nav.getByRole('link', { name: '채팅', exact: true }).click();
    await page.waitForURL('**/chats');
    await nav.getByRole('link', { name: '내 정보' }).waitFor();
    await page.waitForFunction(() => document.querySelector('nav[aria-label="주 메뉴"] a:last-child')?.getAttribute('href') === '/login');
    assert.equal(await page.getByRole('link', { name: '내 페이지 가기' }).count(), 0, 'terminal 401 must invalidate the verified header immediately');
    assert.deepEqual(errors, []);
  } finally {
    for (const request of held.splice(0)) request.resolve(request.response);
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
