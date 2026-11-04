/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node regression tests */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(readFileSync('app/lib/member-details.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(source, context);
const { normalizeMemberPhone, isMemberBirthdate } = context.exports;

test('Korean and Japanese national phone numbers accept separators and keep the leading zero', () => {
  for (const phone of ['01012341234', '010-1234-1234', ' 010 1234 1234 ']) {
    assert.equal(normalizeMemberPhone(phone), '01012341234');
  }
  assert.equal(normalizeMemberPhone('090-1234-5678'), '09012345678');
  assert.equal(normalizeMemberPhone('03 1234 5678'), '0312345678');
  for (const phone of ['', '010abc1234', '010,1234,1234', '+821012341234', '1234567890', '01234567', '012345678901']) {
    assert.equal(normalizeMemberPhone(phone), null);
  }
});

test('birthdates use four-digit years, real calendar days and the supported past-to-today range', () => {
  for (const day of ['1000-01-01', '1998-01-01', '2000-02-29', '2026-11-04']) {
    assert.equal(isMemberBirthdate(day, '2026-11-04'), true);
  }
  for (const day of ['', '980101', '0999-12-31', '1900-02-29', '2023-02-29', '2000-13-01', '2000-04-31', '2026-11-05', '2000-2-29']) {
    assert.equal(isMemberBirthdate(day, '2026-11-04'), false, day);
  }
});
