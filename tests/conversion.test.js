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

const baseIncome = { daily: 60, passOn: false, pass: 90, bpTier: 'off', bpJade: 680, bpTickets: 4, bpDeluxeJade: 200, sim: 0, moc: 0, pf: 0, as: 0, version: 0, versionTickets: 0 };

test('dailyIncome: デイリーだけなら 60/日', () => {
  near(Calc.dailyIncome(baseIncome).jadePerDay, 60);
});

test('dailyIncome: 月パス ON で +90/日', () => {
  near(Calc.dailyIncome({ ...baseIncome, passOn: true }).jadePerDay, 150);
});

test('dailyIncome: 週は ÷7', () => {
  near(Calc.dailyIncome({ ...baseIncome, sim: 225 }).jadePerDay, 60 + 225 / 7);
});

test('dailyIncome: バトルパス・忘却の庭系・バージョン臨時収入は日割りに含めない（flatIncome の担当）', () => {
  const r = Calc.dailyIncome({ ...baseIncome, bpTier: 'kunsho', moc: 900, pf: 900, as: 900, version: 1600, versionTickets: 8 });
  near(r.jadePerDay, 60);
});

test('dailyIncome: 空欄や負の値は 0 として扱う', () => {
  const r = Calc.dailyIncome({ ...baseIncome, daily: '', sim: -10 });
  near(r.jadePerDay, 0);
});

test('flatIncome: 買っていないなら星玉もチケットも 0', () => {
  const r = Calc.flatIncome(baseIncome);
  assert.equal(r.jade, 0);
  assert.equal(r.tickets, 0);
});

test('flatIncome: ナナシビトの褒章で星玉 680・チケット 4（追加分は乗らない）', () => {
  const r = Calc.flatIncome({ ...baseIncome, bpTier: 'hocho' });
  assert.equal(r.jade, 680);
  assert.equal(r.tickets, 4);
});

test('flatIncome: ナナシビトの勲章で星玉 680+200・チケットは褒章と同じ 4', () => {
  const r = Calc.flatIncome({ ...baseIncome, bpTier: 'kunsho' });
  assert.equal(r.jade, 880);
  assert.equal(r.tickets, 4);
});

test('flatIncome: 忘却の庭系 3 つとバージョン臨時収入（星玉・チケット）はそのまま合算する', () => {
  const r = Calc.flatIncome({ ...baseIncome, moc: 900, pf: 900, as: 900, version: 1600, versionTickets: 8 });
  assert.equal(r.jade, 900 + 900 + 900 + 1600);
  assert.equal(r.tickets, 8);
});

test('flatIncome: 空欄や負の値は 0 として扱う', () => {
  const r = Calc.flatIncome({ ...baseIncome, moc: '', pf: -5 });
  assert.equal(r.jade, 0);
  assert.equal(r.tickets, 0);
});
