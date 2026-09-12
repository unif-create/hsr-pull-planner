const test = require('node:test');
const assert = require('node:assert/strict');
const loadCalc = require('./helpers/load-calc');
const Calc = loadCalc();

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} と ${b} が一致しない`);

test('toPulls: 星玉÷160 の切り捨て + チケット', () => {
  assert.equal(Calc.toPulls(0, 0), 0);
  assert.equal(Calc.toPulls(160, 0), 1);
  assert.equal(Calc.toPulls(319, 0), 1);
  assert.equal(Calc.toPulls(3200, 5), 25);
});

test('toPulls: 空欄や負の値は 0 として扱う', () => {
  assert.equal(Calc.toPulls('', ''), 0);
  assert.equal(Calc.toPulls(NaN, undefined), 0);
  assert.equal(Calc.toPulls(-500, -3), 0);
});

test('daysUntil: 目標日 − 今日。過去なら 0', () => {
  assert.equal(Calc.daysUntil('2026-09-12', '2026-09-12'), 0);
  assert.equal(Calc.daysUntil('2026-09-12', '2026-09-13'), 1);
  assert.equal(Calc.daysUntil('2026-09-12', '2026-10-22'), 40);
  assert.equal(Calc.daysUntil('2026-09-12', '2026-09-01'), 0);
});

test('daysUntil: 目標日が空なら 0', () => {
  assert.equal(Calc.daysUntil('2026-09-12', ''), 0);
});

test('addDays: 月またぎ・年またぎ', () => {
  assert.equal(Calc.addDays('2026-09-12', 0), '2026-09-12');
  assert.equal(Calc.addDays('2026-09-12', 19), '2026-10-01');
  assert.equal(Calc.addDays('2026-12-25', 10), '2027-01-04');
});

const baseIncome = { daily: 60, passOn: false, pass: 90, bpOn: false, bpJade: 680, bpTickets: 4, sim: 0, moc: 0, pf: 0, as: 0, version: 0, versionTickets: 0 };

test('dailyIncome: デイリーだけなら 60/日、チケット 0', () => {
  const r = Calc.dailyIncome(baseIncome);
  near(r.jadePerDay, 60);
  near(r.ticketsPerDay, 0);
});

test('dailyIncome: 月パス ON で +90/日', () => {
  near(Calc.dailyIncome({ ...baseIncome, passOn: true }).jadePerDay, 150);
});

test('dailyIncome: バトルパス ON で 680/42 星玉と 4/42 チケットが 1 日あたりに乗る', () => {
  const r = Calc.dailyIncome({ ...baseIncome, bpOn: true });
  near(r.jadePerDay, 60 + 680 / 42);
  near(r.ticketsPerDay, 4 / 42);
});

test('dailyIncome: 週は ÷7、バージョンは ÷42（忘却の庭系 3 つは合算して ÷42）', () => {
  const r = Calc.dailyIncome({ ...baseIncome, sim: 225, moc: 900, pf: 900, as: 900, version: 1600 });
  near(r.jadePerDay, 60 + 225 / 7 + (900 + 900 + 900) / 42 + 1600 / 42);
});

test('dailyIncome: バージョン更新の臨時チケットも ÷42 でチケットに乗る', () => {
  const r = Calc.dailyIncome({ ...baseIncome, versionTickets: 8 });
  near(r.ticketsPerDay, 8 / 42);
});

test('dailyIncome: 空欄や負の値は 0 として扱う', () => {
  const r = Calc.dailyIncome({ ...baseIncome, daily: '', sim: -10 });
  near(r.jadePerDay, 0);
});
