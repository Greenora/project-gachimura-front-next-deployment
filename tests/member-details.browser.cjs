/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser integration fixture */
// Start Next with INTERNAL_API_URL=http://127.0.0.1:3198/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('member details preserve edits and privacy, and signup sends normalized phone and full birthdate', { timeout: 180000 }, async t => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3121';
  const first = { id: 1, nickname: 'ContactOwner', nickname_jp: '連絡先の所有者', phone: '01011112222', birthdate: '1998-01-01', bankName: null, accountNumber: null, treeScore: 50 };
  const second = { id: 2, nickname: 'OtherMember', nickname_jp: '別の利用者', phone: '09055556666', birthdate: '2001-04-03', treeScore: 50 };
  const publicUser = user => ({ id: user.id, nickname: user.nickname, nickname_jp: user.nickname_jp, treeScore: 50 });
  const state = { user: first, failPatch: false, failSignup: false, holdProfile: false, pending: [], patches: [], signups: [] };
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://fixture').pathname;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(path === '/api/users/1' ? publicUser(first) : path === '/api/users/2' ? publicUser(second) : []));
  });
  await new Promise(resolve => server.listen(3198, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  async function pageFor(japanese = false) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.addCookies([{ name: 'accessToken', value: 'member-fixture', url: base }, ...(japanese ? [{ name: 'language', value: 'japanese', url: base }] : [])]);
    await context.addInitScript(() => localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' })));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (path === '/api/users/profile' && request.method() === 'GET') {
        if (state.holdProfile) await new Promise(resolve => state.pending.push(resolve));
        return route.fulfill(state.user ? { json: state.user } : { status: 401, json: { message: 'Unauthorized' } });
      }
      if (path === '/api/users/profile' && request.method() === 'PATCH') {
        const body = request.postDataJSON();
        state.patches.push(body);
        if (state.failPatch) return route.fulfill({ status: 503, json: { message: 'PRIVATE_DATABASE_MARKER' } });
        state.user = { ...state.user, ...body };
        return route.fulfill({ json: { success: true } });
      }
      if (path === '/api/auth/check') return route.fulfill({ json: { exists: false } });
      if (path === '/api/auth/email-verification/send') return route.fulfill({ json: { message: 'sent', expiresInMinutes: 10 } });
      if (path === '/api/auth/email-verification/verify') return route.fulfill({ json: { verified: true, emailVerificationToken: 'fixture-verification-token' } });
      if (path === '/api/auth/signup') {
        state.signups.push(request.postDataJSON());
        if (state.failSignup) return route.fulfill({ status: 503, json: { message: 'Temporary signup failure' } });
        return route.fulfill({ status: 201, json: { message: 'registered' } });
      }
      if (path === '/api/auth/refresh') return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      if (path === '/api/push/config') return route.fulfill({ json: { enabled: false, publicKey: null } });
      return route.fulfill({ json: [] });
    });
    return page;
  }

  try {
    browser = await chromium.launch();
    await t.test('owner without bank details can edit contacts; late refresh and errors preserve input; reload and clearing persist', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/home');
      const nav = page.getByRole('navigation', { name: '주 메뉴' });
      await nav.getByRole('link', { name: '내 정보', exact: true }).waitFor();
      state.holdProfile = true;
      await nav.getByRole('link', { name: '내 정보', exact: true }).click();
      const section = page.getByRole('region', { name: '연락처 및 생년월일' });
      await section.waitFor();
      const phone = section.getByLabel('전화번호', { exact: true });
      const birthdate = section.getByLabel('생년월일', { exact: true });
      assert.equal(await phone.inputValue(), first.phone);
      assert.equal(await phone.getAttribute('type'), 'tel');
      assert.equal(await phone.getAttribute('inputmode'), 'tel');
      await phone.fill('010 9876 5432');
      await birthdate.fill('2000-02-29');
      assert.ok(state.pending.length > 0, 'a profile request must actually be held while editing');
      state.user = { ...state.user, nickname: 'RefreshedOwner', phone: '01099998888', birthdate: '1999-05-06' };
      state.holdProfile = false;
      for (const release of state.pending.splice(0)) release();
      await page.getByRole('img', { name: 'RefreshedOwner profile' }).waitFor();
      assert.equal(await phone.inputValue(), '010 9876 5432', 'background profile updates must keep unsaved phone');
      assert.equal(await birthdate.inputValue(), '2000-02-29', 'background profile updates must keep unsaved birthdate');
      state.failPatch = true;
      await section.getByRole('button', { name: '저장', exact: true }).click();
      await section.getByRole('alert').waitFor();
      assert.equal(await phone.inputValue(), '010 9876 5432');
      assert.equal(await birthdate.inputValue(), '2000-02-29');
      assert.equal((await section.innerText()).includes('PRIVATE_DATABASE_MARKER'), false);
      assert.deepEqual(state.patches.at(-1), { phone: '01098765432', birthdate: '2000-02-29' });
      state.failPatch = false;
      await section.getByRole('button', { name: '저장', exact: true }).click();
      await section.getByRole('status').waitFor();
      assert.equal(await phone.inputValue(), '01098765432');
      assert.equal(state.user.bankName, null);
      assert.equal(state.user.accountNumber, null);
      await page.reload();
      await section.waitFor();
      assert.equal(await phone.inputValue(), '01098765432');
      assert.equal(await birthdate.inputValue(), '2000-02-29');
      await phone.fill('');
      await birthdate.fill('');
      await section.getByRole('button', { name: '저장', exact: true }).click();
      await section.getByRole('status').waitFor();
      assert.deepEqual(state.patches.at(-1), { phone: null, birthdate: null });
      await page.reload();
      await section.waitFor();
      assert.equal(await phone.inputValue(), '');
      assert.equal(await birthdate.inputValue(), '');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.close();
    });

    await t.test('another member profile hides private contacts and account changes reset the form', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      const section = page.getByRole('region', { name: '연락처 및 생년월일' });
      await section.waitFor();
      await section.getByLabel('전화번호', { exact: true }).fill('01000009999');
      await page.goto(base + '/user/2');
      await page.getByRole('heading', { name: second.nickname, exact: true }).waitFor();
      assert.equal(await section.count(), 0);
      assert.equal((await page.locator('body').innerText()).includes(first.phone), false);
      assert.equal((await page.locator('body').innerText()).includes(first.birthdate), false);
      state.user = { ...second };
      await page.evaluate(user => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: user })), state.user);
      await section.waitFor();
      assert.equal(await section.getByLabel('전화번호', { exact: true }).inputValue(), second.phone);
      assert.equal(await section.getByLabel('생년월일', { exact: true }).inputValue(), second.birthdate);
      await page.close();
    });

    await t.test('a partially erased date is rejected without clearing the saved birthdate', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      const section = page.getByRole('region', { name: '연락처 및 생년월일' });
      await section.waitFor();
      const birthdate = section.getByLabel('생년월일', { exact: true });
      await birthdate.focus();
      await birthdate.press('Delete');
      assert.equal(await birthdate.evaluate(input => input.validity.badInput), true);
      assert.equal(await birthdate.inputValue(), '');
      const count = state.patches.length;
      await section.getByRole('button', { name: '저장', exact: true }).click();
      await page.waitForFunction(() => document.getElementById('member-details-title')?.parentElement.querySelector('[role="alert"], [role="status"]'));
      assert.equal(state.patches.length, count, 'partial dates must not reach PATCH as a null deletion');
      assert.equal(state.user.birthdate, first.birthdate);
      assert.equal(await section.getByRole('alert').count(), 1);
      await page.close();
    });

    await t.test('Japanese contact labels and validation work without bank details', async () => {
      state.user = { ...second };
      const page = await pageFor(true);
      await page.goto(base + '/user/2');
      const section = page.getByRole('region', { name: '連絡先と生年月日' });
      await section.waitFor();
      const phone = section.getByLabel('電話番号', { exact: true });
      const birthdate = section.getByLabel('生年月日', { exact: true });
      const save = section.getByRole('button', { name: '保存', exact: true });
      const count = state.patches.length;
      await phone.fill('not-a-number');
      await save.click();
      await section.getByRole('alert').waitFor();
      assert.equal((await section.getByRole('alert').innerText()).includes('電話番号を確認'), true);
      assert.equal(state.patches.length, count);
      await phone.fill('090 1111 2222');
      await birthdate.fill('2999-01-01');
      await save.click();
      assert.equal((await section.getByRole('alert').innerText()).includes('生年月日'), true);
      assert.equal(state.patches.length, count);
      await birthdate.fill('1990-06-02');
      await save.click();
      await section.getByRole('status').waitFor();
      assert.deepEqual(state.patches.at(-1), { phone: '09011112222', birthdate: '1990-06-02' });
      assert.equal(await section.getByRole('status').innerText(), '保存しました。');
      await page.close();
    });

    await t.test('signup accepts plain, hyphenated and spaced phone input in Korean and Japanese with full birthdates', async () => {
      state.user = null;
      for (const [phone, normalized, japanese] of [
        ['01012341234', '01012341234', false],
        ['010-1234-1234', '01012341234', false],
        ['010 1234 1234', '01012341234', false],
        ['090-1234-5678', '09012345678', true],
      ]) {
        const page = await pageFor(japanese);
        await page.goto(base + '/login');
        await page.locator('[name="email"]').fill('new-member@example.test');
        await page.locator('[name="email"]').press('Enter');
        await page.locator('[name="verificationCode"]').fill('123456');
        await page.locator('[name="verificationCode"]').press('Enter');
        const phoneInput = page.locator('[name="phone"]');
        const birthInput = page.locator('[name="birthdate"]');
        await page.locator('[name="passwordRegister"]').fill('Fixture123');
        await phoneInput.fill(phone);
        await birthInput.fill('2000-02-29');
        assert.equal(await birthInput.getAttribute('type'), 'date');
        assert.equal(await birthInput.getAttribute('autocomplete'), 'bday');
        assert.equal(await phoneInput.getAttribute('type'), 'tel');
        const submit = page.getByRole('button', { name: japanese ? '会員登録する' : '회원가입 하기', exact: true });
        if (!state.signups.length) {
          state.failSignup = true;
          await Promise.all([
            page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/signup' && response.status() === 503),
            submit.click(),
          ]);
          await submit.waitFor({ state: 'visible' });
          assert.equal(await phoneInput.inputValue(), phone, 'signup failure must keep the entered phone');
          assert.equal(await birthInput.inputValue(), '2000-02-29', 'signup failure must keep the entered birthdate');
          state.failSignup = false;
        }
        await Promise.all([
          page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/signup' && response.status() === 201),
          submit.click(),
        ]);
        assert.equal(state.signups.at(-1).phone, normalized);
        assert.equal(state.signups.at(-1).birthdate, '2000-02-29');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.close();
      }
      assert.equal(state.signups.length, 5);
    });
    assert.deepEqual(errors, []);
  } finally {
    for (const release of state.pending.splice(0)) release();
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
