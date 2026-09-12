const test = require('node:test');
const assert = require('node:assert/strict');
const loadCalc = require('./helpers/load-calc');
const Calc = loadCalc();

// 収入をデイリー 60 だけにした基本形
const income = { daily: 60, passOn: false, pass: 90, bpOn: false, bpJade: 680, bpTickets: 4, sim: 0, moc: 0, pf: 0, as: 0, version: 0, versionTickets: 0 };
const base = { today: '2026-09-12', targetDate: '2026-09-12', jade: 0, tickets: 0, pity: 0, guaranteed: false, plannedNow: 0, income };

test('plan: 手持ち 180 連・天井 0・保証なし → 足りる、不足 0', () => {
  const r = Calc.plan({ ...base, jade: 180 * 160 });
  assert.equal(r.handPulls, 180);
  assert.equal(r.incomePulls, 0);
  assert.equal(r.usablePulls, 180);
  assert.equal(r.guaranteeNeeded, 180);
  assert.equal(r.verdict, 'enough');
  assert.equal(r.shortfallPulls, 0);
});

test('plan: 手持ち 0・収入 0 → 足りない、不足 180 連', () => {
  const r = Calc.plan({ ...base, income: { ...income, daily: 0 } });
  assert.equal(r.verdict, 'short');
  assert.equal(r.shortfallPulls, 180);
  assert.equal(r.shortfallJade, 180 * 160);
});

test('plan: 天井 89・保証なし・手持ち 1 連 → 足りない（不足 90 連）', () => {
  const r = Calc.plan({ ...base, jade: 160, pity: 89 });
  assert.equal(r.usablePulls, 1);
  assert.equal(r.verdict, 'short');
  assert.equal(r.shortfallPulls, 90);
});

test('plan: 残り 40 日 × 60/日 = 2400 星玉 = 15 連が見込みに乗る', () => {
  const r = Calc.plan({ ...base, targetDate: '2026-10-22' });
  assert.equal(r.daysLeft, 40);
  assert.equal(r.incomePulls, 15);
});

test('plan: バトルパスのチケットは見込みの連数に含まれる', () => {
  // 42 日 × (60 + 680/42) 星玉 = 3200 星玉 = 20 連、チケット 4 枚 → 24 連
  const r = Calc.plan({ ...base, targetDate: '2026-10-24', income: { ...income, bpOn: true } });
  assert.equal(r.daysLeft, 42);
  assert.equal(r.incomePulls, 24);
});

test('plan: いまのガチャで使う予定が 1 以上なら天井 0・保証なしに置き換える', () => {
  const r = Calc.plan({ ...base, jade: 200 * 160, pity: 80, guaranteed: true, plannedNow: 10 });
  assert.equal(r.pityReset, true);
  assert.equal(r.state.pity, 0);
  assert.equal(r.state.guaranteed, false);
  assert.equal(r.usablePulls, 190);
  assert.equal(r.guaranteeNeeded, 180);
  assert.equal(r.verdict, 'enough');
});

test('plan: 使う予定が 0 なら入力の天井状況をそのまま使う', () => {
  const r = Calc.plan({ ...base, jade: 10 * 160, pity: 80, guaranteed: true, plannedNow: 0 });
  assert.equal(r.pityReset, false);
  assert.equal(r.state.pity, 80);
  assert.equal(r.state.guaranteed, true);
  assert.equal(r.guaranteeNeeded, 10);
  assert.equal(r.verdict, 'enough');
});

test('plan: 天井カウントは 0〜89 に丸める', () => {
  assert.equal(Calc.plan({ ...base, pity: 95 }).state.pity, 89);
  assert.equal(Calc.plan({ ...base, pity: -3 }).state.pity, 0);
  assert.equal(Calc.plan({ ...base, pity: '' }).state.pity, 0);
});

test('plan: 使う予定が手持ちを超えたら警告を出す', () => {
  const r = Calc.plan({ ...base, jade: 160, plannedNow: 5 });
  assert.ok(r.warnings.includes('planned_exceeds_hand'));
  assert.equal(r.usablePulls, -4);
  assert.equal(r.verdict, 'short');
});

test('plan: 目標日が過去でも落ちない（残り日数 0）', () => {
  const r = Calc.plan({ ...base, targetDate: '2020-01-01' });
  assert.equal(r.daysLeft, 0);
  assert.equal(r.incomePulls, 0);
});
