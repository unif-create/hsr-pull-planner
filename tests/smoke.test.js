const test = require('node:test');
const assert = require('node:assert/strict');
const loadCalc = require('./helpers/load-calc');

test('index.html から Calc を読み込める', () => {
  const Calc = loadCalc();
  assert.equal(typeof Calc, 'object');
});
