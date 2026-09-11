eval(ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError('/Users/eddylo/antigravity/OB calculator/web/js/ob-engine.js', $.NSUTF8StringEncoding, null)));

function run() {
  var target = new Date(2026, 3, 10); // 2026-04-10

  // 1. LMP 模式: LMP 2026-01-01 -> EDD: 2026-10-08, GA: 14w1d
  var lmp1 = new Date(2026, 0, 1);
  var res1 = calculateFromLmp(lmp1, target, 28);
  if (formatDate(res1.edd) !== '2026-10-08' || res1.gaWeeks !== 14 || res1.gaDays !== 1) {
    throw new Error('Test 1 LMP failed');
  }

  // 2. EDD 逆推模式: EDD 2026-10-08 -> LMP 2026-01-01, GA: 14w1d
  var edd2 = new Date(2026, 9, 8);
  var res2 = calculateFromEdd(edd2, target, 28);
  if (formatDate(res2.lmp) !== '2026-01-01' || res2.gaWeeks !== 14 || res2.gaDays !== 1) {
    throw new Error('Test 2 EDD failed');
  }

  // 3. 週數轉輪反推: GA 14週1天, 目標日 2026-04-10 -> 推得 LMP: 2026-01-01, EDD: 2026-10-08
  var res3 = calculateFromGa(14, 1, target, 28);
  if (formatDate(res3.lmp) !== '2026-01-01' || formatDate(res3.edd) !== '2026-10-08') {
    throw new Error('Test 3 GA Wheel failed: got LMP ' + formatDate(res3.lmp) + ', EDD ' + formatDate(res3.edd));
  }

  return 'ALL LMP, EDD & GA WHEEL TESTS PASSED!';
}
run();
