/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser integration fixture */
// Start Next with INTERNAL_API_URL=http://127.0.0.1:3198/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('unified profile editing keeps private details, bank accounts and birthdate selections safe', { timeout: 240000 }, async t => {
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
  const birthFields = (container, id = 'profile-birthdate') => ({
    year: container.locator(`#${id}-year`),
    month: container.locator(`#${id}-month`),
    day: container.locator(`#${id}-day`),
  });
  async function selectBirthdate(container, value, id) {
    const fields = birthFields(container, id);
    const [year, month, day] = value.split('-');
    await fields.year.selectOption(year);
    await fields.month.selectOption(month);
    await fields.day.selectOption(day);
  }
  async function selectedBirthdate(container, id) {
    const values = await Promise.all(Object.values(birthFields(container, id)).map(field => field.inputValue()));
    return values.every(Boolean) ? values.join('-') : '';
  }

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
      const birthdate = birthFields(dialog);
      assert.equal(await phone.inputValue(), first.phone);
      assert.equal(await phone.getAttribute('type'), 'tel');
      assert.equal(await phone.getAttribute('inputmode'), 'tel');
      assert.equal(await dialog.getByRole('combobox', { name: '태어난 연도', exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('combobox', { name: '태어난 월', exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('combobox', { name: '태어난 일', exact: true }).count(), 1);
      await phone.fill('010 9876 5432');
      await selectBirthdate(dialog, '2000-02-29');
      assert.ok(state.pending.length > 0, 'a real profile request is held while editing');
      state.user = { ...state.user, nickname: 'RefreshedOwner', phone: '01099998888', birthdate: '1999-05-06' };
      state.holdProfile = false;
      for (const release of state.pending.splice(0)) release();
      await page.getByRole('img', { name: 'RefreshedOwner profile' }).waitFor();
      assert.equal(await phone.inputValue(), '010 9876 5432');
      assert.equal(await selectedBirthdate(dialog), '2000-02-29');
      state.failPatch = true;
      await basicSave(dialog).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(await phone.inputValue(), '010 9876 5432');
      assert.equal(await selectedBirthdate(dialog), '2000-02-29');
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
      assert.equal(await selectedBirthdate(dialog), '2000-02-29');
      await phone.fill('');
      await dialog.getByRole('button', { name: '생년월일 지우기', exact: true }).click();
      assert.equal(await birthdate.month.isDisabled(), true);
      assert.equal(await birthdate.day.isDisabled(), true);
      await basicSave(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: null, birthdate: null });
      await page.reload();
      await openEditor(page);
      assert.equal(await phone.inputValue(), '');
      assert.equal(await selectedBirthdate(dialog), '');
      assert.equal(await birthdate.year.inputValue(), '');
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
      assert.equal(await selectedBirthdate(dialog), second.birthdate);
      await page.context().close();
    });

    await t.test('partial dates cannot save, impossible and future dates cannot be chosen, and cancel preserves the saved date', async () => {
      state.user = { ...first };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      const dialog = await openEditor(page);
      const birthdate = birthFields(dialog);
      const count = state.patches.length;
      await dialog.getByRole('button', { name: '생년월일 지우기', exact: true }).click();
      assert.equal(await birthdate.month.isDisabled(), true);
      assert.equal(await birthdate.day.isDisabled(), true);
      await birthdate.year.selectOption('2000');
      assert.equal(await birthdate.month.isDisabled(), false);
      assert.equal(await birthdate.day.isDisabled(), true);
      await basicSave(dialog).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(state.patches.length, count, 'a selected year alone must not clear the saved date');
      assert.equal(state.user.birthdate, first.birthdate);
      await birthdate.month.selectOption('02');
      assert.equal(await birthdate.day.isDisabled(), false);
      assert.equal(await birthdate.day.locator('option[value="30"]').count(), 0, 'February has no 30th');
      await birthdate.day.selectOption('29');
      await birthdate.year.selectOption('2001');
      assert.equal(await birthdate.day.inputValue(), '', 'changing to a non-leap year clears the 29th');
      assert.equal(await birthdate.day.locator('option[value="29"]').count(), 0);
      await basicSave(dialog).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(state.patches.length, count);
      assert.equal(state.user.birthdate, first.birthdate);
      const today = await page.evaluate(() => new Date().toISOString().slice(0, 10));
      const [year, month, day] = today.split('-');
      assert.equal(await birthdate.year.locator(`option[value="${Number(year) + 1}"]`).count(), 0, 'future years are absent');
      await birthdate.year.selectOption(year);
      if (Number(month) < 12) assert.equal(await birthdate.month.locator(`option[value="${String(Number(month) + 1).padStart(2, '0')}"]`).count(), 0, 'future months are absent');
      await birthdate.month.selectOption(month);
      assert.equal(await birthdate.day.locator(`option[value="${String(Number(day) + 1).padStart(2, '0')}"]`).count(), 0, 'future days are absent');
      await dialog.getByRole('button', { name: '취소', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await page.getByRole('button', { name: '정보 수정', exact: true }).evaluate(button => document.activeElement === button), true, 'cancel restores keyboard focus to the edit trigger');
      await openEditor(page);
      assert.equal(await selectedBirthdate(dialog), first.birthdate);
      assert.equal(state.patches.length, count, 'cancel must never write to the API');
      await page.context().close();
    });

    await t.test('an existing birthdate before 1900 stays visible and is preserved when another field changes', async () => {
      state.user = { ...first, birthdate: '1899-12-31' };
      const page = await pageFor();
      await page.goto(base + '/user/1');
      const dialog = await openEditor(page);
      assert.equal(await selectedBirthdate(dialog), '1899-12-31');
      const years = await birthFields(dialog).year.locator('option').evaluateAll(options => options.map(option => Number(option.value)).filter(Boolean));
      assert.equal(years.at(-1), 1899);
      assert.equal(years.at(-2), 1900);
      assert.ok(years.every((year, index) => !index || years[index - 1] > year), 'years are ordered newest first');
      await dialog.locator('#profile-phone').fill('01022223333');
      await basicSave(dialog).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: '01022223333' });
      assert.equal(state.user.birthdate, '1899-12-31');
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
      assert.equal(await dialog.locator('#profile-account-number').inputValue(), '', 'switching countries must not copy the Japanese account');
      assert.equal(await dialog.locator('#profile-account-holder').inputValue(), '');
      await dialog.locator('#profile-bank').selectOption({ label: '신한은행' });
      await dialog.locator('#profile-account-number').fill('110012345678');
      await dialog.locator('#profile-account-holder').fill('Korean fixture holder');
      await dialog.getByRole('button', { name: '계좌정보 저장', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), {
        accountCountry: 'KR', bankName: '신한은행', bankCode: '088',
        bankBranchName: null, bankBranchCode: null, accountType: null,
        accountNumber: '110012345678', accountHolder: 'Korean fixture holder',
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

    await t.test('Japanese labels validate contact and date selections without requiring a bank account', async () => {
      state.user = { ...second };
      const page = await pageFor(true);
      await page.goto(base + '/user/2');
      const dialog = await openEditor(page, true);
      const phone = dialog.locator('#profile-phone');
      const birthdate = birthFields(dialog);
      const save = dialog.getByRole('button', { name: '基本情報を保存', exact: true });
      const count = state.patches.length;
      await phone.fill('not-a-number');
      await save.click();
      await dialog.getByRole('alert').waitFor();
      assert.ok((await dialog.getByRole('alert').innerText()).includes('電話番号'));
      assert.equal(state.patches.length, count);
      await phone.fill('090 1111 2222');
      assert.equal(await dialog.getByRole('combobox', { name: '生まれた年', exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('combobox', { name: '生まれた月', exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('combobox', { name: '生まれた日', exact: true }).count(), 1);
      await birthdate.day.selectOption('');
      await save.click();
      await dialog.getByRole('alert').waitFor();
      assert.ok((await dialog.getByRole('alert').innerText()).includes('生年月日'));
      assert.equal(state.patches.length, count);
      await selectBirthdate(dialog, '1990-06-02');
      await save.click();
      await dialog.waitFor({ state: 'hidden' });
      assert.deepEqual(state.patches.at(-1), { phone: '09011112222', birthdate: '1990-06-02' });
      await page.context().close();
    });

    await t.test('signup validates partial dates and accepts date selections, phone formatting and optional contact fields in both languages', async () => {
      state.user = null;
      const startingCount = state.signups.length;
      for (const [phone, normalized, japanese, birthdate] of [
        ['01012341234', '01012341234', false, '2000-02-29'],
        ['010-1234-1234', '01012341234', false, '2000-02-29'],
        ['010 1234 1234', '01012341234', false, '2000-02-29'],
        ['090-1234-5678', '09012345678', true, '2000-02-29'],
        ['', null, false, ''],
      ]) {
        const page = await pageFor(japanese);
        await page.goto(base + '/login');
        await page.locator('[name="email"]').fill('new-member@example.test');
        await page.locator('[name="email"]').press('Enter');
        await page.locator('[name="verificationCode"]').fill('123456');
        await page.locator('[name="verificationCode"]').press('Enter');
        const phoneInput = page.locator('[name="phone"]');
        const birthday = birthFields(page, 'signup-birthdate');
        await page.locator('[name="passwordRegister"]').fill('Fixture123');
        await phoneInput.fill(phone);
        assert.equal(await birthday.month.isDisabled(), true);
        assert.equal(await birthday.day.isDisabled(), true);
        assert.equal(await phoneInput.getAttribute('type'), 'tel');
        const submit = page.getByRole('button', { name: japanese ? '会員登録する' : '회원가입 하기', exact: true });
        if (state.signups.length === startingCount) {
          await birthday.year.selectOption('2000');
          await birthday.month.selectOption('02');
          await submit.click();
          await page.locator('p.text-red-500').filter({ hasText: '생년월일' }).waitFor();
          assert.equal(state.signups.length, startingCount, 'React Hook Form rejects an unfinished date before calling signup');
        }
        if (birthdate) await selectBirthdate(page, birthdate, 'signup-birthdate');
        if (state.signups.length === startingCount) {
          state.failSignup = true;
          await Promise.all([
            page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/signup' && response.status() === 503),
            submit.click(),
          ]);
          await submit.waitFor({ state: 'visible' });
          assert.equal(await phoneInput.inputValue(), phone);
          assert.equal(await selectedBirthdate(page, 'signup-birthdate'), '2000-02-29');
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
