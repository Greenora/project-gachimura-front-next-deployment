// Run with a local Next server: NODE_PATH=<playwright node_modules> node --test tests/login-session.browser.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node test */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
const user = { id: 1, nickname: 'SessionTester', treeScore: 0, reviewsCount: 0 };
const sessionCookie = 'accessToken=browser-session';

async function prepareLogin(page, issueCookie, rejectCookie = false) {
  const requests = [];
  await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const cookie = (await request.allHeaders()).cookie || '';
    requests.push({ path, cookie, page: new URL(page.url()).pathname });
    if (path === '/api/auth/check') return route.fulfill({ json: { exists: true } });
    if (path === '/api/auth/login') return route.fulfill({
      headers: issueCookie ? { 'Set-Cookie': `${sessionCookie}; HttpOnly; SameSite=Lax; Path=/` } : {},
      json: { user, expiresIn: 3600 },
    });
    if (path === '/api/auth/refresh' || rejectCookie || !cookie.split(/;\s*/).includes(sessionCookie)) {
      return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    }
    if (path === '/api/users/profile') return route.fulfill({ json: user });
    if (path === '/api/community/topics/trending') return route.fulfill({ json: { topics: [] } });
    if (path === '/api/community/posts') return route.fulfill({ json: {
      items: [{ id: 1, author: user, content: '로그인 세션을 유지한 게시글', locale: 'ko',
        createdAt: new Date().toISOString(), likeCount: 0, commentCount: 0, likedByMe: false }],
      nextCursor: null, hasMore: false,
    } });
    return route.fulfill({ json: [] });
  });
  await page.goto(`${base}/login`);
  await page.locator('input[name="email"]').fill('session@example.com');
  await page.locator('input[name="email"]').press('Enter');
  await page.locator('input[name="passwordLogin"]').fill('Correct123');
  return requests;
}

for (const issueCookie of [false, true]) {
test(`login HTTP success with ${issueCookie ? 'a rejected cookie' : 'no cookie'} stays on login and explains the failure`, async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const requests = await prepareLogin(page, issueCookie, true);
    const navigations = [];
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations.push(new URL(frame.url()).pathname); });
    await page.locator('input[name="passwordLogin"]').press('Enter');
    await page.locator('p').filter({ hasText: '로그인을 유지하지 못했습니다. 다시 시도해주세요.' }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/login');
    assert.ok(!navigations.includes('/home'), 'a successful response body alone must never navigate home');
    assert.ok(requests.some(request => request.path === '/api/users/profile'), 'the login response must be checked against the authenticated profile');
    assert.ok(requests.filter(request => request.path === '/api/users/profile').every(request => request.cookie.split(/;\s*/).includes(sessionCookie) === issueCookie));
    assert.equal((await page.context().cookies()).some(cookie => cookie.name === 'accessToken'), issueCookie);
    assert.equal(await page.locator('input[name="passwordLogin"]').isEnabled(), true, 'failed session setup must allow retry');
  } finally {
    await browser.close();
  }
});
}

test('browser stores the login cookie and sends it through home to the community feed', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const requests = await prepareLogin(page, true);
    await Promise.all([page.waitForURL('**/home'), page.locator('input[name="passwordLogin"]').press('Enter')]);
    await page.getByText(user.nickname, { exact: true }).waitFor();
    const token = (await page.context().cookies(base)).find(cookie => cookie.name === 'accessToken');
    assert.equal(token?.value, 'browser-session', 'the HTTP Set-Cookie must actually enter the browser cookie store');
    assert.equal(token.httpOnly, true);
    assert.equal(token.path, '/');
    assert.equal(await page.evaluate(() => document.cookie.includes('accessToken=')), false, 'the session must remain HttpOnly');
    assert.ok(requests.some(request => request.path === '/api/users/profile' && request.page === '/login' && request.cookie.split(/;\s*/).includes(sessionCookie)), 'cookie-backed profile verification must precede the home navigation');

    const communityProfileResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/parties/user/1');
    await page.getByRole('link', { name: '커뮤니티', exact: true }).filter({ visible: true }).click();
    await page.waitForURL('**/community');
    await page.getByText('로그인 세션을 유지한 게시글', { exact: true }).waitFor();
    await communityProfileResponse;
    const protectedRequests = requests.filter(request => request.path === '/api/users/profile' || request.path === '/api/community/posts' || request.path === '/api/parties/user/1');
    assert.ok(protectedRequests.some(request => request.path === '/api/community/posts'));
    assert.ok(protectedRequests.some(request => request.path === '/api/parties/user/1'), 'community must finish its authenticated profile-dependent request');
    assert.ok(protectedRequests.every(request => request.cookie.split(/;\s*/).includes(sessionCookie)), 'all authenticated requests must carry the stored session');
    assert.equal(requests.some(request => request.path === '/api/auth/refresh'), false, 'a fresh login cookie must not need recovery');
    assert.equal(new URL(page.url()).pathname, '/community');
  } finally {
    await browser.close();
  }
});
