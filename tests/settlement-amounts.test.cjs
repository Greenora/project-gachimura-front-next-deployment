/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node regression tests */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync('app/lib/settlement-amounts.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(source, context);
const { getSettlementAmounts, formatSettlementMoney } = context.exports;
const item = (price, userIds, quantity = 1) => ({ price, quantity, members: userIds.map(userId => ({ userId })) });
const plainAmounts = items => ({ ...getSettlementAmounts(items) });

test('integer shares preserve the item total and use stable user ID order', () => {
  const input = [item(10000, [3, 1, 2])];
  const before = JSON.stringify(input);
  assert.deepEqual(plainAmounts(input), { 1: 3334, 2: 3333, 3: 3333 });
  assert.equal(Object.values(getSettlementAmounts(input)).reduce((sum, amount) => sum + amount, 0), 10000);
  assert.deepEqual(plainAmounts([item(10000, [2, 3, 1])]), plainAmounts(input));
  assert.equal(JSON.stringify(input), before, 'calculation must not reorder API data');
});

test('different item selections and quantities produce separate personal totals', () => {
  assert.deepEqual(plainAmounts([
    item(10000, [1, 2, 3]),
    item(1500, [1, 3], 2),
    item(2000, [1]),
  ]), { 1: 6834, 2: 3333, 3: 4833 });
});

test('small amounts can leave zero shares and unselected items do not invent a payer', () => {
  assert.deepEqual(plainAmounts([item(1, [3, 1, 2])]), { 1: 1, 2: 0, 3: 0 });
  assert.deepEqual(plainAmounts([item(1000, []), { price: 1000, quantity: 1 }]), {});
  assert.deepEqual(plainAmounts([]), {});
});

test('Korean and Japanese displays keep the same won amount without currency conversion', () => {
  for (const language of ['korean', 'japanese']) {
    const value = formatSettlementMoney(15000, language);
    assert.equal(value.replace(/[^0-9]/g, ''), '15000');
    assert.match(value, /₩|KRW/);
    assert.equal(formatSettlementMoney(0, language).replace(/[^0-9]/g, ''), '0');
  }
});
