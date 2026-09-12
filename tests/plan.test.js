const test = require('node:test');
const assert = require('node:assert/strict');
const loadCalc = require('./helpers/load-calc');
const Calc = loadCalc();

// 収入をデイリー 60 だけにした基本形
const income = { daily: 60, passOn: false, pass: 90, bpTier: 'off', bpJade: 680, bpTickets: 4, bpDeluxeJade: 200, sim: 0, moc: 0, pf: 0, as: 0, version: 0, versionTickets: 0 };
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

test('plan: ナナシビトの褒章（星玉・チケット）は日割りせずそのまま見込みに乗る', () => {
  // レート分: 40日 × 60/日 = 2400星玉 = 15連。褒章分: 680/160=4連 + チケット4枚 = 8連。合計23連
  const r = Calc.plan({ ...base, targetDate: '2026-10-22', income: { ...income, bpTier: 'hocho' } });
  assert.equal(r.incomePulls, 15 + 8);
});

test('plan: ナナシビトの勲章は褒章分＋追加200星玉が乗る', () => {
  // レート分15連 + (680+200)/160=5連（切り捨て） + チケット4枚 = 24連
  const r = Calc.plan({ ...base, targetDate: '2026-10-22', income: { ...income, bpTier: 'kunsho' } });
  assert.equal(r.incomePulls, 15 + 5 + 4);
});

test('plan: バージョン単位の項目は目標日までの日数が変わっても値が変わらない', () => {
  const incomeWithFlat = { ...income, bpTier: 'kunsho', moc: 900, pf: 900, as: 900, version: 1600, versionTickets: 8 };
  const soon = Calc.plan({ ...base, targetDate: '2026-09-14', income: incomeWithFlat });
  const later = Calc.plan({ ...base, targetDate: '2026-10-22', income: incomeWithFlat });
  // 差はレート分（デイリー60/日）だけで、バージョン単位の項目は日数によらず一定
  assert.equal(later.incomePulls - soon.incomePulls, Math.floor(60 * 40 / 160) - Math.floor(60 * 2 / 160));
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
