/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3199/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdirSync } = require('node:fs');
const { chromium } = require('playwright');

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
      if (state.upload === 'foreign-success') return { json: { items: [{ name: 'JPY item', price: 500, quantity: 1 }], totalPrice: 500, currency: 'JPY' } };
      if (state.upload === 'empty') return { json: { message: 'INTERNAL_PROVIDER_DETAIL_MUST_NOT_APPEAR', items: [], storeName: null, totalPrice: null } };
      const totalPrice = state.upload === 'partial' ? 10000
        : state.upload === 'unknown-total' ? null
          : state.upload === 'unsafe-total' ? Number.MAX_SAFE_INTEGER + 1 : 8000;
      return { json: { items: [{ name: '예시 상품', quantity: 2, price: 4000 }], storeName: '테스트 매장', totalPrice } };
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
    for (const locale of [
      { language: 'korean', name: '품목명', quantity: '수량', price: '가격 (원)', empty: '영수증에서 품목을 인식하지 못했습니다. 사진을 다시 촬영하거나 품목을 직접 입력해주세요.', success: '영수증 인식 완료! 1개 품목이 자동 입력되었습니다.', review: '자동 입력된 품목·수량·금액을 영수증과 확인한 뒤 저장해주세요.', mismatch: '자동 입력 합계 ₩8,000, 영수증 합계 ₩10,000로 서로 달라요. 빠진 품목·수량·할인을 확인한 뒤 수정해주세요.' },
      { language: 'japanese', name: '品名', quantity: '数量', price: '価格 (ウォン)', empty: 'レシートから品目を読み取れませんでした。撮り直すか、品目を直接入力してください。', success: 'レシート認識完了！1件の品目が自動入力されました。', review: '自動入力された品目・数量・金額をレシートと確認してから保存してください。', mismatch: '自動入力の合計₩8,000とレシートの合計₩10,000が異なります。抜けた品目・数量・割引を確認して修正してください。' },
    ]) {
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
      const name = page.getByRole('textbox', { name: locale.name, exact: true });
      const quantity = page.getByRole('spinbutton', { name: locale.quantity, exact: true });
      const price = page.getByRole('spinbutton', { name: locale.price, exact: true });
      await name.fill('Keep edited item');
      await quantity.fill('3');
      await price.fill('2500');
      const album = page.locator('input[type=file]:not([capture])');
      const image = { name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('fixture receipt') };
      const isKorean = locale.language === 'korean';
      const save = page.getByRole('button', { name: isKorean ? '품목 저장' : '品目を保存', exact: true });
      const start = page.getByRole('button', { name: isKorean ? '정산 시작하기' : '割り勘を開始する', exact: true });
      const foreignMessage = isKorean
        ? '현재 정산은 원화 영수증만 지원합니다. 엔화 등 다른 통화의 금액은 자동 입력하지 않습니다.'
        : '現在の精算は韓国ウォンのレシートのみ対応しています。円など他の通貨の金額は自動入力しません。';
      const hasSuccessIcon = () => page.locator('[data-rht-toaster]').evaluate(element =>
        [...element.querySelectorAll('*')].some(child => getComputedStyle(child).backgroundColor === 'rgb(97, 211, 69)'));
      const unchanged = async () => {
        assert.equal(await name.inputValue(), 'Keep edited item');
        assert.equal(await quantity.inputValue(), '3');
        assert.equal(await price.inputValue(), '2500');
      };

      await album.setInputFiles(image);
      await page.locator('p[role=status]').filter({ hasText: 'Receipt service is unavailable' }).waitFor();
      await unchanged();
      assert.equal(await hasSuccessIcon(), false, 'an unavailable OCR service must not show success');

      for (const upload of ['foreign-error', 'foreign-success']) {
        state.upload = upload;
        await album.setInputFiles(image);
        await page.locator('p[role=status]').getByText(foreignMessage, { exact: true }).waitFor();
        await unchanged();
        assert.equal(await page.getByText('BACKEND_KOREAN_MESSAGE_MUST_BE_TRANSLATED', { exact: true }).count(), 0);
      }

      state.upload = 'empty';
      await album.setInputFiles(image);
      await page.locator('p[role=status]').filter({ hasText: locale.empty }).waitFor();
      await unchanged();
      assert.equal(await hasSuccessIcon(), false, 'an empty recognition must not show a green success icon');
      assert.equal(await page.getByText('INTERNAL_PROVIDER_DETAIL_MUST_NOT_APPEAR', { exact: true }).count(), 0);

      state.upload = 'recognized';
      await album.setInputFiles(image);
      await page.waitForFunction(label => document.querySelector(`input[placeholder="${label}"]`)?.value === '예시 상품', locale.name);
      await page.locator('[data-rht-toaster]').getByText(locale.success, { exact: true }).waitFor();
      assert.equal(await quantity.inputValue(), '2');
      assert.equal(await price.inputValue(), '4000');
      assert.equal(await hasSuccessIcon(), true, 'recognized items should retain the existing success feedback');
      await page.locator('p[role=status]').getByText(locale.review, { exact: true }).waitFor();

      state.upload = 'partial';
      await album.setInputFiles(image);
      await page.locator('p[role=status]').getByText(locale.mismatch, { exact: true }).waitFor();
      assert.equal(await quantity.inputValue(), '2');
      assert.equal(await price.inputValue(), '4000', 'a receipt total mismatch must not rewrite a recognized price');
      assert.equal(await page.getByText('₩8,000', { exact: true }).count(), 1, 'the editable item sum must stay unchanged');
      if (isKorean) await page.waitForTimeout(6000);
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (isKorean && width !== 320) {
          mkdirSync('.github/pr-previews', { recursive: true });
          await page.evaluate(() => document.fonts.ready);
          await page.locator('div.max-w-2xl').screenshot({ path: `.github/pr-previews/implemented-receipt-guard-${width === 390 ? 'mobile' : 'desktop'}.png`, animations: 'disabled' });
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
        await button.click();
        await page.waitForTimeout(100);
        assert.equal(state.saves, beforeSaves, 'cancelled mismatch must not save');
        assert.equal(state.starts, beforeStarts, 'cancelled mismatch must not start');
      };
      await cancelMismatch(save);
      await cancelMismatch(start);

      await page.getByRole('button', { name: isKorean ? '+ 품목 추가' : '+ 品目追加', exact: true }).click();
      await page.getByRole('spinbutton', { name: locale.price, exact: true }).nth(1).fill('2000');
      await cancelMismatch(save);
      assert.equal(state.saves, 0, 'an unnamed row cannot hide a mismatch in the items that would be saved');
      await page.getByRole('button', { name: isKorean ? '품목 삭제: 2' : '品目を削除: 2', exact: true }).click();

      state.upload = 'unavailable';
      await album.setInputFiles(image);
      await page.locator('p[role=status]').filter({ hasText: 'Receipt service is unavailable' }).waitFor();
      assert.equal(await price.inputValue(), '4000');
      await cancelMismatch(save);

      await price.fill('5000');
      await page.waitForFunction(() => ![...document.querySelectorAll('p[role=status]')].some(p => p.textContent.includes('₩8,000')));
      let dialogs = 0;
      const unexpectedDialog = dialog => { dialogs++; dialog.dismiss(); };
      page.on('dialog', unexpectedDialog);
      await save.click();
      await page.waitForFunction(label => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === label && !button.disabled), isKorean ? '품목 저장' : '品目を保存');
      assert.equal(state.saves, 1, 'matching manual correction saves without a mismatch confirmation');
      assert.equal(dialogs, 0);
      page.off('dialog', unexpectedDialog);

      state.upload = 'partial';
      await album.setInputFiles(image);
      await page.locator('p[role=status]').getByText(locale.mismatch, { exact: true }).waitFor();
      page.once('dialog', dialog => {
        assert.ok(dialog.message().includes('₩8,000'));
        dialog.accept();
      });
      await save.click();
      await page.waitForTimeout(100);
      assert.equal(state.saves, 2, 'explicit acceptance saves the current items');
      assert.equal(state.savedItems[0].price, 4000, 'manual acceptance does not silently change the amount');

      for (const upload of ['unknown-total', 'unsafe-total']) {
        state.upload = upload;
        await album.setInputFiles(image);
        await page.locator('p[role=status]').getByText(locale.review, { exact: true }).waitFor();
        assert.equal(await quantity.inputValue(), '2');
        assert.equal(await price.inputValue(), '4000');
      }

      state.upload = 'partial';
      await album.setInputFiles(image);
      await page.locator('p[role=status]').getByText(locale.mismatch, { exact: true }).waitFor();
      let startDialogs = 0;
      page.once('dialog', dialog => { startDialogs++; dialog.accept(); });
      await start.click();
      await page.waitForTimeout(100);
      assert.equal(state.saves, 3);
      assert.equal(state.starts, 1);
      assert.equal(startDialogs, 1, 'save and start asks about the mismatch once');
      assert.deepEqual(pageErrors, []);
      await page.close();
    }
    assert.equal(state.attempts, 22, 'each locale can retry safely and distinguish foreign, partial and unknown receipt totals');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
