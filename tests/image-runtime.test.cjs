/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loadConfig = require('next/dist/server/config').default;
const { PHASE_PRODUCTION_SERVER } = require('next/constants');
const { ImageOptimizerCache } = require('next/dist/server/image-optimizer');

test('production image requests allow configured sources and the local fallback, while rejecting other hosts', async () => {
  const config = await loadConfig(PHASE_PRODUCTION_SERVER, path.resolve(__dirname, '..'));
  const request = { headers: { accept: 'image/webp' } };
  const validate = url => ImageOptimizerCache.validateParams(request, { url, w: '640', q: '75' }, config, false);

  for (const url of [
    'https://picsum.photos/seed/1/600/600',
    'https://api.dicebear.com/9.x/initials/png?seed=Tester',
    'https://images.unsplash.com/photo-example',
    '/images/gachimura_logo.png',
  ]) {
    const result = validate(url);
    assert.equal(result.errorMessage, undefined, url);
    assert.equal(result.href, url);
  }

  assert.equal(validate('https://untrusted.example/image.png').errorMessage, '"url" parameter is not allowed');
});
