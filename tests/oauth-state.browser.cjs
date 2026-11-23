/* eslint-disable @typescript-eslint/no-require-imports -- standalone browser security regression fixture */
// Build with public fixture Client IDs, then start Next with INTERNAL_API_URL=http://127.0.0.1:3499/api.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { mkdirSync } = require('node:fs');
const { chromium } = require('playwright');

test('Kakao and LINE callbacks require a fresh one-use browser state in both languages', { timeout: 240000 }, async t => {
  const base = process.env.TEST_FRONTEND_URL || 'http://127.0.0.1:3149';
  const user = { id: 1, nickname: 'OAuth fixture', nickname_jp: 'ログイン確認用' };
  const state = { user: null, exchanges: [], conflict: false, hold: false, held: [], arrived: null };
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify([]));
  });
  await new Promise(resolve => server.listen(3499, '127.0.0.1', resolve));
  let browser;
  const errors = [];
  const contexts = new Set();
  const errorCopy = japanese => japanese
    ? 'ログインを確認できませんでした。もう一度ログインしてください。'
    : '로그인 요청을 확인하지 못했습니다. 다시 로그인해주세요.';

  async function open({ japanese = false, width = 390, blocked = false } = {}) {
    state.user = null;
    const context = await browser.newContext({
      viewport: { width, height: 900 }, serviceWorkers: 'block',
      locale: japanese ? 'ja-JP' : 'ko-KR', timezoneId: japanese ? 'Asia/Tokyo' : 'Asia/Seoul',
    });
    contexts.add(context);
    await context.addCookies([{ name: 'language', value: japanese ? 'japanese' : 'korean', url: base }]);
    await context.addInitScript(({ blocked }) => {
      localStorage.setItem('userLocation', JSON.stringify({ latitude: 37.5, longitude: 127, region: '서울', district: '중구' }));
      if (blocked) Object.defineProperty(window, 'sessionStorage', { configurable: true, get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
    }, { blocked });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== base) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (url.pathname === '/api/users/profile') return route.fulfill(state.user ? { json: state.user } : { status: 401, json: { message: 'Unauthorized' } });
      if (/^\/api\/auth\/(kakao|line)$/.test(url.pathname) && request.method() === 'POST') {
        state.exchanges.push({ provider: url.pathname.split('/').at(-1), body: request.postDataJSON() });
        state.arrived?.();
        if (state.conflict) return route.fulfill({ status: 409, json: { message: 'PRIVATE_CONFLICT_DETAIL' } });
        if (state.hold) await new Promise(resolve => state.held.push(resolve));
        state.user = user;
        try { return await route.fulfill({ json: { user }, headers: { 'Set-Cookie': 'accessToken=oauth-fixture; Path=/; HttpOnly; SameSite=Lax' } }); }
        catch { return; }
      }
      if (url.pathname === '/api/auth/refresh') return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
      if (url.pathname === '/api/push/config') return route.fulfill({ json: { enabled: false, publicKey: null } });
      return route.fulfill({ json: [] });
    });
    return page;
  }

  async function pending(page, provider, change = {}) {
    return page.evaluate(({ provider, change }) => {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(`${provider}_auth_state`, JSON.stringify({ state: value, createdAt: Date.now(), ...change }));
      return value;
    }, { provider, change });
  }

  async function check(name, run) {
    await t.test(name, async () => {
      state.exchanges = [];
      state.conflict = false;
      state.hold = false;
      try { await run(); }
      finally {
        for (const release of state.held.splice(0)) release();
        await Promise.all([...contexts].map(context => context.close()));
        contexts.clear();
      }
    });
  }

  try {
    browser = await chromium.launch();
    for (const japanese of [false, true]) {
      for (const provider of ['kakao', 'line']) {
        await check(`${provider} ${japanese ? 'JA' : 'KO'} starts with random state and consumes a valid callback once`, async () => {
          const page = await open({ japanese });
          let authorization;
          const pattern = provider === 'kakao' ? 'https://kauth.kakao.com/oauth/authorize**' : 'https://access.line.me/oauth2/v2.1/authorize**';
          await page.route(pattern, async route => {
            authorization = new URL(route.request().url());
            await route.fulfill({ status: 302, headers: { location: `${base}/login?provider-fixture=${provider}` } });
          });
          await page.goto(base + '/login');
          const login = provider === 'kakao' ? /카카오|カカオ/ : /LINE/;
          await page.getByRole('button', { name: login }).click();
          await page.waitForURL(`${base}/login?provider-fixture=${provider}`);
          assert.ok(authorization, 'authorization must stay inside the intercepted provider');
          assert.match(authorization.searchParams.get('state'), /^[a-f0-9]{64}$/);
          assert.equal(authorization.searchParams.get('redirect_uri'), `${base}/${provider}/callback`);
          const saved = await page.evaluate(provider => JSON.parse(sessionStorage.getItem(`${provider}_auth_state`)), provider);
          assert.equal(saved.state, authorization.searchParams.get('state'));
          assert.equal(state.exchanges.length, 0);
          await page.goto(`${base}/${provider}/callback?code=fixture-code&state=${saved.state}`);
          await page.waitForURL(base + '/home');
          assert.equal(await page.locator('html').getAttribute('lang'), japanese ? 'ja' : 'ko');
          assert.equal(state.exchanges.length, 1);
          assert.deepEqual(state.exchanges[0], { provider, body: { code: 'fixture-code', redirectUri: `${base}/${provider}/callback`, language: japanese ? 'jp' : 'ko' } });
          assert.equal(await page.evaluate(provider => sessionStorage.getItem(`${provider}_auth_state`), provider), null);
          assert.equal(await page.evaluate(() => location.search), '');
          state.user = null;
          await page.context().clearCookies();
          await page.context().addCookies([{ name: 'language', value: japanese ? 'japanese' : 'korean', url: base }]);
          await page.goto(`${base}/${provider}/callback?code=fixture-code&state=${saved.state}`);
          await page.getByText(errorCopy(japanese), { exact: true }).last().waitFor();
          assert.equal(state.exchanges.length, 1, 'a consumed attempt must not exchange its code twice');
        });

        if (provider === 'kakao') {
          await check(`kakao ${japanese ? 'JA' : 'KO'} explains an existing-account conflict without signing in`, async () => {
            const page = await open({ japanese });
            await page.goto(base + '/login');
            const saved = await pending(page, provider);
            state.conflict = true;
            await page.goto(`${base}/kakao/callback?code=fixture-code&state=${saved}`);
            await page.getByText(japanese
              ? 'このメールアドレスはすでに登録されています。以前と同じ方法でログインしてください。'
              : '같은 이메일의 계정이 있습니다. 기존 로그인 방식으로 로그인해주세요.', { exact: true }).last().waitFor();
            await page.waitForURL(base + '/login');
            assert.equal(state.exchanges.length, 1);
            assert.equal(state.user, null);
            assert.equal((await page.context().cookies()).some(cookie => cookie.name === 'accessToken'), false);
            assert.equal(await page.getByText('PRIVATE_CONFLICT_DETAIL', { exact: true }).count(), 0);
          });
        }

        for (const invalid of ['both-missing', 'stored-missing', 'query-missing', 'mismatch', 'expired', 'future', 'malformed', 'code-missing']) {
          await check(`${provider} ${japanese ? 'JA' : 'KO'} refuses ${invalid} without an API exchange`, async () => {
            const page = await open({ japanese });
            await page.goto(base + '/login');
            let saved = await pending(page, provider);
            if (invalid === 'both-missing' || invalid === 'stored-missing') await page.evaluate(provider => sessionStorage.removeItem(`${provider}_auth_state`), provider);
            if (invalid === 'mismatch') saved = 'f'.repeat(64);
            if (invalid === 'expired' || invalid === 'future') {
              await page.evaluate(({ provider, invalid }) => {
                const key = `${provider}_auth_state`;
                const value = JSON.parse(sessionStorage.getItem(key));
                value.createdAt = Date.now() + (invalid === 'future' ? 60_000 : -600_001);
                sessionStorage.setItem(key, JSON.stringify(value));
              }, { provider, invalid });
            }
            if (invalid === 'malformed') await page.evaluate(provider => sessionStorage.setItem(`${provider}_auth_state`, '{'), provider);
            const params = new URLSearchParams();
            if (invalid !== 'code-missing') params.set('code', 'fixture-code');
            if (!['both-missing', 'query-missing'].includes(invalid)) params.set('state', saved);
            await page.goto(`${base}/${provider}/callback?${params}`);
            await page.getByText(errorCopy(japanese), { exact: true }).last().waitFor();
            await page.waitForURL(base + '/login');
            assert.equal(state.exchanges.length, 0);
            assert.equal(await page.evaluate(provider => sessionStorage.getItem(`${provider}_auth_state`), provider), null);
            assert.equal(await page.locator('html').getAttribute('lang'), japanese ? 'ja' : 'ko');
            if (provider === 'line' && invalid === 'both-missing' && process.env.TEST_SCREENSHOT_DIR) {
              mkdirSync(process.env.TEST_SCREENSHOT_DIR, { recursive: true });
              for (const [device, width] of [['mobile', 390], ['desktop', 1280]]) {
                await page.setViewportSize({ width, height: 1000 });
                await page.screenshot({ path: `${process.env.TEST_SCREENSHOT_DIR}/oauth-rejected-${japanese ? 'ja' : 'ko'}-${device}.png`, animations: 'disabled' });
              }
            }
          });
        }
      }
    }

    for (const provider of ['kakao', 'line']) {
      await check(`${provider} fails closed when browser storage or randomness is unavailable`, async () => {
        const blocked = await open({ blocked: true });
        await blocked.goto(`${base}/${provider}/callback?code=fixture-code&state=${'a'.repeat(64)}`);
        await blocked.getByText(errorCopy(false), { exact: true }).last().waitFor();
        assert.equal(state.exchanges.length, 0);
        const page = await open();
        await page.goto(base + '/login');
        await page.evaluate(() => Object.defineProperty(crypto, 'getRandomValues', { configurable: true, value: () => { throw new DOMException('Randomness unavailable'); } }));
        await page.getByRole('button', { name: provider === 'kakao' ? /카카오|カカオ/ : /LINE/ }).click();
        await page.getByText('로그인을 시작하지 못했습니다. 브라우저 설정을 확인한 뒤 다시 시도해주세요.', { exact: true }).last().waitFor();
        assert.equal(state.exchanges.length, 0);
        assert.equal(await page.evaluate(provider => sessionStorage.getItem(`${provider}_auth_state`), provider), null);
      });
    }

    await check('refreshing a callback while its request is pending does not reuse the authorization attempt', async () => {
      const page = await open();
      await page.goto(base + '/login');
      const saved = await pending(page, 'kakao');
      state.hold = true;
      const arrived = new Promise(resolve => { state.arrived = resolve; });
      await page.goto(`${base}/kakao/callback?code=fixture-code&state=${saved}`);
      await arrived;
      assert.equal(await page.evaluate(() => location.search), '');
      await page.reload();
      await page.getByText(errorCopy(false), { exact: true }).last().waitFor();
      assert.equal(state.exchanges.length, 1);
    });
    assert.deepEqual(errors, []);
  } finally {
    for (const release of state.held) release();
    await Promise.all([...contexts].map(context => context.close()));
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
