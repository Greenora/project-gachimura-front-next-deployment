/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3199/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdirSync, readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { chromium } = require('playwright');

function loadTypeScript(file, dependencies = {}) {
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: name => dependencies[name] };
  vm.runInNewContext(source, context);
  return context.exports;
}
const { menu } = loadTypeScript('app/constants/menu.ts', { '../common/types': loadTypeScript('app/common/types.ts') });

test('receipt failures and empty recognition preserve drafts, and a successful retry fills items', { timeout: 120000 }, async () => {
  const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
  const user = { id: 1, nickname: '예시 방장', accountNumber: 'fixture-account' };
  const party = { id: 1, title: '함께 장보기', hostId: 1, host: user, meetingDate: '2027-01-01T12:00:00Z', location: { name: '테스트 매장' } };
  const settlement = { id: 10, partyId: 1, hostId: 1, status: 'DRAFT', totalAmount: 1000, items: [{ id: 11, name: 'Original item', quantity: 1, price: 1000 }] };
  const state = { upload: 'unavailable', attempts: 0, saves: 0, starts: 0, savedItems: [], settlement };
  const result = (path, method, body) => {
    if (path === '/api/users/profile') return { json: user };
    if (path === '/api/parties/1') return { json: party };
    if (path === '/api/party-members/1') return { json: [{ userId: 1, status: 'APPROVED', user }] };
    if (path === '/api/settlements/party/1') return { json: state.settlement };
    if (path === '/api/settlements/10/payments') return { json: [] };
    if (path === '/api/settlements/10/items' && method === 'PATCH') {
      state.saves++;
      state.savedItems = body.items;
      state.settlement = { ...settlement, items: body.items.map((item, index) => ({ id: 11 + index, ...item })) };
      return { json: state.settlement };
    }
    if (path === '/api/settlements/10/start' && method === 'PATCH') {
      state.starts++;
      state.settlement = { ...state.settlement, status: 'SELECTING' };
      return { json: state.settlement };
    }
    if (path === '/api/settlements/upload-receipt' && method === 'POST') {
      state.attempts++;
      if (state.upload === 'unavailable') return { status: 503, json: { message: 'Receipt service is unavailable', code: 'OCR_NOT_CONFIGURED' } };
      if (state.upload === 'foreign-error') return { status: 422, json: { message: 'BACKEND_KOREAN_MESSAGE_MUST_BE_TRANSLATED', code: 'OCR_CURRENCY_UNSUPPORTED' } };
      if (state.upload === 'foreign-success') return { json: { items: [{ name: 'USD item', price: 500, quantity: 1 }], totalPrice: 500, currency: 'USD' } };
      if (state.upload === 'japanese') return { json: { items: [{ name: 'おにぎり', price: 160, quantity: 2 }, { name: 'お茶', price: 120, quantity: 1 }], totalPrice: 475, currency: 'JPY' } };
      if (state.upload === 'invalid-japanese') return { json: { items: [{ name: 'Invalid JPY item', price: Number.MAX_SAFE_INTEGER, quantity: 2 }], totalPrice: 475, currency: 'JPY' } };
      if (state.upload === 'empty-japanese') return { json: { items: [], totalPrice: 475, currency: 'JPY' } };
      if (state.upload === 'empty') return { json: { message: 'INTERNAL_PROVIDER_DETAIL_MUST_NOT_APPEAR', items: [], storeName: null, totalPrice: null } };
      const totalPrice = state.upload === 'partial' ? 10000
        : state.upload === 'unknown-total' ? null
          : state.upload === 'unsafe-total' ? Number.MAX_SAFE_INTEGER + 1 : 8000;
      return { json: { items: [{ name: state.itemName || '예시 상품', quantity: 2, price: 4000 }], storeName: party.location.name, totalPrice } };
    }
    return { json: [] };
  };
  const server = createServer((req, res) => {
    const response = result(new URL(req.url, 'http://fixture').pathname, req.method);
    res.writeHead(response.status || 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response.json));
  });
  await new Promise(resolve => server.listen(3199, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    for (const language of ['korean', 'japanese']) {
      const itemName = language === 'japanese' ? 'サンプル商品' : '예시 상품';
      state.itemName = itemName;
      party.title = language === 'japanese' ? '一緒に買い物' : '함께 장보기';
      party.location.name = language === 'japanese' ? 'サンプル店舗' : '테스트 매장';
      const texts = menu[language].settlement;
      const locale = {
        language, name: texts.itemName, quantity: texts.quantity,
        price: `${texts.price} (${language === 'korean' ? '원' : 'ウォン'})`,
        empty: texts.receiptNoItems, success: texts.receiptRecognized.replace('{count}', '1'), review: texts.receiptReview,
      };
      state.upload = 'unavailable';
      state.settlement = settlement;
      state.saves = 0;
      state.starts = 0;
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.context().addCookies([
        { name: 'accessToken', value: 'receipt-fixture', url: base },
        { name: 'language', value: locale.language, url: base },
      ]);
      await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
      await page.route('**/api/**', route => {
        const request = route.request();
        const response = result(new URL(request.url()).pathname, request.method(), request.method() === 'PATCH' ? request.postDataJSON() : undefined);
        return route.fulfill({ status: response.status || 200, json: response.json });
      });
      await page.goto(base + '/settlement/1');
      const screen = page.locator('div.max-w-2xl');
      const feedback = screen.locator('[role=status], [role=alert]');
      await screen.getByRole('heading', { level: 1, name: texts.title, exact: true }).waitFor();
      const name = page.getByRole('textbox', { name: locale.name, exact: true });
      const quantity = page.getByRole('spinbutton', { name: locale.quantity, exact: true });
      const price = page.getByRole('spinbutton', { name: locale.price, exact: true });
      await name.fill('Keep edited item');
      await quantity.fill('3');
      await price.fill('2500');
      const album = page.locator('input[type=file]:not([capture])');
      const image = { name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('fixture receipt') };
      const isKorean = locale.language === 'korean';
      const save = page.getByRole('button', { name: texts.saveItems, exact: true });
      const start = page.getByRole('button', { name: texts.startSettlement, exact: true });
      const foreignMessage = texts.receiptCurrencyUnsupported;
      const hasSuccessIcon = () => page.locator('[data-rht-toaster]').evaluate(element =>
        [...element.querySelectorAll('*')].some(child => getComputedStyle(child).backgroundColor === 'rgb(97, 211, 69)'));
      const unchanged = async () => {
        assert.equal(await name.inputValue(), 'Keep edited item');
        assert.equal(await quantity.inputValue(), '3');
        assert.equal(await price.inputValue(), '2500');
      };

      await album.setInputFiles(image);
      await feedback.filter({ hasText: texts.receiptUnavailable }).waitFor();
      assert.equal(await page.getByText('Receipt service is unavailable', { exact: true }).count(), 0, 'provider failures use the selected UI language');
      await unchanged();
      assert.equal(await hasSuccessIcon(), false, 'an unavailable OCR service must not show success');

      for (const upload of ['foreign-error', 'foreign-success', 'japanese', 'invalid-japanese', 'empty-japanese']) {
        state.upload = upload;
        await album.setInputFiles(image);
        await feedback.filter({ hasText: foreignMessage }).waitFor();
        await unchanged();
        assert.equal(await hasSuccessIcon(), false, 'unsupported currency must not show a success icon');
        assert.equal(await page.getByText('BACKEND_KOREAN_MESSAGE_MUST_BE_TRANSLATED', { exact: true }).count(), 0);
        assert.equal(await screen.locator('details').count(), 0, 'foreign receipts must not create a separate preview');
        assert.equal(await page.getByText('おにぎり', { exact: true }).count(), 0);
        assert.equal(await page.getByText('Invalid JPY item', { exact: true }).count(), 0);
        assert.equal(state.saves, 0);
        assert.equal(state.starts, 0);
      }

      await page.mouse.move(0, 0);
      await save.click();
      await page.waitForFunction(label => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === label && !button.disabled), texts.saveItems);
      assert.equal(state.saves, 1);
      assert.deepEqual(state.savedItems.map(({ name, quantity, price }) => ({ name, quantity, price })), [
        { name: 'Keep edited item', quantity: 3, price: 2500 },
      ], 'saving after a rejected foreign receipt submits only the existing won draft');
      state.saves = 0;
      await page.mouse.move(0, 0);
      await page.waitForFunction(() => ![...document.querySelectorAll('[data-rht-toaster] *')].some(element => getComputedStyle(element).backgroundColor === 'rgb(97, 211, 69)'));

      state.upload = 'empty';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: locale.empty }).waitFor();
      await unchanged();
      assert.equal(await hasSuccessIcon(), false, 'an empty recognition must not show a green success icon');
      assert.equal(await page.getByText('INTERNAL_PROVIDER_DETAIL_MUST_NOT_APPEAR', { exact: true }).count(), 0);

      state.upload = 'recognized';
      await album.setInputFiles(image);
      await page.waitForFunction(({ label, itemName }) => document.querySelector(`input[placeholder="${label}"]`)?.value === itemName, { label: locale.name, itemName });
      await page.locator('[data-rht-toaster]').getByText(locale.success, { exact: true }).waitFor();
      assert.equal(await quantity.inputValue(), '2');
      assert.equal(await price.inputValue(), '4000');
      assert.equal(await hasSuccessIcon(), true, 'recognized items should retain the existing success feedback');
      await feedback.getByText(locale.review, { exact: true }).waitFor();
      assert.equal(await screen.locator('details').count(), 0);

      state.upload = 'partial';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: '₩10,000' }).waitFor();
      const totalCheck = screen.getByRole('status', { name: texts.receiptTotalCheckTitle });
      await totalCheck.waitFor();
      assert.deepEqual(await totalCheck.locator('dt').allTextContents(), [texts.receiptItemSum, texts.receiptPaymentTotal]);
      assert.deepEqual(await totalCheck.locator('dd').allTextContents(), ['₩8,000', '₩10,000']);
      await totalCheck.getByText(texts.receiptTotalCheckHint, { exact: true }).waitFor();
      assert.equal(await quantity.inputValue(), '2');
      assert.equal(await price.inputValue(), '4000', 'a receipt total mismatch must not rewrite a recognized price');
      assert.ok(await screen.getByText('₩8,000', { exact: true }).count() > 0, 'the editable item sum must stay unchanged');
      await page.waitForTimeout(6000);
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (width !== 320) {
          mkdirSync('.github/pr-previews', { recursive: true });
          await page.evaluate(() => document.fonts.ready);
          const captureHeight = await screen.evaluate(element => Math.ceil(element.getBoundingClientRect().height + 160));
          await page.setViewportSize({ width, height: captureHeight });
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.locator('div.max-w-2xl').screenshot({ path: `.github/pr-previews/implemented-receipt-guard-${isKorean ? '' : 'ja-'}${width === 390 ? 'mobile' : 'desktop'}.png`, animations: 'disabled' });
        }
      }

      const cancelMismatch = async button => {
        const beforeSaves = state.saves;
        const beforeStarts = state.starts;
        page.once('dialog', dialog => {
          assert.equal(dialog.type(), 'confirm');
          assert.ok(dialog.message().includes('₩10,000'));
          dialog.dismiss();
        });
        await page.mouse.move(0, 0);
        await button.click();
        await page.waitForTimeout(100);
        assert.equal(state.saves, beforeSaves, 'cancelled mismatch must not save');
        assert.equal(state.starts, beforeStarts, 'cancelled mismatch must not start');
      };
      await cancelMismatch(save);
      await cancelMismatch(start);

      state.upload = 'japanese';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: foreignMessage }).waitFor();
      assert.equal(await name.inputValue(), itemName);
      assert.equal(await quantity.inputValue(), '2');
      assert.equal(await price.inputValue(), '4000');
      await cancelMismatch(save);

      await page.getByRole('button', { name: texts.addItem, exact: true }).click();
      await page.getByRole('spinbutton', { name: locale.price, exact: true }).nth(1).fill('2000');
      await cancelMismatch(save);
      assert.equal(state.saves, 0, 'an unnamed row cannot hide a mismatch in the items that would be saved');
      await page.getByRole('button', { name: `${texts.removeItem}: 2`, exact: true }).click();

      state.upload = 'unavailable';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: texts.receiptUnavailable }).waitFor();
      assert.equal(await price.inputValue(), '4000');
      await cancelMismatch(save);

      await price.fill('5000');
      await page.waitForFunction(() => ![...document.querySelectorAll('div.max-w-2xl [role=status], div.max-w-2xl [role=alert]')].some(element => element.textContent.includes('₩8,000')));
      let dialogs = 0;
      const unexpectedDialog = dialog => { dialogs++; dialog.dismiss(); };
      page.on('dialog', unexpectedDialog);
      await page.mouse.move(0, 0);
      await save.click();
      await page.waitForFunction(label => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === label && !button.disabled), texts.saveItems);
      assert.equal(state.saves, 1, 'matching manual correction saves without a mismatch confirmation');
      assert.equal(dialogs, 0);
      page.off('dialog', unexpectedDialog);

      state.upload = 'partial';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: '₩10,000' }).waitFor();
      page.once('dialog', dialog => {
        assert.ok(dialog.message().includes('₩8,000'));
        dialog.accept();
      });
      await page.mouse.move(0, 0);
      await save.click();
      await page.waitForTimeout(100);
      assert.equal(state.saves, 2, 'explicit acceptance saves the current items');
      assert.equal(state.savedItems[0].price, 4000, 'manual acceptance does not silently change the amount');

      for (const upload of ['unknown-total', 'unsafe-total']) {
        state.upload = upload;
        await album.setInputFiles(image);
        await feedback.getByText(locale.review, { exact: true }).waitFor();
        assert.equal(await quantity.inputValue(), '2');
        assert.equal(await price.inputValue(), '4000');
      }

      state.upload = 'partial';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: '₩10,000' }).waitFor();
      let startDialogs = 0;
      page.once('dialog', dialog => { startDialogs++; dialog.accept(); });
      await page.mouse.move(0, 0);
      await start.click();
      await page.waitForTimeout(100);
      assert.equal(state.saves, 3);
      assert.equal(state.starts, 1);
      assert.equal(startDialogs, 1, 'save and start asks about the mismatch once');

      state.settlement = settlement;
      await page.reload();
      state.upload = 'japanese';
      await album.setInputFiles(image);
      await feedback.filter({ hasText: foreignMessage }).waitFor();
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: { id: 1 } })));
      assert.equal(await screen.isVisible(), true, 'same-account updates keep the settlement visible');
      assert.equal(await feedback.filter({ hasText: foreignMessage }).count(), 1);

      let releaseUpload;
      let markUploadPending;
      const uploadPending = new Promise(resolve => { markUploadPending = resolve; });
      const releaseResponse = new Promise(resolve => { releaseUpload = resolve; });
      await page.route('**/api/settlements/upload-receipt', async route => {
        const response = result('/api/settlements/upload-receipt', 'POST');
        markUploadPending();
        await releaseResponse;
        await route.fulfill({ json: response.json });
      });
      await album.setInputFiles(image);
      await uploadPending;
      await page.evaluate(nextUser => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: nextUser })), isKorean ? null : { id: 2, nickname: '다른 예시 사용자' });
      const responseCompleted = page.waitForResponse(response => response.url().includes('/settlements/upload-receipt') && response.request().method() === 'POST');
      releaseUpload();
      await responseCompleted;
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      assert.equal(await feedback.filter({ hasText: foreignMessage }).count(), 0, 'a late foreign response cannot update feedback after logout or an account change');
      assert.equal(await screen.locator('details').count(), 0);
      assert.equal(await page.locator('div.max-w-2xl').isVisible(), false, 'old-account settlement stays hidden');
      assert.deepEqual(pageErrors, []);
      await page.close();
    }
    assert.equal(state.attempts, 34, 'each locale rejects yen results, preserves won drafts and mismatch checks, and discards late uploads after session changes');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
