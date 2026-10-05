/* eslint-disable @typescript-eslint/no-require-imports -- Node browser check */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

test('server-controlled dev verification bypass and normal verification step', async () => {
  const browser = await chromium.launch();
  try {
    for (const bypass of [true, false]) {
      const page = await browser.newPage();
      await page.route('**/auth/check', route => route.fulfill({ json: { exists: false } }));
      await page.route('**/auth/email-verification/send', route => route.fulfill({ json: { message: 'ok', expiresInMinutes: 10, ...(bypass ? { emailVerificationToken: 'dev-test-token' } : {}) } }));
      await page.goto(`${process.env.TEST_FRONTEND_URL || 'http://localhost:3103'}/login`);
      await page.locator('[name=email]').fill('new@example.com');
      await Promise.all([
        page.waitForResponse(response => response.url().includes('/email-verification/send')),
        page.locator('[name=email]').press('Enter'),
      ]);
      const active = page.locator(bypass ? '[name=passwordRegister]' : '[name=verificationCode]');
      await active.focus();
      assert.equal(await active.isDisabled(), false);
      await page.close();
    }
  } finally { await browser.close(); }
});
