/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser regression test */
// Run Next with INTERNAL_API_URL=http://127.0.0.1:3199/api, then node --test this file.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdir } = require('node:fs/promises');
const { chromium } = require('playwright');

test('mobile navigation, chat keyboard and receipt editing preserve working flows', { timeout: 240000 }, async () => {
  const base = process.env.TEST_FRONTEND_URL || 'http://localhost:3101';
  const nickname = 'MobileTester'.repeat(8);
  const user = { id: 1, nickname, nickname_jp: 'モバイルテスト', treeScore: 50, reviewsCount: 0, accountNumber: '1234567890' };
  const party = { id: 1, title: '작은 화면에서도 읽을 수 있는 모임 제목 '.repeat(3), content: 'LongDescription'.repeat(20), storeName: '테스트마트', addressKo: 'LongAddress'.repeat(12), meetDate: '2026-10-20T10:00:00Z', meetingDate: '2026-10-20T10:00:00Z', status: 'RECRUITING', images: [], capacity: 5, currentCount: 2, host: user, hostId: 1, location: { name: '테스트마트', address: '테스트 주소', lat: 37.5, lng: 127 }, isHost: true, isJoined: true, isAccepted: true };
  const members = [{ userId: 1, status: 'APPROVED', user }, { userId: 2, status: 'APPROVED', user: { id: 2, nickname: '참여자' } }];
  const state = { userId: 1, status: 'DRAFT', uploadAttempts: 0, savedItems: null, selections: null, chatError: false, emptyChats: false, anonymous: false, joinRequests: 0, createRequests: 0 };
  const item = { id: 11, name: '영수증 품목', quantity: 2, price: 3000, members: [] };
  const settlement = () => ({ id: 10, partyId: 1, hostId: 1, status: state.status, totalAmount: 6000, items: [item] });
  const respond = (path, method, body) => {
    if (path === '/api/auth/refresh' || (state.anonymous && ['/api/users/profile', '/api/parties/joined-parties'].includes(path))) return { status: 401, json: { message: 'Unauthorized' } };
    if (path === '/api/users/profile') return { json: { ...user, id: state.userId } };
    if (path.startsWith('/api/users/')) return { json: user };
    if (path === '/api/parties/joined-parties') return state.chatError ? { status: 500, json: { message: '목록 오류' } } : { json: state.emptyChats ? [] : [party] };
    if (path === '/api/parties/1/join') { state.joinRequests++; return { json: { success: true } }; }
    if (path === '/api/parties' && method === 'POST') { state.createRequests++; return { json: party }; }
    if (path === '/api/parties/1') return { json: { ...party, isHost: state.userId === 1, isJoined: state.userId === 1, isAccepted: state.userId === 1 } };
    if (path.startsWith('/api/parties')) return { json: [party] };
    if (path.startsWith('/api/party-members')) return { json: members };
    if (path.startsWith('/api/chat-message')) return { json: [{ senderId: 2, sender: members[1].user, partyId: 1, content: 'LongMessage'.repeat(40), createdAt: '2026-10-14T00:00:00Z', messageType: 'TALK' }] };
    if (path === '/api/settlements/upload-receipt') {
      state.uploadAttempts++;
      return state.uploadAttempts === 1 ? { status: 500, json: { message: '영수증 업로드 실패' } } : { json: { items: [{ name: '인식한 품목', quantity: 2, price: 4000 }], storeName: '테스트마트', totalPrice: 8000 } };
    }
    if (path === '/api/settlements/10/items' && method === 'PATCH') { state.savedItems = JSON.parse(body).items; return { json: { ...settlement(), items: state.savedItems.map((entry, index) => ({ ...entry, id: index + 11 })) } }; }
    if (path === '/api/settlements/10/select' && method === 'PATCH') { state.selections = JSON.parse(body); return { json: settlement() }; }
    if (path.endsWith('/payments')) return { json: [{ id: 1, userId: 2, amount: 6000, status: 'PENDING', user: members[1].user }] };
    if (path.startsWith('/api/settlements')) return { json: settlement() };
    if (path.startsWith('/api/community/posts')) return { json: { items: [{ id: 1, author: user, content: 'LongPost'.repeat(30), locale: 'ko', createdAt: '2026-10-14T00:00:00Z', likeCount: 0, commentCount: 0, likedByMe: false }], nextCursor: null, hasMore: false } };
    return { json: [] };
  };
  const server = createServer((req, res) => {
    const result = respond(new URL(req.url, 'http://fixture').pathname, req.method);
    res.writeHead(result.status || 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.json));
  });
  await new Promise(resolve => server.listen(3199, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 320, height: 740 } });
    await context.addCookies([{ name: 'accessToken', value: 'mobile-fixture', url: base }]);
    await context.addInitScript(() => {
      const failures = [];
      navigator.geolocation.getCurrentPosition = (_success, failure) => failures.push(failure);
      window.denyLocationForTest = () => failures.forEach(failure => failure({ code: 1 }));
      if (location.pathname === '/create-party') {
        const Map = class { setCenter() {} };
        const Marker = class { setPosition() {} };
        const places = {
            PlacesServiceStatus: { OK: 'OK' },
            PlacesService: class { getDetails(_request, callback) { callback({ name: '테스트마트', formatted_address: '테스트 주소' }, 'OK'); } },
            Autocomplete: class {
              constructor(input) { this.input = input; this.onChange = () => this.listener?.(); input.addEventListener('change', this.onChange); }
              addListener(_event, listener) { this.listener = listener; return { remove: () => this.input.removeEventListener('change', this.onChange) }; }
              getPlace() { return { name: '테스트마트', place_id: 'fixture', geometry: { location: { lat: () => 37.5, lng: () => 127 } } }; }
            },
        };
        window.mapsLibraryRequests = [];
        const maps = { importLibrary: async name => {
          window.mapsLibraryRequests.push(name);
          await new Promise(resolve => setTimeout(resolve, 20));
          if (name === 'maps') maps.Map = Map;
          if (name === 'marker') maps.Marker = Marker;
          if (name === 'places') maps.places = places;
          return name === 'places' ? places : maps;
        } };
        if (localStorage.getItem('mapsFixtureMode') !== 'bootstrap') Object.assign(maps, { Map, Marker });
        window.google = { maps };
      }
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && message.text().includes('failed to load Google Maps:')) errors.push(message.text());
    });
    await page.route(/^https:\/\/(developers\.kakao\.com|dapi\.kakao\.com|maps\.googleapis\.com)\//, route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/_next/image?**', route => {
      if (!new URL(route.request().url()).searchParams.get('url').startsWith('http')) return route.continue();
      return route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2uoAAAAASUVORK5CYII=', 'base64') });
    });
    await page.route('**/api/**', route => {
      const request = route.request();
      const result = respond(new URL(request.url()).pathname, request.method(), request.postData());
      return route.fulfill({ status: result.status || 200, json: result.json });
    });
    await page.routeWebSocket(/socket\.io/, socket => {
      socket.send('0{"sid":"mobile-fixture","upgrades":[],"pingInterval":25000,"pingTimeout":20000}');
      socket.onMessage(message => {
        if (message === '40') socket.send('40{"sid":"mobile-fixture"}');
        if (typeof message === 'string' && message.startsWith('42')) {
          const [event, payload] = JSON.parse(message.slice(2));
          if (event === 'message') socket.send(`42${JSON.stringify(['message', { ...payload, userId: state.userId, nickname, createdAt: new Date().toISOString() }])}`);
        }
      });
    });
    const fits = async label => {
      const result = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 6).map(element => element.tagName + '.' + element.className) }));
      assert.ok(result.scroll <= result.width + 1, `${label}: ${JSON.stringify(result)}`);
    };
    await mkdir('/tmp/gachimura-mobile-check', { recursive: true });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 740 });
      for (const path of ['/home', '/community', '/chats', '/user/1', '/create-party', '/party/1', '/chat/1', '/settlement/1', '/login']) {
        await page.goto(base + path);
        await page.locator('h1:visible,h2:visible').first().waitFor();
        if (path === '/home') await page.getByRole('link', { name: /작은 화면에서도/ }).first().waitFor();
        if (path === '/community') await page.getByText('LongPost'.repeat(30), { exact: true }).waitFor();
        if (path === '/chats') await page.getByRole('link', { name: /작은 화면에서도.*채팅방/ }).waitFor();
        if (path === '/chat/1') await page.getByRole('textbox', { name: '메시지를 입력하세요...' }).waitFor();
        await fits(`${width}px ${path}`);
        if (width === 320 && path === '/home') {
          assert.equal(await page.getByRole('navigation', { name: '주 메뉴' }).count(), 1);
          await page.evaluate(() => window.denyLocationForTest());
          await page.getByText('위치 없이도 검색과 필터를 이용할 수 있어요.').waitFor();
        }
        if (path === '/chat/1' || path === '/settlement/1' || path === '/login') assert.equal(await page.getByRole('navigation', { name: '주 메뉴' }).count(), 0);
        if (path === '/create-party') {
          assert.equal(await page.locator('input[type=date]').isVisible(), true);
          assert.equal(await page.locator('input[type=time]').isVisible(), true);
        }
        if (width === 390 && ['/home', '/chat/1', '/settlement/1'].includes(path)) await page.screenshot({ path: `/tmp/gachimura-mobile-check/${path.replaceAll('/', '')}.png`, fullPage: true, animations: 'disabled' });
      }
    }
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(base + '/home?search=테스트');
    await page.getByRole('combobox').selectOption('imminent');
    await page.waitForURL(/filter=imminent/);
    assert.equal(new URL(page.url()).searchParams.get('search'), '테스트');
    await page.getByRole('checkbox').click();
    await page.waitForURL(/completed=false/);
    await page.goto(base + '/community');
    await page.getByRole('combobox').selectOption('popular');
    await page.waitForURL(/filter=popular/);
    await page.getByRole('link', { name: '글쓰기', exact: true }).first().click();
    const composer = page.getByRole('dialog');
    await composer.waitFor();
    await page.keyboard.press('Escape');
    await composer.waitFor({ state: 'hidden' });
    await page.goto(base + '/user/1');
    await page.getByRole('button', { name: '정보 수정' }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });

    await page.goto(base + '/chat/1');
    const input = page.getByRole('textbox', { name: '메시지를 입력하세요...' });
    await input.fill('모바일 전송 확인');
    await page.getByRole('button', { name: '전송', exact: true }).click();
    await page.getByText('모바일 전송 확인', { exact: true }).waitFor();
    await page.evaluate(() => {
      Object.defineProperties(visualViewport, { height: { configurable: true, value: 420 }, offsetTop: { configurable: true, value: 15 } });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    assert.ok((await input.boundingBox()).y + (await input.boundingBox()).height <= 436, 'chat input must fit the reduced visual viewport');
    await page.getByRole('button', { name: '참여 멤버', exact: true }).click();
    await page.getByRole('dialog', { name: '참여 멤버' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: '참여 멤버', exact: true }).evaluate(element => element === document.activeElement), true);

    await page.goto(base + '/settlement/1');
    const camera = page.locator('input[type=file][capture=environment]');
    const album = page.locator('input[type=file]:not([capture])');
    assert.equal(await camera.count(), 1);
    assert.equal(await album.count(), 1);
    const image = { name: 'receipt.png', mimeType: 'image/png', buffer: Buffer.from('fixture receipt') };
    await page.getByRole('textbox', { name: '품목명', exact: true }).fill('업로드 전에 수정한 품목');
    await album.setInputFiles([]);
    assert.equal(await page.getByRole('textbox', { name: '품목명', exact: true }).inputValue(), '업로드 전에 수정한 품목');
    await album.setInputFiles(image);
    await page.locator('p[role=status]').filter({ hasText: '영수증 업로드 실패' }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: '품목명', exact: true }).inputValue(), '업로드 전에 수정한 품목');
    await album.setInputFiles(image);
    await page.waitForFunction(() => document.querySelector('input[placeholder="품목명"]').value === '인식한 품목');
    await page.getByRole('textbox', { name: '품목명', exact: true }).fill('수정한 품목');
    await page.getByRole('spinbutton', { name: '수량', exact: true }).fill('3');
    await page.getByRole('spinbutton', { name: '가격 (원)', exact: true }).fill('4500');
    assert.equal(await page.getByText('₩13,500', { exact: true }).count(), 1);
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/settlements/10/items')),
      page.getByRole('button', { name: '품목 저장', exact: true }).click(),
    ]);
    assert.deepEqual(state.savedItems, [{ name: '수정한 품목', quantity: 3, price: 4500 }]);
    assert.equal(state.uploadAttempts, 2);
    state.userId = 2;
    state.status = 'SELECTING';
    await page.goto(base + '/settlement/1');
    assert.equal(await page.getByRole('button', { name: '사진 촬영' }).count(), 0);
    await page.getByRole('button', { name: /영수증 품목/ }).click();
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/settlements/10/select')),
      page.getByRole('button', { name: '선택 완료', exact: true }).click(),
    ]);
    assert.deepEqual(state.selections, { itemIds: [11] });

    await page.goto(base + '/party/1');
    const joinButton = page.getByRole('button', { name: '모임 가입 신청하기' });
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/parties/1/join')),
      joinButton.evaluate(button => { button.click(); button.click(); }),
    ]);
    assert.equal(state.joinRequests, 1, 'rapid taps must send one participation request');
    await page.goto(base + '/create-party');
    await page.getByLabel('제목', { exact: true }).fill('모바일 생성 테스트');
    await page.locator('input[type=date]').fill('2026-10-20');
    await page.locator('input[type=time]').fill('19:30');
    await page.getByLabel('모임 설명', { exact: true }).fill('함께 장보기');
    await page.getByPlaceholder('마트 이름을 검색하세요').fill('테스트마트');
    await page.getByPlaceholder('마트 이름을 검색하세요').press('Tab');
    await page.waitForFunction(() => document.querySelector('input[name=place_id]').value === 'fixture');
    assert.ok(await page.evaluate(() => window.mapsLibraryRequests.includes('places')), 'a preloaded map without Places must import it before selecting a store');
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/parties') && response.request().method() === 'POST'),
      page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); }),
    ]);
    assert.equal(state.createRequests, 1, 'rapid submits must create one party');
    await page.waitForURL('**/home');
    await page.evaluate(() => localStorage.setItem('mapsFixtureMode', 'bootstrap'));
    await page.goto(base + '/create-party');
    await page.getByPlaceholder('마트 이름을 검색하세요').fill('테스트마트');
    await page.getByPlaceholder('마트 이름을 검색하세요').press('Tab');
    await page.waitForFunction(() => document.querySelector('input[name=place_id]').value === 'fixture');
    assert.equal(await page.locator('script[src*="maps.googleapis.com"]').count(), 0, 'reuse an existing Maps bootstrap without loading a second SDK');

    state.userId = 1;
    state.status = 'DRAFT';
    state.chatError = true;
    await page.goto(base + '/chats');
    await page.getByRole('button', { name: '다시 시도' }).waitFor();
    state.chatError = false;
    await page.getByRole('button', { name: '日本語', exact: true }).click();
    await page.getByRole('link', { name: /のチャットルーム/ }).waitFor();
    assert.equal(await page.locator('p[role=alert]').count(), 0);
    await fits('Japanese chats');
    for (const path of ['/home', '/create-party', '/settlement/1']) {
      await page.goto(base + path);
      await page.locator('h1:visible,h2:visible').first().waitFor();
      await fits('Japanese ' + path);
    }
    await page.getByRole('button', { name: '한국어', exact: true }).click();
    state.emptyChats = true;
    await page.goto(base + '/chats');
    await page.getByText('참여 중인 채팅이 없습니다.', { exact: true }).waitFor();
    state.emptyChats = false;
    state.anonymous = true;
    await page.goto(base + '/chats');
    await page.waitForURL('**/login');
    await page.locator('input[name=email]').waitFor();
    assert.deepEqual(errors, []);
    console.log('36 viewport/page checks and mobile interaction regressions passed; screenshots: /tmp/gachimura-mobile-check');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
