/* eslint-disable @typescript-eslint/no-require-imports -- Node hook regression harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync('app/hooks/useChat.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function chat() {
  const slots = [];
  const sockets = [];
  let index = 0;
  let effects = [];
  const react = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
    },
    useRef(initial) {
      const slot = index++;
      return slots[slot] ??= { current: initial };
    },
    useCallback(callback) { return callback; },
    useEffect(effect, dependencies) {
      const slot = index++;
      const previous = slots[slot];
      if (previous && dependencies.every((value, i) => value === previous.dependencies[i])) return;
      effects.push(() => {
        previous?.cleanup?.();
        slots[slot] = { dependencies, cleanup: effect() };
      });
    },
  };
  const context = {
    exports: {},
    require(name) {
      if (name === 'react') return react;
      if (name === '@/config/api') return { API_CONFIG: { SOCKET_URL: 'https://example.com' } };
      if (name === 'socket.io-client') return { io(url, options) {
        const handlers = new Map();
        const onceHandlers = new Map();
        const socket = {
          url, options, connected: false, emitted: [], connects: 0, disconnects: 0, id: undefined,
          on(event, handler) { handlers.set(event, handler); return socket; },
          once(event, handler) { onceHandlers.set(event, [...(onceHandlers.get(event) || []), handler]); return socket; },
          off(event, handler) { onceHandlers.set(event, (onceHandlers.get(event) || []).filter(item => item !== handler)); return socket; },
          timeout(delay) {
            assert.equal(delay, 8000);
            return { emit(event, payload, ack) { socket.emitted.push({ event, payload, ack }); } };
          },
          acknowledge(event, response = { ok: true }, error = null) {
            const pending = socket.emitted.find(item => item.event === event && item.ack);
            assert.ok(pending, `no pending ${event} acknowledgement`);
            const ack = pending.ack;
            delete pending.ack;
            ack(error, response);
          },
          connect() { socket.connects++; },
          disconnect() { socket.disconnects++; socket.receive('disconnect'); },
          removeAllListeners() { handlers.clear(); onceHandlers.clear(); },
          receive(event, payload) {
            if (event === 'connect') { socket.connected = true; socket.id = `connection-${socket.connects}`; }
            if (event === 'disconnect' || event === 'connect_error') socket.connected = false;
            handlers.get(event)?.(payload);
            const once = onceHandlers.get(event) || [];
            onceHandlers.delete(event);
            once.forEach(handler => handler(payload));
          },
        };
        sockets.push(socket);
        return socket;
      } };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(source, context);
  return {
    sockets,
    render(partyId = 1) {
      index = 0;
      const result = context.exports.useChat(partyId);
      const pending = effects;
      effects = [];
      pending.forEach(effect => effect());
      return result;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

test('failed connections cannot buffer messages, and sending waits for room and save acknowledgements', async () => {
  const hook = chat();
  let state = hook.render();
  const socket = hook.sockets[0];
  assert.equal(socket.options.withCredentials, true, 'HttpOnly session cookies authenticate the socket');
  assert.equal(state.connectionStatus, 'connecting');
  assert.equal(await state.sendMessage('keep my draft'), false);
  socket.receive('connect_error', new Error('Forbidden'));
  state = hook.render();
  assert.equal(state.connectionStatus, 'error');
  assert.equal(await state.sendMessage('keep my draft'), false);
  assert.equal(socket.emitted.length, 0);
  state.reconnect();
  assert.equal(hook.render().connectionStatus, 'connecting');
  assert.equal(socket.connects, 1);
  socket.receive('connect');
  state = hook.render();
  assert.equal(state.connectionStatus, 'connecting', 'transport connection alone does not mean room membership was checked');
  assert.equal(await state.sendMessage('too early'), false);
  socket.acknowledge('joinRoom');
  state = hook.render();
  assert.equal(state.connectionStatus, 'connected');
  let resolved = false;
  const sent = state.sendMessage('hello').then(value => { resolved = true; return value; });
  await Promise.resolve();
  assert.equal(resolved, false, 'do not report success before the server saved the message');
  socket.acknowledge('message');
  assert.equal(await sent, true);
  assert.equal(await state.sendMessage('   '), false);
  assert.equal(await state.sendMessage('x'.repeat(2001)), false);
  assert.equal(JSON.stringify(socket.emitted.map(({ event, payload }) => ({ event, payload }))), JSON.stringify([
    { event: 'joinRoom', payload: { partyId: 1 } },
    { event: 'message', payload: { partyId: 1, message: 'hello' } },
  ]));
});

test('disconnects and server errors preserve failure status until reconnecting', async () => {
  const hook = chat();
  hook.render();
  const socket = hook.sockets[0];
  socket.receive('connect');
  socket.receive('disconnect');
  let state = hook.render();
  assert.equal(state.connectionStatus, 'disconnected');
  assert.equal(await state.sendMessage('do not buffer'), false);
  socket.receive('connect');
  socket.receive('error', '해당 모임의 멤버가 아닙니다.');
  socket.receive('disconnect');
  state = hook.render();
  assert.equal(state.connectionStatus, 'error');
  assert.equal(state.connectionError, '해당 모임의 멤버가 아닙니다.');
  state.reconnect();
  assert.equal(socket.connected, false, 'retry restarts a socket even when the transport stayed connected after a room error');
  assert.equal(socket.connects, 1);
  assert.equal(hook.render().connectionStatus, 'connecting');
  socket.receive('connect');
  state = hook.render();
  assert.equal(state.connectionError, null);
  assert.equal(socket.emitted.filter(event => event.event === 'joinRoom').length, 3, 'every reconnect rejoins the room');
});

test('rejected room access and an acknowledgement timeout cannot enable sending', async () => {
  for (const [response, error] of [[{ ok: false, error: 'Not a member' }, null], [undefined, new Error('timeout')]]) {
    const hook = chat();
    hook.render();
    const socket = hook.sockets[0];
    socket.receive('connect');
    socket.acknowledge('joinRoom', response, error);
    const state = hook.render();
    assert.equal(state.connectionStatus, 'error');
    assert.equal(await state.sendMessage('keep draft'), false);
    assert.equal(socket.emitted.filter(item => item.event === 'message').length, 0);
  }
});

test('failed saves, timeouts and disconnects preserve the draft without automatic retries', async () => {
  for (const mode of ['rejected', 'timeout', 'disconnect']) {
    const hook = chat();
    hook.render();
    const socket = hook.sockets[0];
    socket.receive('connect');
    socket.acknowledge('joinRoom');
    const sent = hook.render().sendMessage('keep draft');
    if (mode === 'disconnect') socket.receive('disconnect');
    else socket.acknowledge('message', { ok: false, error: 'Unable to save' }, mode === 'timeout' ? new Error('timeout') : null);
    assert.equal(await sent, false);
    assert.equal(socket.emitted.filter(item => item.event === 'message').length, 1);
  }
});

test('a late acknowledgement from a disconnected socket cannot enable a new connection', () => {
  const hook = chat();
  hook.render();
  const socket = hook.sockets[0];
  socket.receive('connect');
  socket.receive('disconnect');
  socket.connect();
  socket.receive('connect');
  socket.acknowledge('joinRoom');
  assert.equal(hook.render().connectionStatus, 'connecting');
  socket.acknowledge('joinRoom');
  assert.equal(hook.render().connectionStatus, 'connected');
});

test('messages are deduplicated and isolated from previous or different parties', () => {
  const hook = chat();
  hook.render();
  const first = hook.sockets[0];
  const message = { userId: 1, partyId: 1, nickname: 'Tester', message: 'hello', createdAt: '2026-11-03T12:00:00Z' };
  first.receive('message', message);
  first.receive('message', message);
  first.receive('message', { ...message, partyId: 2 });
  assert.equal(hook.render().messages.length, 1);
  assert.equal(hook.render(2).messages.length, 0);
  assert.equal(first.disconnects, 1);
  first.receive('message', { ...message, message: 'late old message' });
  const second = hook.sockets[1];
  second.receive('message', { ...message, partyId: 2, message: 'new room' });
  const state = hook.render(2);
  assert.equal(state.messages.length, 1);
  assert.equal(state.messages[0].message, 'new room');
  hook.unmount();
  second.receive('message', { ...message, partyId: 2, message: 'after cleanup' });
  assert.equal(second.disconnects, 1);
  assert.equal(hook.render(2).messages.length, 1);
});

test('settlement changes refresh only joined parties and every acknowledged reconnect catches missed changes', () => {
  const hook = chat();
  hook.render();
  const socket = hook.sockets[0];
  const payload = { partyId: 1, settlementId: 10 };
  socket.receive('settlementUpdated', payload);
  assert.equal(hook.render().settlementVersion, 0);
  socket.receive('connect');
  socket.acknowledge('joinRoom');
  assert.equal(hook.render().settlementVersion, 1);
  for (const value of [null, {}, { ...payload, partyId: 2 }, { ...payload, settlementId: 0 }, { ...payload, settlementId: '10' }]) socket.receive('settlementUpdated', value);
  assert.equal(hook.render().settlementVersion, 1);
  socket.receive('settlementUpdated', payload);
  assert.equal(hook.render().settlementVersion, 2);
  socket.receive('disconnect');
  socket.receive('settlementUpdated', payload);
  assert.equal(hook.render().settlementVersion, 2);
  socket.receive('connect');
  socket.acknowledge('joinRoom');
  assert.equal(hook.render().settlementVersion, 3);
  hook.render(0);
  assert.equal(socket.disconnects, 1);
  assert.equal(hook.sockets.length, 1, 'a logged out screen creates no socket');
  socket.receive('settlementUpdated', payload);
  assert.equal(hook.render(0).settlementVersion, 3);
});

test('party updates refresh only the joined room and reconnect catches missed status or membership changes', () => {
  const hook = chat();
  hook.render();
  const socket = hook.sockets[0];
  const payload = { partyId: 1 };
  socket.receive('partyUpdated', payload);
  assert.equal(hook.render().partyVersion, 0);
  socket.receive('connect');
  socket.acknowledge('joinRoom');
  assert.equal(hook.render().partyVersion, 1);
  for (const value of [null, {}, { partyId: 2 }, { partyId: '1' }]) socket.receive('partyUpdated', value);
  assert.equal(hook.render().partyVersion, 1);
  socket.receive('partyUpdated', payload);
  assert.equal(hook.render().partyVersion, 2);
  socket.receive('disconnect');
  socket.receive('partyUpdated', payload);
  assert.equal(hook.render().partyVersion, 2);
  socket.receive('connect');
  socket.acknowledge('joinRoom');
  assert.equal(hook.render().partyVersion, 3);
  hook.render(2);
  socket.receive('partyUpdated', payload);
  const other = hook.sockets[1];
  other.receive('connect');
  other.acknowledge('joinRoom');
  assert.equal(hook.render(2).partyVersion, 4);
  other.receive('partyUpdated', { partyId: 1 });
  assert.equal(hook.render(2).partyVersion, 4);
});
