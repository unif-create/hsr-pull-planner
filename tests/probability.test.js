const test = require('node:test');
const assert = require('node:assert/strict');
const loadCalc = require('./helpers/load-calc');
const Calc = loadCalc();

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} と ${b} が一致しない`);

test('rateAt: 1〜73 連目は 0.6%、74 連目から 6% ずつ上がり 90 連目で 100%', () => {
  near(Calc.rateAt(1), 0.006);
  near(Calc.rateAt(73), 0.006);
  near(Calc.rateAt(74), 0.066);
  near(Calc.rateAt(75), 0.126);
  near(Calc.rateAt(89), 0.966);
  assert.equal(Calc.rateAt(90), 1);
});

test('fiveStarPmf: 天井 0 なら 90 個の確率の合計が 1', () => {
  const pmf = Calc.fiveStarPmf(0);
  assert.equal(pmf.length, 91); // pmf[0] は 0、pmf[1..90]
  assert.equal(pmf[0], 0);
  near(pmf.reduce((a, b) => a + b, 0), 1);
});

test('fiveStarPmf: 天井 89 なら次の 1 連で必ず出る', () => {
  const pmf = Calc.fiveStarPmf(89);
  assert.equal(pmf.length, 2);
  assert.equal(pmf[1], 1);
});

test('probFiveStarWithin: 天井 0 で 90 連なら 100%、0 連なら 0%', () => {
  near(Calc.probFiveStarWithin(0, 90), 1);
  assert.equal(Calc.probFiveStarWithin(0, 0), 0);
});

test('probFiveStarWithin: 天井 0 で 10 連は 1-(0.994^10)', () => {
  near(Calc.probFiveStarWithin(0, 10), 1 - Math.pow(0.994, 10));
});

test('probLimitedWithin: 天井 89・保証あり・1 連 → 100%', () => {
  near(Calc.probLimitedWithin({ pity: 89, guaranteed: true }, 1), 1);
});

test('probLimitedWithin: 天井 89・保証なし・1 連 → ちょうど 50%', () => {
  near(Calc.probLimitedWithin({ pity: 89, guaranteed: false }, 1), 0.5);
});

test('probLimitedWithin: 天井 0・保証なし・180 連 → 100%', () => {
  near(Calc.probLimitedWithin({ pity: 0, guaranteed: false }, 180), 1);
});

test('probLimitedWithin: 天井 0・保証あり・90 連 → 100%', () => {
  near(Calc.probLimitedWithin({ pity: 0, guaranteed: true }, 90), 1);
});

test('probLimitedWithin: 天井 0・保証なし・90 連 は 50% より高く 100% 未満', () => {
  const p = Calc.probLimitedWithin({ pity: 0, guaranteed: false }, 90);
  assert.ok(p > 0.5 && p < 1, `p=${p}`);
});

test('probLimitedWithin: 0 連以下なら 0', () => {
  assert.equal(Calc.probLimitedWithin({ pity: 0, guaranteed: false }, 0), 0);
  assert.equal(Calc.probLimitedWithin({ pity: 0, guaranteed: false }, -5), 0);
});

test('pullsForGuarantee: 保証あり 90-天井、保証なし 180-天井', () => {
  assert.equal(Calc.pullsForGuarantee({ pity: 0, guaranteed: true }), 90);
  assert.equal(Calc.pullsForGuarantee({ pity: 20, guaranteed: true }), 70);
  assert.equal(Calc.pullsForGuarantee({ pity: 0, guaranteed: false }), 180);
  assert.equal(Calc.pullsForGuarantee({ pity: 89, guaranteed: false }), 91);
});
