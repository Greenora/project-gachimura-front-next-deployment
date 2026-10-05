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
  const context = {
    exports: {}, fetch, FormData, process: { env: {} },
    document: {}, window: { location: { pathname: '/home', href: '' } },
    require: (name) => name === 'react' ? {} : {
      API_CONFIG: { PUBLIC_BASE_URL: 'http://localhost:8000/api/' },
    },
  };
  vm.runInNewContext(source, context);
  return { request: context.exports.clientFetch, location: context.window.location };
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
