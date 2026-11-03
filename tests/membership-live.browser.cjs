/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3199/api before running this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { chromium } = require('playwright');

test('membership requests and approvals update without reloading, and offline chat preserves the draft', { timeout: 120000 }, async () => {
  const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
  const host = { id: 1, nickname: 'Host', email: 'host@example.com' };
  const guest = { id: 2, nickname: 'PendingGuest' };
  const state = { pending: false, approved: false, secondRequest: false, participant: false, joinedList: false, holdJoin: true, saveAcknowledgement: null, joinAcknowledgement: null };
  const waitForAcknowledgement = async key => {
    const started = Date.now();
    while (!state[key]) {
      assert.ok(Date.now() - started < 5000, `no ${key} request arrived`);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };
  const party = () => ({
    id: 1, title: 'Membership fixture', content: 'Test party', status: 'RECRUITING',
    meetingDate: '2027-01-01T12:00:00Z', images: [], host, hostId: 1,
    location: { name: 'Test store', address: 'Test address', lat: 0, lng: 0 },
    currentCount: state.approved ? 2 : 1, capacity: 5,
    isHost: !state.participant, isJoined: true, isAccepted: !state.participant || state.approved, isRejected: false,
  });
  const members = () => [
    { userId: 1, status: 'APPROVED', user: host },
    ...(state.pending ? [{ userId: 2, status: state.approved ? 'APPROVED' : 'PENDING', user: guest }] : []),
    ...(state.secondRequest ? [{ userId: 3, status: 'PENDING', user: { id: 3, nickname: 'NextGuest' } }] : []),
  ];
  function response(path, method = 'GET') {
    if (path === '/api/users/profile') return { ...host, id: state.participant ? 2 : 1 };
    if (path === '/api/parties/joined-parties') return state.joinedList ? [party()] : [];
    if (path === '/api/parties/1') return party();
    if (path === '/api/party-members/1') return members();
    if (path === '/api/party-members/1/2/status' && method === 'PATCH') { state.approved = true; return {}; }
    if (path === '/api/chat-message/1') return [];
    if (path.startsWith('/api/settlements')) return null;
    if (path.startsWith('/api/reviews')) return { canReview: false, hasReviewed: false };
    return [];
  }
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response(new URL(req.url, 'http://fixture').pathname, req.method)));
  });
  await new Promise(resolve => server.listen(3199, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.context().addCookies([{ name: 'accessToken', value: 'membership-fixture', url: base }]);
    await page.route('**/api/**', route => route.fulfill({ json: response(new URL(route.request().url()).pathname, route.request().method()) }));
    page.on('dialog', dialog => dialog.accept());
    await page.routeWebSocket(/socket\.io/, socket => {
      socket.send('0{"sid":"membership-fixture","upgrades":[],"pingInterval":25000,"pingTimeout":20000}');
      socket.onMessage(message => {
        if (message === '40') socket.send('40{"sid":"membership-fixture"}');
        if (typeof message !== 'string' || !message.startsWith('42')) return;
        const payloadStart = message.indexOf('[');
        const acknowledgement = message.slice(2, payloadStart);
        const [event] = JSON.parse(message.slice(payloadStart));
        const respond = result => socket.send(`43${acknowledgement}${JSON.stringify([result])}`);
        if (event === 'joinRoom') {
          if (state.holdJoin) state.joinAcknowledgement = respond;
          else respond({ ok: true });
        }
        if (event === 'message') state.saveAcknowledgement = respond;
      });
    });
    await page.clock.install();
    await page.goto(base + '/chat/1');
    const input = page.getByRole('textbox', { name: '메시지를 입력하세요...' });
    await input.fill('Keep this draft while disconnected');
    await input.press('Enter');
    assert.equal(await input.inputValue(), 'Keep this draft while disconnected');
    assert.equal(await page.getByRole('button', { name: '전송', exact: true }).isDisabled(), true);
    await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('연결 중'));
    await waitForAcknowledgement('joinAcknowledgement');
    state.holdJoin = false;
    state.joinAcknowledgement({ ok: true });
    const send = page.getByRole('button', { name: '전송', exact: true });
    await page.waitForFunction(() => !document.querySelector('button[aria-label="전송"]').disabled);
    await send.click();
    assert.equal(await send.getAttribute('aria-busy'), 'true');
    assert.equal(await input.inputValue(), 'Keep this draft while disconnected', 'an unacknowledged send must preserve the draft');
    await waitForAcknowledgement('saveAcknowledgement');
    state.saveAcknowledgement({ ok: false, error: 'Unable to save' });
    await page.getByRole('button', { name: '다시 연결', exact: true }).waitFor();
    assert.equal(await input.inputValue(), 'Keep this draft while disconnected');
    await page.getByRole('button', { name: '다시 연결', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('button[aria-label="전송"]').disabled);
    state.saveAcknowledgement = null;
    await send.click();
    await input.fill('Newer text typed while waiting');
    await waitForAcknowledgement('saveAcknowledgement');
    state.saveAcknowledgement({ ok: true });
    await page.waitForFunction(() => document.querySelector('button[aria-label="전송"]').getAttribute('aria-busy') === 'false');
    assert.equal(await input.inputValue(), 'Newer text typed while waiting', 'a saved message must not clear text typed during the request');
    state.saveAcknowledgement = null;
    await send.click();
    await waitForAcknowledgement('saveAcknowledgement');
    state.saveAcknowledgement({ ok: true });
    await page.waitForFunction(() => document.querySelector('input[aria-label="메시지를 입력하세요..."]').value === '');
    await input.fill('Keep this draft while disconnected');
    await page.evaluate(() => { window.membershipDocument = 'same document'; });

    state.pending = true;
    await page.getByRole('button', { name: '참여 멤버', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: '참여 멤버' });
    await drawer.getByText('PendingGuest', { exact: true }).waitFor();
    await drawer.getByRole('button', { name: '수락', exact: true }).waitFor();
    state.secondRequest = true;
    await page.clock.fastForward(10001);
    await drawer.getByText('NextGuest', { exact: true }).waitFor();
    await drawer.getByRole('button', { name: '수락', exact: true }).first().click();
    await drawer.getByText('승인 대기 중 (1)', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.membershipDocument), 'same document');
    await drawer.getByRole('button', { name: '닫기', exact: true }).click();
    assert.equal(await input.inputValue(), 'Keep this draft while disconnected', 'membership polling must preserve an unsent chat draft');

    state.participant = true;
    state.approved = false;
    await page.goto(base + '/party/1');
    await page.getByRole('button', { name: '이미 참여한 모임입니다', exact: true }).waitFor();
    await page.evaluate(() => { window.membershipDocument = 'pending document'; });
    state.approved = true;
    await page.clock.fastForward(10001);
    await page.getByRole('button', { name: '채팅방으로 이동하기', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.membershipDocument), 'pending document');

    await page.goto(base + '/chats');
    await page.getByText('참여 중인 채팅이 없습니다.', { exact: true }).waitFor();
    state.joinedList = true;
    await page.clock.fastForward(10001);
    await page.getByRole('link', { name: /Membership fixture/ }).waitFor();
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
