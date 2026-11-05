/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser integration fixture */
// Start Next with INTERNAL_API_URL=http://127.0.0.1:3198/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('unified profile editing keeps private details, bank accounts and direct birthdate input safe', { timeout: 240000 }, async t => {
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
  async function openEditor(page, japanese = false) {
    await page.getByRole('button', { name: japanese ? 'プロフィール編集' : '정보 수정', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: japanese ? 'プロフィール編集' : '정보 수정', exact: true });
    await dialog.waitFor();
    return dialog;
  }
  const basicSave = dialog => dialog.getByRole('button', { name: '기본정보 저장', exact: true });

  try {
    browser = await chromium.launch();
    await t.test('basic editing needs no bank; late refresh, failure, retry, clearing and reload preserve data', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/home');
      const nav = page.getByRole('navigation', { name: '주 메뉴' });
      await nav.getByRole('link', { name: '내 정보', exact: true }).waitFor();
      state.holdProfile = true;
      await nav.getByRole('link', { name: '내 정보', exact: true }).click();
      const dialog = await openEditor(page);
      const phone = dialog.locator('#profile-phone');
      const birthdate = dialog.locator('#profile-birthdate');
      assert.equal(await phone.inputValue(), first.phone);
      assert.equal(await phone.getAttribute('type'), 'tel');
      assert.equal(await phone.getAttribute('inputmode'), 'tel');
      assert.equal(await birthdate.getAttribute('type'), 'text');
      assert.equal(await birthdate.getAttribute('inputmode'), 'numeric');
      await phone.fill('010 9876 5432');
      await birthdate.fill('20000229');
      assert.ok(state.pending.length > 0, 'a real profile request is held while editing');
      state.user = { ...state.user, nickname: 'RefreshedOwner', phone: '01099998888', birthdate: '1999-05-06' };
      state.holdProfile = false;
      for (const release of state.pending.splice(0)) release();
      await page.getByRole('img', { name: 'RefreshedOwner profile' }).waitFor();
      assert.equal(await phone.inputValue(), '010 9876 5432');
      assert.ok(['20000229', '2000-02-29'].includes(await birthdate.inputValue()));
      state.failPatch = true;
      await basicSave(dialog).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(await phone.inputValue(), '010 9876 5432');
      assert.ok(['20000229', '2000-02-29'].includes(await birthdate.inputValue()));
      assert.equal((await dialog.innerText()).includes('PRIVATE_DATABASE_MARKER'), false);
      assert.deepEqual(state.patches.at(-1), { phone: '01098765432', birthdate: '2000-02-29' });
      state.failPatch = false;
      await basicSave(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: '정보 수정', exact: true }).evaluate(button => document.activeElement === button), true, 'saving restores keyboard focus to the edit trigger');
      assert.equal(state.user.bankName, null);
      assert.equal(state.user.accountNumber, null);
      await page.reload();
      await openEditor(page);
      assert.equal(await phone.inputValue(), '01098765432');
      assert.equal(await birthdate.inputValue(), '2000-02-29');
      await phone.fill('');
      await birthdate.fill('');
      await basicSave(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: null, birthdate: null });
      await page.reload();
      await openEditor(page);
      assert.equal(await phone.inputValue(), '');
      assert.equal(await birthdate.inputValue(), '');
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      await page.context().close();
    });

    await t.test('private fields are absent outside the editor and another member profile; account changes reset edits', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      await page.getByRole('button', { name: '정보 수정', exact: true }).waitFor();
      assert.equal(await page.locator('#profile-phone').count(), 0, 'there is no standalone contact card');
      const dialog = await openEditor(page);
      await dialog.locator('#profile-phone').fill('01000009999');
      await page.goto(base + '/user/2');
      await page.getByRole('heading', { name: second.nickname, exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: '정보 수정', exact: true }).count(), 0);
      assert.equal(await page.locator('#profile-phone').count(), 0);
      assert.equal((await page.locator('body').innerText()).includes(first.phone), false);
      assert.equal((await page.locator('body').innerText()).includes(first.birthdate), false);
      state.user = { ...second };
      await page.evaluate(user => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: user })), state.user);
      await openEditor(page);
      assert.equal(await dialog.locator('#profile-phone').inputValue(), second.phone);
      assert.equal(await dialog.locator('#profile-birthdate').inputValue(), second.birthdate);
      await page.context().close();
    });

    await t.test('partial and impossible birthday text never clears an existing birthdate; cancel discards edits', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      const dialog = await openEditor(page);
      const birthdate = dialog.locator('#profile-birthdate');
      const count = state.patches.length;
      for (const value of ['2000-02', '20010229', '2999-01-01']) {
        await birthdate.fill(value);
        await basicSave(dialog).click();
        await dialog.getByRole('alert').waitFor();
        assert.equal(state.patches.length, count);
        assert.equal(state.user.birthdate, first.birthdate);
        assert.equal(await birthdate.inputValue(), value);
      }
      await dialog.getByRole('button', { name: '취소', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: '정보 수정', exact: true }).evaluate(button => document.activeElement === button), true, 'cancel restores keyboard focus to the edit trigger');
      await openEditor(page);
      assert.equal(await birthdate.inputValue(), first.birthdate);
      assert.equal(state.patches.length, count, 'cancel must never write to the API');
      await page.context().close();
    });

    await t.test('tabs retain drafts and basic saves cannot overwrite a Japanese account in the Korean UI', async () => {
      const bank = { accountCountry: 'JP', bankName: 'Fixture JP Bank', bankCode: null, bankBranchName: 'Fixture branch', bankBranchCode: '123', accountType: 'FUTSU', accountNumber: '1234567', accountHolder: 'Fixture Member' };
      state.user = { ...first, ...bank };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      const dialog = await openEditor(page);
      await dialog.locator('#profile-nickname').fill('New fixture nickname');
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      assert.equal(await dialog.getByRole('button', { name: '일본 계좌', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await dialog.locator('#profile-bank').inputValue(), bank.bankName);
      assert.equal(await dialog.locator('#profile-bank-branch').inputValue(), bank.bankBranchName);
      await dialog.locator('#profile-account-number').fill('7654321');
      await dialog.getByRole('tab', { name: '기본정보', exact: true }).click();
      assert.equal(await dialog.locator('#profile-nickname').inputValue(), 'New fixture nickname');
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321');
      await dialog.getByRole('tab', { name: '기본정보', exact: true }).click();
      await page.evaluate(() => { window.profileDocument = 'preserved'; });
      await basicSave(dialog).click();
      await page.locator('h1').filter({ hasText: 'New fixture nickname' }).waitFor();
      assert.equal(await dialog.isVisible(), true, 'saving basic details must keep an unsaved bank draft open');
      assert.deepEqual(state.patches.at(-1), { nickname: 'New fixture nickname' });
      for (const [key, value] of Object.entries(bank)) assert.equal(state.user[key], value, 'basic save preserves bank field ' + key);
      assert.equal(await page.evaluate(() => window.profileDocument), 'preserved', 'saving must not reload the document');
      const patchCount = state.patches.length;
      await basicSave(dialog).click();
      assert.equal(await dialog.isVisible(), true, 'a no-op save must not discard the other tab draft');
      assert.equal(state.patches.length, patchCount, 'an unchanged tab does not issue another PATCH');
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '7654321', 'unsaved bank input survives saving the other tab');
      await dialog.getByRole('button', { name: '계좌정보 저장', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      const patch = state.patches.at(-1);
      assert.deepEqual(patch, { accountCountry: 'JP', accountNumber: '7654321' });
      assert.equal(Object.hasOwn(patch, 'bankBranchName'), false);
      assert.equal(state.user.bankBranchName, bank.bankBranchName);
      for (const field of ['nickname', 'nickname_jp', 'phone', 'birthdate']) assert.equal(Object.hasOwn(patch, field), false);
      assert.equal(state.user.nickname, 'New fixture nickname');
      await page.context().close();
    });

    await t.test('bank edits preserve refreshed untouched fields and saving either tab keeps the other draft', async () => {
      const bank = { accountCountry: 'JP', bankName: 'Fixture JP Bank', bankCode: null, bankBranchName: 'Fixture branch', bankBranchCode: '123', accountType: 'FUTSU', accountNumber: '1234567', accountHolder: 'Fixture Member' };
      state.user = { ...first, ...bank };
      const page = await pageFor();
      await page.goto(base + '/home');
      const nav = page.getByRole('navigation', { name: '주 메뉴' });
      await nav.getByRole('link', { name: '내 정보', exact: true }).waitFor();
      state.holdProfile = true;
      await nav.getByRole('link', { name: '내 정보', exact: true }).click();
      const dialog = await openEditor(page);
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      await dialog.locator('#profile-account-holder').fill('Updated fixture holder');
      try {
        assert.ok(state.pending.length > 0, 'a real profile refresh is held during bank editing');
        state.user = { ...state.user, nickname: 'RefreshedBankOwner', accountNumber: '2468135' };
      } finally {
        state.holdProfile = false;
        for (const release of state.pending.splice(0)) release();
      }
      await page.getByRole('img', { name: 'RefreshedBankOwner profile' }).waitFor();
      assert.equal(await dialog.locator('#profile-account-holder').inputValue(), 'Updated fixture holder');
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '2468135', 'untouched bank input follows the fresh profile');
      await dialog.getByRole('button', { name: '계좌정보 저장', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { accountCountry: 'JP', accountHolder: 'Updated fixture holder' });
      assert.equal(state.user.accountNumber, '2468135', 'saving the holder never rolls back a refreshed account number');

      await openEditor(page);
      await dialog.locator('#profile-phone').fill('010 2222 3333');
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      await dialog.locator('#profile-account-number').fill('7654321');
      await dialog.getByRole('button', { name: '계좌정보 저장', exact: true }).click();
      await dialog.locator('button[type="submit"]:not([disabled])').waitFor();
      assert.equal(await dialog.isVisible(), true, 'saving the bank keeps an unsaved basic draft open');
      assert.deepEqual(state.patches.at(-1), { accountCountry: 'JP', accountNumber: '7654321' });
      assert.equal(state.user.phone, first.phone, 'bank saving does not also submit the basic draft');
      const patchCount = state.patches.length;
      await dialog.getByRole('button', { name: '계좌정보 저장', exact: true }).click();
      assert.equal(await dialog.isVisible(), true, 'a no-op bank save keeps the basic draft open');
      assert.equal(state.patches.length, patchCount);
      await dialog.getByRole('tab', { name: '기본정보', exact: true }).click();
      assert.equal(await dialog.locator('#profile-phone').inputValue(), '010 2222 3333');
      await basicSave(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: '01022223333' });
      assert.equal(state.user.accountNumber, '7654321');
      await openEditor(page);
      await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).click();
      await dialog.getByRole('button', { name: '한국 계좌', exact: true }).click();
      await dialog.locator('#profile-bank').selectOption({ label: '신한은행' });
      await dialog.getByRole('button', { name: '계좌정보 저장', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), {
        accountCountry: 'KR', bankName: '신한은행', bankCode: '088',
        bankBranchName: null, bankBranchCode: null, accountType: null,
        accountNumber: '7654321', accountHolder: 'Updated fixture holder',
      }, 'an intentional country change submits a complete, consistent bank group');
      await page.context().close();
    });

    await t.test('missing-account redirects open the bank tab but still allow independent basic changes', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/user/1?error=accountNumber');
      const dialog = page.getByRole('dialog', { name: '정보 수정', exact: true });
      await dialog.waitFor();
      assert.equal(await dialog.getByRole('tab', { name: '정산 계좌', exact: true }).getAttribute('aria-selected'), 'true');
      await dialog.getByRole('tab', { name: '기본정보', exact: true }).click();
      await dialog.locator('#profile-phone').fill('010-4444-5555');
      await basicSave(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: '01044445555' });
      assert.equal(state.user.accountNumber, null);
      assert.equal(new URL(page.url()).searchParams.has('error'), false);
      await page.context().close();
    });

    await t.test('Japanese labels validate direct contact input without requiring a bank account', async () => {
      state.user = { ...second };
      const page = await pageFor(true);
      await page.goto(base + '/user/2');
      const dialog = await openEditor(page, true);
      const phone = dialog.locator('#profile-phone');
      const birthdate = dialog.locator('#profile-birthdate');
      const save = dialog.getByRole('button', { name: '基本情報を保存', exact: true });
      const count = state.patches.length;
      await phone.fill('not-a-number');
      await save.click();
      await dialog.getByRole('alert').waitFor();
      assert.ok((await dialog.getByRole('alert').innerText()).includes('電話番号'));
      assert.equal(state.patches.length, count);
      await phone.fill('090 1111 2222');
      await birthdate.fill('2999-01-01');
      await save.click();
      assert.ok((await dialog.getByRole('alert').innerText()).includes('生年月日'));
      assert.equal(state.patches.length, count);
      await birthdate.fill('19900602');
      await save.click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: '09011112222', birthdate: '1990-06-02' });
      await page.context().close();
    });

    await t.test('signup accepts direct dates, phone formatting and optional contact fields in Korean and Japanese', async () => {
      state.user = null;
      const startingCount = state.signups.length;
      for (const [phone, normalized, japanese, birthdate] of [
        ['01012341234', '01012341234', false, '20000229'],
        ['010-1234-1234', '01012341234', false, '2000-02-29'],
        ['010 1234 1234', '01012341234', false, '20000229'],
        ['090-1234-5678', '09012345678', true, '20000229'],
        ['', null, false, ''],
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
        await birthInput.fill(birthdate);
        assert.equal(await birthInput.getAttribute('type'), 'text');
        assert.equal(await birthInput.getAttribute('inputmode'), 'numeric');
        assert.equal(await birthInput.getAttribute('autocomplete'), 'bday');
        assert.equal(await phoneInput.getAttribute('type'), 'tel');
        const submit = page.getByRole('button', { name: japanese ? '会員登録する' : '회원가입 하기', exact: true });
        if (state.signups.length === startingCount) {
          state.failSignup = true;
          await Promise.all([
            page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/signup' && response.status() === 503),
            submit.click(),
          ]);
          await submit.waitFor({ state: 'visible' });
          assert.equal(await phoneInput.inputValue(), phone);
          assert.equal(await birthInput.inputValue(), '2000-02-29');
          state.failSignup = false;
        }
        await Promise.all([
          page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/signup' && response.status() === 201),
          submit.click(),
        ]);
        if (normalized) {
          assert.equal(state.signups.at(-1).phone, normalized);
          assert.equal(state.signups.at(-1).birthdate, '2000-02-29');
        } else {
          assert.equal(Object.hasOwn(state.signups.at(-1), 'phone'), false);
          assert.equal(Object.hasOwn(state.signups.at(-1), 'birthdate'), false);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.context().close();
      }
      assert.equal(state.signups.length - startingCount, 6);
    });
    assert.deepEqual(errors, []);
  } finally {
    for (const release of state.pending.splice(0)) release();
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
