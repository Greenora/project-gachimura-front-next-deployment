/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression fixture */
// Start Next with INTERNAL_API_URL=http://127.0.0.1:3422/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('account countries keep separate drafts while saving one settlement account', { timeout: 180000 }, async t => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3142';
  const korean = { accountCountry: 'KR', bankName: '토스뱅크', bankCode: '089', bankBranchName: null, bankBranchCode: null, accountType: null, accountNumber: '100020003000', accountHolder: 'Korean fixture' };
  const initial = { id: 1, nickname: 'Account fixture', nickname_jp: null, phone: null, birthdate: null, treeScore: 50, ...korean };
  const state = { user: { ...initial }, patches: [], failPatch: false };
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url.startsWith('/api/users/') ? { id: 1, nickname: initial.nickname, treeScore: 50 } : []));
  });
  await new Promise(resolve => server.listen(3422, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  async function newPage() {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.addCookies([{ name: 'accessToken', value: 'account-country-fixture', url: base }]);
    await context.addInitScript(() => localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' })));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === '/api/users/profile' && request.method() === 'GET') return route.fulfill({ json: state.user });
      if (path === '/api/users/profile' && request.method() === 'PATCH') {
        const body = request.postDataJSON();
        state.patches.push(body);
        if (state.failPatch) return route.fulfill({ status: 503, json: { message: 'fixture failure' } });
        state.user = { ...state.user, ...body };
        return route.fulfill({ json: { success: true } });
      }
      if (path === '/api/push/config') return route.fulfill({ json: { enabled: false, publicKey: null } });
      return route.fulfill({ json: [] });
    });
    await page.goto(base + '/user/1');
    await page.getByRole('button', { name: '정보 수정', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '정보 수정', exact: true });
    await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
    return { page, dialog };
  }
  const countryButton = (dialog, country) => dialog.getByRole('button', { name: country === 'KR' ? '한국 계좌' : '일본 계좌', exact: true });
  async function fillJapanese(dialog) {
    await dialog.locator('#profile-bank').fill('Japan fixture bank');
    await dialog.locator('#profile-bank-branch').fill('Japan fixture branch');
    await dialog.locator('#profile-bank-branch-code').fill('123');
    await dialog.locator('#profile-account-number').fill('7654321');
    await dialog.locator('#profile-account-holder').fill('Japan fixture holder');
  }
  const saveBank = dialog => dialog.getByRole('button', { name: '계좌정보 저장', exact: true });
  try {
    browser = await chromium.launch();
    await t.test('switching never copies values and saving a different country replaces all account fields', async () => {
      state.user = { ...initial };
      state.patches = [];
      const { page, dialog } = await newPage();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), korean.accountNumber);
      await countryButton(dialog, 'JP').click();
      for (const id of ['profile-bank', 'profile-account-number', 'profile-account-holder', 'profile-bank-branch']) assert.equal(await dialog.locator('#' + id).inputValue(), '');
      await fillJapanese(dialog);
      await countryButton(dialog, 'KR').click();
      assert.equal(await dialog.locator('#profile-bank').inputValue(), korean.bankName);
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), korean.accountNumber);
      await dialog.locator('#profile-account-number').fill('999988887777');
      await countryButton(dialog, 'JP').click();
      assert.equal(await dialog.locator('#profile-bank').inputValue(), 'Japan fixture bank');
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321');
      assert.equal(state.patches.length, 0, 'country switching never writes to the profile');
      await saveBank(dialog).click();
      await dialog.locator('button[type="submit"]:not([disabled])').waitFor();
      assert.equal(await dialog.isVisible(), true, 'saving one country preserves another unsaved country draft');
      assert.deepEqual(state.patches.at(-1), { accountCountry: 'JP', bankName: 'Japan fixture bank', bankCode: null, bankBranchName: 'Japan fixture branch', bankBranchCode: '123', accountType: 'FUTSU', accountNumber: '7654321', accountHolder: 'Japan fixture holder' });
      await countryButton(dialog, 'KR').click();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '999988887777');
      await saveBank(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { ...korean, accountNumber: '999988887777' });
      await page.getByRole('button', { name: '정보 수정', exact: true }).click();
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '999988887777');
      await countryButton(dialog, 'JP').click();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '', 'only the saved account persists after closing the editor');
      assert.match(await dialog.innerText(), /계좌는 1개/);
      await page.context().close();
    });

    await t.test('late profile refresh updates untouched saved fields without replacing either country draft', async () => {
      state.user = { ...initial };
      state.patches = [];
      const { page, dialog } = await newPage();
      await dialog.locator('#profile-account-holder').fill('Unsaved Korean holder');
      await countryButton(dialog, 'JP').click();
      await fillJapanese(dialog);
      state.user = { ...state.user, nickname: 'Refreshed fixture', accountNumber: '123400005678', accountHolder: 'Server holder' };
      await page.evaluate(user => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: user })), state.user);
      await page.getByRole('img', { name: 'Refreshed fixture profile' }).waitFor();
      assert.equal(await countryButton(dialog, 'JP').getAttribute('aria-pressed'), 'true');
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321');
      await countryButton(dialog, 'KR').click();
      assert.equal(await dialog.locator('#profile-account-holder').inputValue(), 'Unsaved Korean holder');
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '123400005678');
      await saveBank(dialog).click();
      await dialog.locator('button[type="submit"]:not([disabled])').waitFor();
      assert.deepEqual(state.patches.at(-1), { accountCountry: 'KR', accountHolder: 'Unsaved Korean holder' });
      await countryButton(dialog, 'JP').click();
      assert.equal(await dialog.locator('#profile-bank').inputValue(), 'Japan fixture bank');
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321');
      await page.context().close();
    });

    await t.test('basic saving and failed bank saving preserve country drafts without leaking bank fields', async () => {
      state.user = { ...initial };
      state.patches = [];
      const { page, dialog } = await newPage();
      await countryButton(dialog, 'JP').click();
      await fillJapanese(dialog);
      await dialog.getByRole('tab', { name: '기본정보', exact: true }).click();
      await dialog.locator('#profile-nickname').fill('Renamed fixture');
      await dialog.getByRole('button', { name: '기본정보 저장', exact: true }).click();
      await dialog.locator('button[type="submit"]:not([disabled])').waitFor();
      assert.deepEqual(state.patches.at(-1), { nickname: 'Renamed fixture' });
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      assert.equal(await countryButton(dialog, 'JP').getAttribute('aria-pressed'), 'true');
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321');
      state.failPatch = true;
      await saveBank(dialog).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321');
      await countryButton(dialog, 'KR').click();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), korean.accountNumber);
      assert.equal(state.user.accountCountry, 'KR');
      state.failPatch = false;
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      await page.context().close();
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
