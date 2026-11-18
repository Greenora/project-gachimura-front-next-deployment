/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node test */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('frontend deployment updates its pointer without fetching an unavailable backend revision', { timeout: 20000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gachimura-deploy-test-'));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(root, 'gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'protocol.file.allow', GIT_CONFIG_VALUE_0: 'always' };
  function run(command, args, cwd = root) {
    const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    return result.stdout.trim();
  }
  const git = (cwd, ...args) => run('git', args, cwd);
  function init(name, branch) {
    const directory = path.join(root, name);
    run('git', ['init', '-b', branch, directory]);
    git(directory, 'config', 'user.name', 'Fixture');
    git(directory, 'config', 'user.email', 'fixture@example.test');
    return directory;
  }
  try {
    const frontend = init('frontend', 'main');
    fs.writeFileSync(path.join(frontend, 'version.txt'), 'old');
    git(frontend, 'add', '.');
    git(frontend, 'commit', '-m', 'old frontend');
    const deploy = init('deploy', 'develop');
    git(deploy, 'submodule', 'add', '-b', 'main', frontend, 'frontend');
    const unavailableBackend = path.join(root, 'backend.git');
    run('git', ['init', '--bare', unavailableBackend]);
    fs.appendFileSync(path.join(deploy, '.gitmodules'), `\n[submodule "backend"]\n\tpath = backend\n\turl = ${unavailableBackend}\n`);
    const missingRevision = '1'.repeat(40);
    git(deploy, 'add', '.gitmodules');
    git(deploy, 'update-index', '--add', '--cacheinfo', `160000,${missingRevision},backend`);
    git(deploy, 'commit', '-m', 'deployment pointers');
    const origin = path.join(root, 'deploy.git');
    run('git', ['clone', '--bare', deploy, origin]);
    fs.writeFileSync(path.join(frontend, 'version.txt'), 'new');
    git(frontend, 'add', '.');
    git(frontend, 'commit', '-m', 'new frontend');
    const expected = git(frontend, 'rev-parse', 'HEAD');
    const checkout = path.join(root, 'checkout');
    run('git', ['clone', '--branch', 'develop', origin, checkout]);

    const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/update-main.yml'), 'utf8');
    if (/^\s+submodules:\s*(?:true|recursive)\s*$/m.test(workflow)) {
      git(checkout, 'submodule', 'update', '--init', '--recursive');
    }
    const lines = workflow.split('\n');
    const start = lines.indexOf('        run: |');
    assert.ok(start >= 0, 'the workflow must contain its update script');
    const script = [];
    for (const line of lines.slice(start + 1)) {
      if (line.trim() && !line.startsWith('          ')) break;
      script.push(line.slice(10));
    }
    run('bash', ['-e', '-c', script.join('\n')], checkout);

    assert.equal(git(root, '--git-dir', origin, 'rev-parse', 'develop:frontend'), expected);
    assert.equal(git(root, '--git-dir', origin, 'rev-parse', 'develop:backend'), missingRevision);
    assert.equal(fs.existsSync(path.join(checkout, '.git/modules/backend')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
