/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(
  readFileSync('app/hooks/useClientFetch.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function client(fetch) {
  const events = [];
  const context = {
    exports: {}, fetch, FormData, process: { env: {} },
    document: {}, window: { location: { pathname: '/home', href: '' }, dispatchEvent: event => events.push(event) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    require: (name) => name === 'react' ? {} : {
      API_CONFIG: { PUBLIC_BASE_URL: 'http://localhost:8000/api/' },
    },
  };
  vm.runInNewContext(source, context);
  return { request: context.exports.clientFetch, location: context.window.location, events };
}

test('expired requests share one refresh, then retry with cookies', async () => {
  let refreshed = false;
  let refreshes = 0;
  let requests = 0;
  const { request } = client(async (url, options) => {
    assert.equal(options.credentials, 'include');
    if (url.endsWith('/auth/refresh')) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      refreshed = true;
      return Response.json({ expiresIn: 3600 });
    }
    requests++;
    return Response.json({ id: 1 }, { status: refreshed ? 200 : 401 });
  });
  const results = await Promise.all([request('/users/profile'), request('/users/profile')]);
  assert.equal(results[0].id, 1);
  assert.equal(refreshes, 1);
  assert.equal(requests, 4);
});

test('incorrect login does not refresh', async () => {
  let calls = 0;
  const { request } = client(async () => {
    calls++;
    return Response.json({ message: 'invalid login' }, { status: 401 });
  });
  await assert.rejects(request('/auth/login', { method: 'POST' }), /invalid login/);
  assert.equal(calls, 1);
});

test('authentication succeeds only after the browser cookie authenticates a profile', async t => {
  for (const path of ['/auth/login', '/auth/kakao', '/auth/line']) {
    await t.test(path, async () => {
      const urls = [];
      const login = { user: { id: 1, nickname: 'Tester', email: 'tester@example.com' }, expiresIn: 3600 };
      const { request, location } = client(async (url, options) => {
        urls.push(url);
        assert.equal(options.credentials, 'include');
        if (url.endsWith('/users/profile')) {
          assert.equal(options.method || 'GET', 'GET');
          assert.equal(options.headers?.Authorization, undefined);
          assert.equal(options.cache, 'no-store');
          return Response.json(login.user);
        }
        assert.equal(options.method, 'POST');
        return Response.json(login);
      });
      assert.equal(JSON.stringify(await request(path, { method: 'POST' })), JSON.stringify(login));
      assert.deepEqual(urls.map(url => new URL(url).pathname), [`/api${path}`, '/api/users/profile']);
      assert.equal(location.href, '');
    });
  }
});

test('authentication rejects a missing or unverifiable session without refresh or redirect', async t => {
  const failures = [
    { path: '/auth/login', profile: () => Response.json({ message: 'Unauthorized' }, { status: 401 }) },
    { path: '/auth/kakao', profile: () => Response.json({ message: 'Unavailable' }, { status: 503 }) },
    { path: '/auth/line', profile: () => { throw new TypeError('Network unavailable'); } },
  ];
  for (const { path, profile } of failures) {
    await t.test(path, async () => {
      const urls = [];
      const { request, location } = client(async (url, options) => {
        urls.push(url);
        assert.equal(options.credentials, 'include');
        if (url.endsWith('/users/profile')) return profile();
        return Response.json({ user: { id: 1, nickname: 'Tester' }, expiresIn: 3600 });
      });
      await assert.rejects(request(path, { method: 'POST' }), error =>
        error.code === 'SESSION_NOT_ESTABLISHED' && error.status === 503);
      assert.deepEqual(urls.map(url => new URL(url).pathname), [`/api${path}`, '/api/users/profile']);
      assert.equal(location.href, '');
    });
  }
});

test('authentication rejects a cookie session belonging to another account', async () => {
  const urls = [];
  const { request, location } = client(async url => {
    urls.push(url);
    return Response.json(url.endsWith('/users/profile')
      ? { id: 2, email: 'previous@example.com' }
      : { user: { id: 1, email: 'new@example.com' }, expiresIn: 3600 });
  });
  await assert.rejects(request('/auth/login', { method: 'POST' }), error =>
    error.code === 'SESSION_NOT_ESTABLISHED' && error.status === 503);
  assert.deepEqual(urls.map(url => new URL(url).pathname), ['/api/auth/login', '/api/users/profile']);
  assert.equal(location.href, '');
});

test('ordinary requests and non-login auth operations do not probe a session', async () => {
  for (const [path, method] of [
    ['/parties', 'GET'], ['/users/profile', 'GET'], ['/auth/login', 'GET'],
    ['/auth/refresh', 'POST'], ['/auth/logout', 'POST'],
  ]) {
    const urls = [];
    const { request } = client(async url => {
      urls.push(url);
      return Response.json({ success: true });
    });
    assert.equal((await request(path, { method })).success, true);
    assert.deepEqual(urls.map(url => new URL(url).pathname), [`/api${path}`]);
  }
});

test('failed refresh sends protected requests to login', async () => {
  const { request, location } = client(async () => new Response(null, { status: 401 }));
  await assert.rejects(request('/users/profile'), /401/);
  assert.equal(location.href, '/login');
});

test('optional profile checks do not redirect guests', async () => {
  const { request, location } = client(async () => new Response(null, { status: 401 }));
  await assert.rejects(request('/users/profile', { redirectOnUnauthorized: false }));
  assert.equal(location.href, '');
});

test('optional guest checks do not suppress a concurrent protected request redirect', async () => {
  let releaseProtected;
  const { request, location } = client(async url => {
    if (url.endsWith('/parties/joined')) return new Promise(resolve => { releaseProtected = resolve; });
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  });
  const protectedFailure = assert.rejects(request('/parties/joined'));
  await assert.rejects(request('/users/profile', { redirectOnUnauthorized: false }));
  assert.equal(location.href, '');
  releaseProtected(Response.json({ message: 'Unauthorized' }, { status: 401 }));
  await protectedFailure;
  assert.equal(location.href, '/login');
});

test('a retried unauthorized request stops after one refresh', async () => {
  let calls = 0;
  const { request } = client(async url => {
    calls++;
    return new Response(null, { status: url.endsWith('/auth/refresh') ? 204 : 401 });
  });
  await assert.rejects(request('/users/profile'));
  assert.equal(calls, 3);
});

test('upload retries preserve FormData without a JSON content type', async () => {
  const body = new FormData();
  body.append('thumbnail_image', new Blob(['image']), 'photo.png');
  let calls = 0;
  const { request } = client(async (url, options) => {
    if (url.endsWith('/auth/refresh')) return new Response(null, { status: 204 });
    calls++;
    assert.equal(options.body, body);
    assert.equal(options.headers['Content-Type'], undefined);
    return Response.json({}, { status: calls === 1 ? 401 : 201 });
  });
  await request('/parties', { method: 'POST', body });
  assert.equal(calls, 2);
});

test('expired access token can refresh before logout', async () => {
  const urls = [];
  const { request } = client(async url => {
    urls.push(url);
    return new Response(null, { status: urls.length === 1 ? 401 : 204 });
  });
  await request('/auth/logout', { method: 'POST' });
  assert.equal(urls.map(url => url.split('/').pop()).join(','), 'logout,refresh,logout');
});

test('verified login and logout update shared profile consumers', async () => {
  const user = { id: 2, nickname: 'New user', email: 'new@example.com' };
  const { request, events } = client(async url => Response.json(
    url.endsWith('/auth/login') ? { user } : url.endsWith('/users/profile') ? user : {},
  ));
  await request('/auth/login', { method: 'POST' });
  await request('/auth/logout', { method: 'POST' });
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'gachimura:user-changed');
  assert.equal(events[0].detail.id, 2);
  assert.equal(events[1].detail, null);
});

test('an old unauthorized response cannot invalidate a newly verified login', async () => {
  let releaseOldResponse;
  const user = { id: 2, email: 'new@example.com' };
  const { request, events, location } = client(async url => {
    if (url.endsWith('/old-session')) return new Promise(resolve => { releaseOldResponse = resolve; });
    if (url.endsWith('/auth/login')) return Response.json({ user });
    if (url.endsWith('/users/profile')) return Response.json(user);
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  });
  const oldRequest = request('/old-session');
  await request('/auth/login', { method: 'POST' });
  releaseOldResponse(Response.json({ message: 'Unauthorized' }, { status: 401 }));
  await assert.rejects(oldRequest);
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.id, 2);
  assert.equal(location.href, '');
});

test('terminal unauthorized responses invalidate the shared user even with a non-JSON body', async () => {
  const { request, events } = client(async () => new Response('Unauthorized', { status: 401 }));
  await assert.rejects(request('/users/profile', { redirectOnUnauthorized: false }));
  assert.equal(events.length, 1);
  assert.equal(events[0].detail, null);
});

test('an old unauthorized response body cannot redirect a new session', async () => {
  let releaseBody;
  let bodyStarted;
  const pendingBody = new Promise(resolve => { bodyStarted = resolve; });
  const user = { id: 2, email: 'new@example.com' };
  const { request, events, location } = client(async url => {
    if (url.endsWith('/old-session')) return {
      status: 401, ok: false,
      text() { bodyStarted(); return new Promise(resolve => { releaseBody = resolve; }); },
    };
    if (url.endsWith('/auth/login')) return Response.json({ user });
    if (url.endsWith('/users/profile')) return Response.json(user);
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  });
  const oldRequest = request('/old-session');
  await pendingBody;
  await request('/auth/login', { method: 'POST' });
  releaseBody(JSON.stringify({ message: 'Unauthorized' }));
  await assert.rejects(oldRequest);
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.id, 2);
  assert.equal(location.href, '');
});

test('a late login probe cannot restore a user after logout', async () => {
  let releaseProbe;
  let probeStarted;
  const pendingProbe = new Promise(resolve => { probeStarted = resolve; });
  const user = { id: 2, email: 'new@example.com' };
  const { request, events } = client(async url => {
    if (url.endsWith('/users/profile')) return {
      ok: true,
      json() { probeStarted(); return new Promise(resolve => { releaseProbe = resolve; }); },
    };
    return Response.json(url.endsWith('/auth/login') ? { user } : {});
  });
  const login = request('/auth/login', { method: 'POST' });
  await pendingProbe;
  await request('/auth/logout', { method: 'POST' });
  releaseProbe(user);
  await assert.rejects(login, error => error.code === 'SESSION_NOT_ESTABLISHED');
  assert.equal(events.length, 1);
  assert.equal(events[0].detail, null);
});

test('an old mutation is not refreshed or replayed after another account logs in', async () => {
  let releaseMutation;
  let mutations = 0;
  let refreshes = 0;
  const user = { id: 2, email: 'new@example.com' };
  const { request, events } = client(async url => {
    if (url.endsWith('/users/profile')) return Response.json(user);
    if (url.endsWith('/auth/login')) return Response.json({ user });
    if (url.endsWith('/auth/refresh')) { refreshes++; return Response.json({}); }
    mutations++;
    if (mutations > 1) return Response.json({});
    return new Promise(resolve => { releaseMutation = resolve; });
  });
  const mutation = request('/settlements/1/items', { method: 'PATCH', body: { items: [{ name: 'Previous account item' }] } });
  await request('/auth/login', { method: 'POST' });
  releaseMutation(Response.json({ message: 'Unauthorized' }, { status: 401 }));
  await assert.rejects(mutation);
  assert.equal(mutations, 1);
  assert.equal(refreshes, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.id, 2);
});

test('an account change during refresh prevents replaying the original mutation', async () => {
  let releaseRefresh;
  let refreshStarted;
  const pendingRefresh = new Promise(resolve => { refreshStarted = resolve; });
  let mutations = 0;
  const user = { id: 2, email: 'new@example.com' };
  const { request, events } = client(async url => {
    if (url.endsWith('/users/profile')) return Response.json(user);
    if (url.endsWith('/auth/login')) return Response.json({ user });
    if (url.endsWith('/auth/refresh')) {
      refreshStarted();
      return new Promise(resolve => { releaseRefresh = resolve; });
    }
    mutations++;
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  });
  const mutation = request('/settlements/1/items', { method: 'PATCH', body: { items: [{ name: 'Previous account item' }] } });
  await pendingRefresh;
  await request('/auth/login', { method: 'POST' });
  releaseRefresh(Response.json({}));
  await assert.rejects(mutation);
  assert.equal(mutations, 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.id, 2);
});

test('socket URL excludes API prefix and Docker uses backend port 8000', () => {
  const context = { exports: {}, process: { env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8000/api', NEXT_PUBLIC_DOCKER: 'true',
  } } };
  vm.runInNewContext(ts.transpileModule(readFileSync('config/api.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, context);
  assert.equal(context.exports.API_CONFIG.SOCKET_URL, 'http://localhost:8000');
  assert.equal(context.exports.API_CONFIG.INTERNAL_BASE_URL, 'http://backend:8000/api');
});
