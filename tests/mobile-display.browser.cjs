/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

test('mobile location survives navigation and failed thumbnails show a local image', { timeout: 120000 }, async t => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3101';
  const browser = await chromium.launch();
  const errors = [];
  const user = { id: 1, nickname: 'MobileTester', treeScore: 50, reviewsCount: 0 };
  const party = { id: 1, title: '사진 오류 테스트 모임', storeName: '테스트마트', content: '', status: 'RECRUITING', meetDate: '2026-11-20T10:00:00Z', host: user };
  const setup = async ({ guest = false, cache = null } = {}) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 852 } });
    if (!guest) await context.addCookies([{ name: 'accessToken', value: 'browser-fixture', url: base }]);
    await context.addInitScript(({ cache }) => {
      window.gpsRequests = 0;
      navigator.geolocation.getCurrentPosition = (_success, failure) => {
        window.gpsRequests++;
        failure({ code: 1 });
      };
      if (cache !== null) localStorage.setItem('userLocation', JSON.stringify(cache));
      window.locationLabels = [];
      new MutationObserver(() => {
        const label = document.querySelector('button span[aria-live="polite"]')?.textContent;
        if (label) window.locationLabels.push(label);
      }).observe(document, { childList: true, subtree: true, characterData: true });
    }, { cache });
    await context.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com|maps\.googleapis\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/refresh' || (guest && path === '/api/users/profile')) {
        return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      }
      if (path === '/api/users/profile') return route.fulfill({ json: user });
      if (path === '/api/parties/joined-parties') return route.fulfill({ json: [] });
      return route.fulfill({ json: path === '/api/parties' ? [party] : [] });
    });
    await context.route('**/_next/image?**', route => {
      const source = new URL(route.request().url()).searchParams.get('url');
      return source?.startsWith('http')
        ? route.fulfill({ status: 502, body: 'Fixture image unavailable' })
        : route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    return { context, page };
  };

  try {
    await t.test('the login page does not request a location', async () => {
      const { context, page } = await setup({ guest: true });
      try {
        await page.goto(base + '/login');
        await page.locator('input[type="email"]').waitFor();
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => window.gpsRequests), 0);
        assert.equal(new URL(page.url()).pathname, '/login');
      } finally { await context.close(); }
    });

    await t.test('cached location stays visible across route groups and image failures recover', async () => {
      const { context, page } = await setup({ cache: { latitude: 37.5, longitude: 127, region: '서울', district: '강남구' } });
      try {
        await page.goto(base + '/home');
        const location = page.locator('button span[aria-live="polite"]');
        await location.filter({ hasText: '서울' }).waitFor();
        const image = page.getByAltText(party.title + ' 대표 이미지');
        await page.waitForFunction(() => {
          const image = document.querySelector('img[alt="사진 오류 테스트 모임 대표 이미지"]');
          return image?.getAttribute('src')?.includes('gachimura_logo.png') && image.complete && image.naturalWidth > 0;
        });
        assert.ok((await image.getAttribute('src')).includes('gachimura_logo.png'));
        await page.evaluate(() => { window.locationLabels = []; });
        await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '채팅', exact: true }).click();
        await page.waitForURL('**/chats');
        await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '홈', exact: true }).click();
        await page.waitForURL('**/home');
        await location.filter({ hasText: '서울' }).waitFor();
        assert.equal(await page.evaluate(() => window.gpsRequests), 0);
        assert.ok((await page.evaluate(() => window.locationLabels)).every(text => !text.includes('찾는')));
      } finally { await context.close(); }
    });

    await t.test('invalid cached coordinates trigger only one permission request across consumers', async () => {
      const { context, page } = await setup({ cache: { latitude: null, longitude: null, region: '잘못된 캐시' } });
      try {
        await page.goto(base + '/home');
        await page.getByRole('status').filter({ hasText: '위치 없이도 검색과 필터' }).waitFor();
        assert.equal(await page.evaluate(() => window.gpsRequests), 1);
        await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '채팅', exact: true }).click();
        await page.waitForURL('**/chats');
        await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '홈', exact: true }).click();
        await page.waitForURL('**/home');
        await page.getByRole('status').filter({ hasText: '위치 없이도 검색과 필터' }).waitFor();
        assert.equal(await page.evaluate(() => window.gpsRequests), 1);
      } finally { await context.close(); }
    });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
