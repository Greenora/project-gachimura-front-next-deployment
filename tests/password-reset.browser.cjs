/* eslint-disable @typescript-eslint/no-require-imports -- Node browser check */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

test('reset request, fragment removal, confirmation mismatch, success and narrow screen', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3102';
    const requests = [];
    await page.route('**/auth/password-reset/*', route => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({ json: { message: 'ok' } });
    });
    await page.goto(`${base}/reset-password`);
    await page.locator('[name=email]').fill('test@example.com');
    await page.getByRole('button', { name: '안내 메일 받기' }).click();
    await page.getByRole('status').waitFor();
    assert.equal(requests.length, 1);
    const token = 'a'.repeat(64);
    await page.goto(`${base}/reset-password#${token}`);
    await page.locator('[name=password]').waitFor();
    assert.equal(new URL(page.url()).hash, '');
    await page.locator('[name=password]').fill('Newpass123');
    await page.locator('[name=confirmPassword]').fill('Different123');
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await page.locator('p[role="alert"]').waitFor();
    assert.equal(requests.length, 1);
    await page.locator('[name=confirmPassword]').fill('Newpass123');
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await page.getByRole('status').waitFor();
    assert.equal(requests[1].token, token);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const nextToken = 'b'.repeat(64);
    await page.evaluate(value => { window.location.hash = value; }, nextToken);
    await page.locator('[name=password]').waitFor();
    assert.equal(new URL(page.url()).hash, '');
    await page.locator('[name=password]').fill('Newpass456');
    await page.locator('[name=confirmPassword]').fill('Newpass456');
    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await page.getByRole('status').waitFor();
    assert.equal(requests[2].token, nextToken);
  } finally { await browser.close(); }
});
