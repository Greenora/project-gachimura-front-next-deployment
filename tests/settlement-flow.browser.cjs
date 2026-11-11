/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser integration fixture */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3401/api before this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('host and member settlement selections, confirmed amounts and payment updates stay consistent', { timeout: 240000 }, async t => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3131';
  const users = {
    1: { id: 1, nickname: '방장', email: 'host@example.test', accountCountry: 'KR', bankName: '테스트은행', accountHolder: '예시 방장', accountNumber: '000000000000' },
    2: { id: 2, nickname: '참여자A', email: 'member-a@example.test' },
    3: { id: 3, nickname: '참여자B', email: 'member-b@example.test' },
  };
  const publicUser = id => ({ id, nickname: users[id].nickname });
  const party = { id: 1, hostId: 1, host: publicUser(1), title: '함께 장보기', meetingDate: '2027-01-01T12:00:00Z', location: { name: '테스트 매장' } };
  const clone = value => JSON.parse(JSON.stringify(value));
  const members = ids => ids.map(userId => ({ userId, user: publicUser(userId) }));
  const initialItems = () => [
    { id: 11, name: '샐러드', price: 10000, quantity: 1, members: members([2, 3]) },
    { id: 12, name: '우유', price: 3000, quantity: 1, members: members([1, 3]) },
    { id: 13, name: '빵', price: 2000, quantity: 1, members: [] },
  ];
  const state = { settlement: null, payments: [], selectionWrites: [], itemWrites: [], confirmations: 0, paymentWrites: [], reads: 0, failSnapshotFor: new Set(), holdFor: null, holdObserved: null, held: [] };
  const joinedSockets = new Set();
  const notifyUpdated = () => joinedSockets.forEach(socket => socket.send(`42${JSON.stringify(['settlementUpdated', { partyId: 1, settlementId: 10 }])}`));
  function reset() {
    Object.assign(state, {
      settlement: { id: 10, partyId: 1, hostId: 1, status: 'SELECTING', totalAmount: 15000, items: initialItems() },
      payments: [], sentMessages: [], selectionWrites: [], itemWrites: [], confirmations: 0, paymentWrites: [], reads: 0, failSnapshotFor: new Set(), holdFor: null, holdObserved: null,
    });
  }
  function confirmedFixture() {
    state.settlement.status = 'CONFIRMED';
    state.settlement.items[0].members = members([1, 2, 3]);
    state.settlement.items[2].members = members([1]);
    state.payments = [
      { id: 21, userId: 2, amount: 3333, status: 'PENDING', user: publicUser(2) },
      { id: 22, userId: 3, amount: 4833, status: 'PENDING', user: publicUser(3) },
    ];
  }
  function respond(path, method, userId, body) {
    if (path === '/api/users/profile') return { json: users[userId] };
    if (path === '/api/parties/1') return { json: party };
    if (path === '/api/party-members/1') return { json: [1, 2, 3].map(id => ({ userId: id, status: 'APPROVED', user: publicUser(id) })) };
    if (path === '/api/push/config') return { json: { enabled: false, publicKey: null } };
    if (path === '/api/auth/refresh') return { status: 401, json: { message: 'Unauthorized' } };
    if (path === '/api/settlements/party/1' || (path === '/api/settlements/10' && method === 'GET')) {
      state.reads++;
      if (state.failSnapshotFor.has(userId)) return { status: 503, json: { message: 'PRIVATE_SNAPSHOT_MARKER' } };
      return { json: clone(state.settlement) };
    }
    if (path === '/api/settlements/10/payments') return { json: clone(state.payments) };
    if (path === '/api/settlements/10/revert' && method === 'PATCH') {
      state.settlement.status = 'DRAFT';
      notifyUpdated();
      return { json: clone(state.settlement) };
    }
    if (path === '/api/settlements/10/items' && method === 'PATCH') {
      state.itemWrites.push(clone(body.items));
      state.settlement.items = body.items.map((item, index) => ({
        ...item, id: item.id || 100 + index,
        members: state.settlement.items.find(saved => saved.id === item.id)?.members || [],
      }));
      state.settlement.totalAmount = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      notifyUpdated();
      return { json: clone(state.settlement) };
    }
    if (path === '/api/settlements/10/start' && method === 'PATCH') {
      state.settlement.status = 'SELECTING';
      notifyUpdated();
      return { json: clone(state.settlement) };
    }
    if (path === '/api/settlements/10/select' && method === 'PATCH') {
      if (state.settlement.status !== 'SELECTING') return { status: 400, json: { message: '항목 선택 기간이 아닙니다.' } };
      state.selectionWrites.push({ userId, itemIds: body.itemIds });
      for (const item of state.settlement.items) {
        item.members = item.members.filter(member => member.userId !== userId);
        if (body.itemIds.includes(item.id)) item.members.push({ userId, user: publicUser(userId) });
      }
      notifyUpdated();
      return { json: clone(state.settlement) };
    }
    if (path === '/api/settlements/10/confirm' && method === 'PATCH') {
      if (userId !== 1) return { status: 403, json: { message: '호스트만 확정할 수 있습니다.' } };
      if (state.settlement.items.some(item => !item.members.length)) return { status: 400, json: { message: '선택자가 없는 품목이 있습니다.' } };
      state.confirmations++;
      confirmedFixture();
      notifyUpdated();
      return { json: clone(state.settlement) };
    }
    if (path === '/api/settlements/10/payment' && method === 'PATCH') {
      assert.equal(userId, 1);
      assert.equal(body.status, 'PAID');
      state.paymentWrites.push(body.userId);
      const payment = state.payments.find(value => value.userId === body.userId);
      payment.status = 'PAID';
      if (state.payments.every(value => value.status === 'PAID')) state.settlement.status = 'COMPLETED';
      notifyUpdated();
      return { json: clone(payment) };
    }
    return { json: [] };
  }
  reset();
  const server = createServer((request, response) => {
    const userId = Number(request.headers.authorization?.match(/settlement-user-(\d+)/)?.[1] || 1);
    const value = respond(new URL(request.url, 'http://fixture').pathname, request.method, userId);
    response.writeHead(value.status || 200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(value.json));
  });
  await new Promise(resolve => server.listen(3401, '127.0.0.1', resolve));
  let browser;
  const contexts = new Set();
  const pageErrors = [];
  async function openPage(userId, language = 'korean') {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    contexts.add(context);
    await context.addCookies([
      { name: 'accessToken', value: `settlement-user-${userId}`, url: base },
      { name: 'language', value: language, url: base },
    ]);
    await context.addInitScript(() => localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' })));
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.clock.install();
    await page.routeWebSocket(/socket\.io/, socket => {
      socket.send('0{"sid":"settlement-fixture","upgrades":[],"pingInterval":25000,"pingTimeout":20000}');
      socket.onClose(() => joinedSockets.delete(socket));
      socket.onMessage(message => {
        if (message === '40') return socket.send('40{"sid":"settlement-fixture"}');
        if (message === '2') return socket.send('3');
        const match = /^42(\d+)?(\[.*)$/.exec(String(message));
        if (!match) return;
        const [, acknowledgement, encoded] = match;
        const [event, payload] = JSON.parse(encoded);
        if (event === 'joinRoom' && payload.partyId === 1) {
          joinedSockets.add(socket);
          if (acknowledgement) socket.send(`43${acknowledgement}[{"ok":true}]`);
        }
        if (event === 'message' && joinedSockets.has(socket) && payload.partyId === 1) {
          state.sentMessages.push({ userId, ...payload });
          if (acknowledgement) socket.send(`43${acknowledgement}[{"ok":true}]`);
        }
      });
    });
    await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const result = respond(path, request.method(), userId, request.postData() ? request.postDataJSON() : undefined);
      const snapshotRequest = request.method() === 'GET' && ['/api/settlements/party/1', '/api/settlements/10'].includes(path);
      if (snapshotRequest && state.holdFor === userId) {
        state.holdFor = null;
        let release;
        let complete;
        const wait = new Promise(resolve => { release = resolve; });
        const done = new Promise(resolve => { complete = resolve; });
        const held = { release, done };
        state.held.push(held);
        state.holdObserved?.(held);
        state.holdObserved = null;
        await wait;
        try { await route.fulfill({ status: result.status || 200, json: result.json }); }
        finally { complete(); }
        return;
      }
      return route.fulfill({ status: result.status || 200, json: result.json });
    });
    await page.goto(base + '/settlement/1');
    await page.getByRole('heading', { name: language === 'japanese' ? '割り勘する' : '정산하기', exact: true }).first().waitFor();
    await page.clock.runFor(50);
    return page;
  }
  async function check(name, run) {
    await t.test(name, async () => {
      reset();
      try { await run(); }
      finally {
        for (const held of state.held.splice(0)) held.release();
        await Promise.all([...contexts].map(context => context.close()));
        contexts.clear();
        joinedSockets.clear();
      }
    });
  }
  const itemButton = (page, name) => page.getByRole('button', { name: new RegExp(name) });
  const save = page => page.getByRole('button', { name: '선택 완료', exact: true });
  const confirm = page => page.getByRole('button', { name: '정산 확정하기', exact: true });
  const estimate = page => page.getByText('나의 예상 금액', { exact: true }).locator('..');
  async function poll(page) {
    await Promise.all([
      page.waitForResponse(response => /\/api\/settlements\/(party\/1|10)$/.test(response.url()) && response.request().method() === 'GET'),
      page.clock.fastForward(10000),
    ]);
  }
  async function saveSelection(page) {
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/settlements/10/select') && response.request().method() === 'PATCH'),
      save(page).click(),
    ]);
    await page.locator('[data-rht-toaster]').getByText('품목 선택이 완료되었습니다!', { exact: true }).last().waitFor();
  }
  async function holdNextSnapshot(page, userId) {
    state.holdFor = userId;
    const observed = new Promise(resolve => { state.holdObserved = resolve; });
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    return Promise.race([
      observed,
      new Promise((_, reject) => setTimeout(() => reject(new Error('the focused page did not request a fresh settlement')), 5000).unref()),
    ]);
  }
  try {
    browser = await chromium.launch();
    await check('the host can choose personal items, save zero choices and cannot confirm missing or unsaved selections', async () => {
      const host = await openPage(1);
      await itemButton(host, '샐러드').waitFor();
      assert.equal(await confirm(host).isDisabled(), true, 'an unselected item blocks confirmation');
      await itemButton(host, '샐러드').click();
      await estimate(host).getByText('₩4,834', { exact: true }).waitFor();
      await host.getByRole('button', { name: '수정하기', exact: true }).click();
      await host.locator('[data-rht-toaster]').getByText('내 선택을 먼저 저장해주세요.', { exact: true }).last().waitFor();
      assert.equal(state.settlement.status, 'SELECTING', 'switching to edits cannot discard an unsaved choice');
      assert.equal(await confirm(host).isDisabled(), true);
      await saveSelection(host);
      assert.equal(state.selectionWrites.at(-1).userId, 1);
      assert.deepEqual([...state.selectionWrites.at(-1).itemIds].sort((a, b) => a - b), [11, 12]);
      assert.equal(await confirm(host).isDisabled(), true, 'saving does not hide an unselected bread item');
      await itemButton(host, '빵').click();
      await estimate(host).getByText('₩6,834', { exact: true }).waitFor();
      assert.equal(await confirm(host).isDisabled(), true, 'local selections must be saved before confirmation');
      await saveSelection(host);
      assert.equal(await confirm(host).isDisabled(), false);
      for (const name of ['샐러드', '우유', '빵']) await itemButton(host, name).click();
      assert.equal(await save(host).isDisabled(), false, 'removing every selected item can be saved');
      await saveSelection(host);
      assert.deepEqual(state.selectionWrites.at(-1), { userId: 1, itemIds: [] });
      assert.equal(state.confirmations, 0);
    });

    await check('background updates preserve a local selection and discard a response captured before a successful save', async () => {
      const host = await openPage(1);
      await itemButton(host, '샐러드').click();
      await itemButton(host, '빵').click();
      state.settlement.items[2].members = members([2]);
      await poll(host);
      assert.equal(await itemButton(host, '빵').getAttribute('aria-pressed'), 'true');
      await estimate(host).getByText('₩5,834', { exact: true }).waitFor();
      const held = await holdNextSnapshot(host, 1);
      await saveSelection(host);
      assert.ok(state.settlement.items[0].members.some(member => member.userId === 1));
      held.release();
      await held.done;
      await host.clock.runFor(50);
      assert.equal(await itemButton(host, '샐러드').getAttribute('aria-pressed'), 'true', 'a delayed old snapshot must not replace saved choices');
      assert.equal(await itemButton(host, '빵').getAttribute('aria-pressed'), 'true');
      await estimate(host).getByText('₩5,834', { exact: true }).waitFor();
    });

    await check('reopening and saving item changes sends existing IDs and keeps saved buyers on both devices', async () => {
      const host = await openPage(1);
      const guest = await openPage(3);
      await host.getByRole('button', { name: '수정하기', exact: true }).click();
      await guest.getByText('호스트가 품목을 등록하고 있습니다...', { exact: true }).waitFor();
      await host.getByLabel('품목명', { exact: true }).first().fill('샐러드 수정');
      await host.getByRole('button', { name: '정산 시작하기', exact: true }).click();
      await itemButton(host, '샐러드 수정').waitFor();
      await itemButton(guest, '샐러드 수정').waitFor();
      assert.deepEqual(state.itemWrites[0].map(item => item.id), [11, 12, 13]);
      assert.equal(state.itemWrites[0][0].name, '샐러드 수정');
      assert.equal(await itemButton(guest, '샐러드 수정').getAttribute('aria-pressed'), 'true');
      assert.equal(await itemButton(host, '우유').getAttribute('aria-pressed'), 'true');
      await itemButton(host, '샐러드 수정').getByText('참여자B', { exact: true }).waitFor();
    });

    await check('socket changes update selection, confirmation and final payment on another device before the polling interval', async () => {
      const host = await openPage(1);
      const guest = await openPage(3);
      await host.evaluate(() => { window.settlementDocument = 'preserved'; });
      await guest.evaluate(() => { window.settlementDocument = 'preserved'; });
      assert.equal(joinedSockets.size, 2);
      assert.equal(await guest.getByRole('button', { name: '정산 확정하기', exact: true }).count(), 0);
      assert.equal(await guest.getByText(/정산 입금 안내를 받으려면/).count(), 0, 'payers do not need a receiving account');
      await itemButton(host, '샐러드').click();
      await itemButton(host, '빵').click();
      await itemButton(guest, '빵').click();
      await saveSelection(guest);
      await itemButton(host, '빵').getByText('참여자B', { exact: true }).waitFor();
      assert.equal(await itemButton(host, '빵').getAttribute('aria-pressed'), 'true', 'the host keeps unsaved own selection during pushed updates');
      await saveSelection(host);
      await confirm(host).click();
      await host.getByRole('heading', { name: '입금 현황', exact: true }).waitFor();
      assert.equal(state.confirmations, 1);
      await guest.getByRole('heading', { name: '입금 현황', exact: true }).waitFor();
      for (const page of [host, guest]) {
        await page.getByText('₩3,333', { exact: true }).first().waitFor();
        await page.getByText('₩4,833', { exact: true }).first().waitFor();
        assert.equal(await page.getByRole('button', { name: /카카오톡 정산/ }).count(), 0);
        assert.equal(await page.getByText('1인 당', { exact: false }).count(), 0);
      }
      assert.equal(await guest.getByRole('button', { name: /입금 확인/ }).count(), 0);
      await host.getByRole('button', { name: '참여자A 입금 확인', exact: true }).click();
      await host.getByText('입금이 확인되었습니다.', { exact: true }).waitFor();
      await host.getByRole('button', { name: '참여자B 입금 확인', exact: true }).click();
      await host.getByText(/정산.*완료/).first().waitFor();
      assert.equal(state.settlement.status, 'COMPLETED');
      assert.deepEqual(state.paymentWrites, [2, 3]);
      await guest.getByText(/정산.*완료/).first().waitFor();
      assert.equal(await host.evaluate(() => window.settlementDocument), 'preserved');
      assert.equal(await guest.evaluate(() => window.settlementDocument), 'preserved');
    });

    await check('confirmed server payment amounts remain authoritative and Japanese keeps the same won value', async () => {
      confirmedFixture();
      state.payments[0].amount = 4200;
      state.payments[1].amount = 3300;
      const korean = await openPage(2);
      const japanese = await openPage(2, 'japanese');
      for (const page of [korean, japanese]) {
        await page.getByText('₩4,200', { exact: true }).first().waitFor();
        assert.equal(await page.getByText('₩420', { exact: true }).count(), 0);
        assert.equal(await page.getByText(/[￥¥]\s?4[,.]?200/).count(), 0);
        assert.equal(await page.getByRole('button', { name: /입금 확인|入金確認/ }).count(), 0);
        for (const width of [320, 390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        }
      }
    });

    await check('a successful payment stays paid when the following snapshot refresh fails', async () => {
      confirmedFixture();
      const host = await openPage(1);
      await host.getByRole('button', { name: '참여자A 입금 확인', exact: true }).waitFor();
      state.failSnapshotFor.add(1);
      await Promise.all([
        host.waitForResponse(response => response.url().endsWith('/settlements/10/payment') && response.request().method() === 'PATCH'),
        host.getByRole('button', { name: '참여자A 입금 확인', exact: true }).click(),
      ]);
      await host.getByRole('button', { name: '참여자A 입금 확인', exact: true }).waitFor({ state: 'hidden' });
      await host.getByText('완료', { exact: true }).first().waitFor();
      assert.equal(await host.getByRole('button', { name: '참여자B 입금 확인', exact: true }).isVisible(), true);
      assert.deepEqual(state.paymentWrites, [2]);
      assert.equal(state.payments[0].status, 'PAID');
      assert.equal(await host.getByText('입금 확인 실패', { exact: true }).count(), 0);
      assert.equal((await host.locator('body').innerText()).includes('PRIVATE_SNAPSHOT_MARKER'), false);
    });

    await check('account sharing is explicit, compact on mobile and uses confirmed server amounts', async () => {
      confirmedFixture();
      state.payments[0].amount = 4200;
      state.payments[0].status = 'PAID';
      state.payments[1].amount = 3300;
      const host = await openPage(1);
      const section = host.getByRole('region', { name: '입금 계좌 안내', exact: true });
      const toggle = section.getByRole('button', { name: '보기', exact: true });
      assert.equal(await section.getByText('000000000000', { exact: true }).isVisible(), false);
      await toggle.click();
      await host.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedAccount = value; } } }));
      await section.getByRole('button', { name: '계좌번호 복사', exact: true }).click();
      assert.equal(await host.evaluate(() => window.copiedAccount), '000000000000');
      host.removeAllListeners('dialog');
      host.once('dialog', dialog => dialog.dismiss());
      await section.getByRole('button', { name: '정산 안내 공유', exact: true }).click();
      assert.equal(state.sentMessages.length, 0);
      host.on('dialog', dialog => dialog.accept());
      await section.getByRole('button', { name: '정산 안내 공유', exact: true }).click();
      await host.locator('[data-rht-toaster]').getByText('채팅방에 공유했습니다.', { exact: true }).last().waitFor();
      assert.equal(state.sentMessages.length, 1);
      const sent = state.sentMessages[0];
      assert.equal(sent.userId, 1);
      assert.equal(sent.partyId, 1);
      assert.match(sent.message, /테스트은행 000000000000\n예시 방장/);
      assert.match(sent.message, /참여자A: ₩4,200 \(입금 확인 완료\)/);
      assert.match(sent.message, /참여자B: ₩3,300 \(입금 대기\)/);
      assert.doesNotMatch(sent.message, /host@example|방장: ₩/);
      await section.getByRole('button', { name: '접기', exact: true }).click();
      await host.setViewportSize({ width: 1280, height: 1000 });
      assert.equal(await section.getByText('000000000000', { exact: true }).isVisible(), true);
      assert.equal(await host.getByRole('button', { name: '채팅방에서 모임 종료·평가', exact: true }).count(), 0);
      const guest = await openPage(2);
      assert.equal(await guest.getByRole('region', { name: '입금 계좌 안내', exact: true }).count(), 0);
      state.settlement.status = 'COMPLETED';
      state.payments.forEach(payment => { payment.status = 'PAID'; });
      notifyUpdated();
      await host.getByRole('button', { name: '채팅방에서 모임 종료·평가', exact: true }).waitFor();
      assert.equal(await section.count(), 0, 'completed settlements must not offer another payment request');
    });

    await check('a Japanese account is not shared as a won settlement account', async () => {
      confirmedFixture();
      users[1].accountCountry = 'JP';
      try {
        const host = await openPage(1);
        const section = host.getByRole('region', { name: '입금 계좌 안내', exact: true });
        await section.getByRole('button', { name: '보기', exact: true }).click();
        await section.getByText('원화 정산에 사용할 한국 계좌를 등록해주세요.', { exact: true }).waitFor();
        assert.equal(await section.getByRole('button', { name: '정산 안내 공유', exact: true }).count(), 0);
        assert.equal(state.sentMessages.length, 0);
      } finally { users[1].accountCountry = 'KR'; }
    });

    await check('logout and account changes hide the previous settlement and ignore its delayed refresh', async () => {
      for (const detail of [null, users[2]]) {
        const host = await openPage(1);
        await itemButton(host, '샐러드').waitFor();
        const held = await holdNextSnapshot(host, 1);
        await host.evaluate(user => window.dispatchEvent(new CustomEvent('gachimura:user-changed', { detail: user })), detail);
        await host.getByRole('heading', { name: '정산하기', exact: true }).waitFor({ state: 'hidden' });
        held.release();
        await held.done;
        await host.clock.runFor(50);
        assert.equal(await host.getByRole('button', { name: '정산 확정하기', exact: true }).count(), 0);
        assert.equal(await host.getByText('₩15,000', { exact: true }).first().isVisible(), false);
        const reads = state.reads;
        await host.clock.fastForward(10000);
        assert.equal(state.reads, reads, 'the previous session must stop refreshing settlement data');
        await host.context().close();
        contexts.delete(host.context());
      }
    });
    assert.deepEqual(pageErrors, []);
  } finally {
    for (const held of state.held) held.release();
    await Promise.all([...contexts].map(context => context.close()));
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
