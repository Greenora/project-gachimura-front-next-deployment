/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Start Next with INTERNAL_API_URL=http://127.0.0.1:3199/api, then run this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('URL modals, relative time and chat opening retain their behavior', async () => {
  const user = { id: 1, nickname: 'CI Tester', treeScore: 0, reviewsCount: 0 };
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url.startsWith('/api/users/') ? user : []));
  });
  await new Promise(resolve => server.listen(3199, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
    const now = new Date('2026-10-05T00:00:00Z');
    await page.clock.install({ time: now });
    let chatRequests = 0;
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      let json = [];
      if (path.includes('/users/')) json = user;
      if (path.endsWith('/community/posts')) json = {
        items: [{ id: 1, author: user, content: 'CI post', locale: 'ko',
          createdAt: new Date(now.getTime() - 120000).toISOString(),
          likeCount: 0, commentCount: 0, likedByMe: false }],
        nextCursor: null, hasMore: false,
      };
      if (path.endsWith('/parties/joined-parties')) {
        chatRequests++;
        json = [{ id: 1, title: 'CI chat', host: user }];
      }
      return route.fulfill({ json });
    });
    await page.goto(`${base}/community?filter=popular&compose=1`);
    await page.getByText('CI post', { exact: true }).waitFor();
    await page.getByText('2분 전', { exact: true }).waitFor();
    await page.clock.fastForward(60000);
    await page.getByText('3분 전', { exact: true }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: '취소' }).click();
    await page.waitForURL('**/community?filter=popular');
    assert.equal(await page.getByRole('dialog').evaluate(el => el.classList.contains('translate-x-full')), true);
    const chatButton = page.getByRole('button', { name: '참여 중인 채팅', exact: true });
    assert.equal(chatRequests, 0);
    await chatButton.click();
    await page.getByRole('listitem').filter({ hasText: 'CI chat' }).waitFor();
    assert.equal(chatRequests, 1);
    await chatButton.click();
    assert.equal(chatRequests, 1);
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/parties/joined-parties')),
      chatButton.click(),
    ]);
    assert.equal(chatRequests, 2);

    await page.goto(`${base}/user/1?error=accountNumber&keep=1`);
    await page.getByRole('heading', { name: '프로필 및 계좌 수정' }).waitFor();
    await page.getByRole('button', { name: '취소', exact: true }).click();
    await page.waitForURL('**/user/1?keep=1');
    await page.getByRole('heading', { name: '프로필 및 계좌 수정' }).waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '정보 수정', exact: true }).click();
    await page.getByRole('heading', { name: '프로필 및 계좌 수정' }).waitFor();
    await page.getByRole('button', { name: '취소', exact: true }).click();
    await page.evaluate(() => window.history.pushState(null, '', '?error=accountNumber&keep=1'));
    await page.getByRole('heading', { name: '프로필 및 계좌 수정' }).waitFor();
    assert.deepEqual(errors, []);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
