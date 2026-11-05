/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3199/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('receipt failures and empty recognition preserve drafts, and a successful retry fills items', { timeout: 120000 }, async () => {
  const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
  const user = { id: 1, nickname: 'ReceiptTester', accountNumber: 'fixture-account' };
  const party = { id: 1, title: 'Receipt fixture', hostId: 1, host: user, meetingDate: '2027-01-01T12:00:00Z', location: { name: 'Fixture store' } };
  const settlement = { id: 10, partyId: 1, hostId: 1, status: 'DRAFT', totalAmount: 1000, items: [{ id: 11, name: 'Original item', quantity: 1, price: 1000 }] };
  const state = { upload: 'unavailable', attempts: 0 };
  const result = (path, method) => {
    if (path === '/api/users/profile') return { json: user };
    if (path === '/api/parties/1') return { json: party };
    if (path === '/api/party-members/1') return { json: [{ userId: 1, status: 'APPROVED', user }] };
    if (path === '/api/settlements/party/1') return { json: settlement };
    if (path === '/api/settlements/10/payments') return { json: [] };
    if (path === '/api/settlements/upload-receipt' && method === 'POST') {
      state.attempts++;
      if (state.upload === 'unavailable') return { status: 503, json: { message: 'Receipt service is unavailable', code: 'OCR_NOT_CONFIGURED' } };
      if (state.upload === 'empty') return { json: { message: 'INTERNAL_PROVIDER_DETAIL_MUST_NOT_APPEAR', items: [], storeName: null, totalPrice: null } };
      return { json: { items: [{ name: 'Recognized item', quantity: 2, price: 4000 }], storeName: 'Fixture store', totalPrice: 8000 } };
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
      { language: 'korean', name: '품목명', quantity: '수량', price: '가격 (원)', empty: '영수증에서 품목을 인식하지 못했습니다. 사진을 다시 촬영하거나 품목을 직접 입력해주세요.', success: '영수증 인식 완료! 1개 품목이 자동 입력되었습니다.' },
      { language: 'japanese', name: '品名', quantity: '数量', price: '価格 (ウォン)', empty: 'レシートから品目を読み取れませんでした。撮り直すか、品目を直接入力してください。', success: 'レシート認識完了！1件の品目が自動入力されました。' },
    ]) {
      state.upload = 'unavailable';
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await page.context().addCookies([
        { name: 'accessToken', value: 'receipt-fixture', url: base },
        { name: 'language', value: locale.language, url: base },
      ]);
      await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
      await page.route('**/api/**', route => {
        const response = result(new URL(route.request().url()).pathname, route.request().method());
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

      state.upload = 'empty';
      await album.setInputFiles(image);
      await page.locator('p[role=status]').filter({ hasText: locale.empty }).waitFor();
      await unchanged();
      assert.equal(await hasSuccessIcon(), false, 'an empty recognition must not show a green success icon');
      assert.equal(await page.getByText('INTERNAL_PROVIDER_DETAIL_MUST_NOT_APPEAR', { exact: true }).count(), 0);

      state.upload = 'recognized';
      await album.setInputFiles(image);
      await page.waitForFunction(label => document.querySelector(`input[placeholder="${label}"]`)?.value === 'Recognized item', locale.name);
      await page.locator('[data-rht-toaster]').getByText(locale.success, { exact: true }).waitFor();
      assert.equal(await quantity.inputValue(), '2');
      assert.equal(await price.inputValue(), '4000');
      assert.equal(await hasSuccessIcon(), true, 'recognized items should retain the existing success feedback');
      assert.deepEqual(pageErrors, []);
      await page.close();
    }
    assert.equal(state.attempts, 6, 'each locale can retry after both failure paths');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
