const engine = require('../web/js/ob-engine.js');

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  } else {
    console.log('PASS: ' + message);
  }
}

// 測試 1: Naegele 規則標準計算 (28天週期)
// LMP: 2026-01-01 -> EDD: 2026-10-08 (280天)
const lmp1 = new Date(2026, 0, 1);
const target1 = new Date(2026, 3, 10); // 2026-04-10
const res1 = engine.calculateFromLmp(lmp1, target1, 28);
assert(engine.formatDate(res1.edd) === '2026-10-08', `EDD should be 2026-10-08, got ${engine.formatDate(res1.edd)}`);
// 1/1 到 4/10: Jan 30 + Feb 28 + Mar 31 + Apr 10 = 99 days = 14 weeks + 1 day
assert(res1.gaWeeks === 14 && res1.gaDays === 1, `GA should be 14w1d, got ${res1.gaWeeks}w${res1.gaDays}d`);

// 測試 2: 週期校正 (30天週期，週期多2天，預產期多2天)
const res2 = engine.calculateFromLmp(lmp1, target1, 30);
assert(engine.formatDate(res2.edd) === '2026-10-10', `EDD with 30-day cycle should be 2026-10-10, got ${engine.formatDate(res2.edd)}`);

// 測試 3: EDD 逆推 (EDD: 2026-10-08 -> LMP 應為 2026-01-01)
const edd3 = new Date(2026, 9, 8);
const res3 = engine.calculateFromEdd(edd3, target1, 28);
assert(engine.formatDate(res3.lmp) === '2026-01-01', `LMP reverse should be 2026-01-01, got ${engine.formatDate(res3.lmp)}`);

// 測試 4: 超音波校正
// 2026-02-15 照超音波為 8週3天 (59天前) -> LMP 應為 2025-12-18
const scanDate = new Date(2026, 1, 15);
const res4 = engine.calculateFromUltrasound(scanDate, 8, 3, target1);
assert(engine.formatDate(res4.lmp) === '2025-12-18', `Ultrasound corrected LMP should be 2025-12-18, got ${engine.formatDate(res4.lmp)}`);

// 測試 5: 人工生殖 (IVF D5囊胚植入 2026-03-01)
// LMP = 植入日 - 19天 = 2026-02-10
const d5Date = new Date(2026, 2, 1);
const res5 = engine.calculateFromIvf('d5', d5Date, target1);
assert(engine.formatDate(res5.lmp) === '2026-02-10', `IVF D5 LMP should be 2026-02-10, got ${engine.formatDate(res5.lmp)}`);

// 測試 6: 里程碑數量
const milestones = engine.getMilestones(lmp1);
assert(milestones.length >= 8, `Milestones count should be >= 8, got ${milestones.length}`);

console.log('All obstetrics calculation unit tests passed successfully!');
