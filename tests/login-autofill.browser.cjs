// Run with a local Next server: NODE_PATH=<playwright node_modules> node --test tests/login-autofill.browser.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node test */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

test('autofill, Enter, unchanged email blur, and visible login errors', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const attempts = [];
    const profileCookies = [];
    await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/api/**', route => route.fulfill({ json: [] }));
    await page.route('**/auth/refresh', route => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }));
    await page.route('**/users/profile', async route => {
      const afterLogin = attempts.some(attempt => attempt.password === 'Correct123');
      const cookie = (await route.request().allHeaders()).cookie || '';
      profileCookies.push({ cookie, afterLogin });
      return cookie.includes('accessToken=autofill-session')
        ? route.fulfill({ json: { id: 1, nickname: 'Tester' } })
        : route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    });
    await page.route('**/auth/check', route => route.fulfill({ json: { exists: true } }));
    await page.route('**/auth/login', route => {
      attempts.push(route.request().postDataJSON());
      if (attempts.at(-1).password === 'Correct123') return route.fulfill({
        headers: { 'Set-Cookie': 'accessToken=autofill-session; HttpOnly; SameSite=Lax; Path=/' },
        json: { user: { nickname: 'Tester' }, expiresIn: 3600 },
      });
      return route.fulfill({ status: 401, json: { message: '이메일 또는 비밀번호가 잘못되었습니다.' } });
    });
    await page.goto(`${process.env.TEST_FRONTEND_URL || 'http://localhost:3101'}/login`);
    const email = page.locator('input[name="email"]');
    const password = page.locator('input[name="passwordLogin"]');
    await email.waitFor();
    // Native setter deliberately does not emit input/change, like a password manager.
    await email.evaluate(el => { el.value = 'autofill@example.com'; });
    await email.press('Enter');
    await password.waitFor({ state: 'visible' });
    await password.fill('Wrong123');
    await email.focus();
    await password.focus();
    assert.equal(await password.inputValue(), 'Wrong123', 'unchanged email blur must preserve password');
    await password.evaluate(el => { el.value = 'Silent123'; });
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/auth/login')),
      password.press('Enter'),
    ]);
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].password, 'Silent123');
    await page.locator('p.text-red-500, p[class*="text-red-500"]').first().waitFor();
    await password.evaluate(el => { el.value = ''; });
    await password.press('Enter');
    assert.equal(attempts.length, 1, 'empty DOM input must not reuse stale React password');
    await email.fill('changed@example.com');
    await email.press('Tab');
    assert.equal(await password.isDisabled(), true, 'edited email restarts account check');
    await email.press('Enter');
    await password.fill('Correct123');
    await Promise.all([page.waitForURL('**/home'), password.press('Enter')]);
    assert.equal(attempts.at(-1).email, 'changed@example.com');
    await page.getByText('Tester', { exact: true }).waitFor();
    const authenticatedProfiles = profileCookies.filter(request => request.afterLogin);
    assert.ok(authenticatedProfiles.length > 0, 'successful login must verify its cookie-backed profile');
    assert.ok(authenticatedProfiles.every(request => request.cookie.includes('accessToken=autofill-session')));
    const token = (await page.context().cookies()).find(cookie => cookie.name === 'accessToken');
    assert.equal(token?.value, 'autofill-session');
    assert.equal(token.httpOnly, true);
  } finally {
    await browser.close();
  }
});
