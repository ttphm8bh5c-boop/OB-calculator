/**
 * OB Clinical Calculation Engine (產科醫師專用計算引擎)
 * 專注於：末次月經 (LMP) 與 預產期逆推 (EDD)，以及週數轉輪 (GA) 雙向換算
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(date) {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateChinese(date) {
  if (!date || isNaN(date.getTime())) return '';
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dayName = days[date.getDay()];
  return `${y}年${m}月${d}日 (週${dayName})`;
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(targetDate, baseDate) {
  const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const b = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return Math.round((t.getTime() - b.getTime()) / ONE_DAY_MS);
}

function daysToWeeksAndDays(totalDays) {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
}

/**
 * 依末次月經 (LMP) 計算預產期與當前週數
 */
function calculateFromLmp(lmp, targetDate = new Date(), cycleLength = 28) {
  if (!lmp) return null;
  const cycleOffset = (cycleLength || 28) - 28;
  const edd = addDays(lmp, 280 + cycleOffset);
  const gaDays = diffDays(targetDate, lmp) - cycleOffset;
  const ga = daysToWeeksAndDays(Math.max(0, gaDays));
  const daysUntilEdd = diffDays(edd, targetDate);

  let trimester = '準備期';
  let trimesterDetail = '';
  if (gaDays >= 0) {
    if (ga.weeks < 14) {
      trimester = '第一孕期 (早期)';
      trimesterDetail = '1 ~ 13 週';
    } else if (ga.weeks < 28) {
      trimester = '第二孕期 (中期)';
      trimesterDetail = '14 ~ 27 週';
    } else if (ga.weeks < 42) {
      trimester = '第三孕期 (後期)';
      trimesterDetail = '28 ~ 40+ 週';
    } else {
      trimester = '過期妊娠';
      trimesterDetail = '≧ 42 週';
    }
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((gaDays / 280) * 100)));

  return {
    lmp,
    edd,
    targetDate,
    cycleLength,
    gaWeeks: ga.weeks,
    gaDays: ga.days,
    totalGaDays: gaDays,
    gaText: `${ga.weeks} 週 + ${ga.days} 天`,
    gaShortText: `${ga.weeks}+${ga.days} gw`,
    daysUntilEdd,
    trimester,
    trimesterDetail,
    progressPercent
  };
}

/**
 * 依預產期 (EDD) 逆推末次月經與當前週數
 */
function calculateFromEdd(edd, targetDate = new Date(), cycleLength = 28) {
  if (!edd) return null;
  const cycleOffset = (cycleLength || 28) - 28;
  const lmp = addDays(edd, -(280 + cycleOffset));
  return calculateFromLmp(lmp, targetDate, cycleLength);
}

/**
 * 依目標日與週數轉輪 (GA Weeks + Days) 反推 LMP 與 EDD
 */
function calculateFromGa(weeks, days, targetDate = new Date(), cycleLength = 28) {
  const totalDays = (parseInt(weeks, 10) || 0) * 7 + (parseInt(days, 10) || 0);
  const cycleOffset = (cycleLength || 28) - 28;
  const lmp = addDays(targetDate, -(totalDays + cycleOffset));
  return calculateFromLmp(lmp, targetDate, cycleLength);
}

/**
 * 依超音波 CRL (頭臀長, mm) 推算週數與預產期 (Robinson & Fleming 1975 國際黃金標準)
 * GA (days) = 8.052 * sqrt(CRL * 1.037) + 23.73
 */
function calculateFromCrl(crlMm, scanDate = new Date(), targetDate = new Date()) {
  const crl = parseFloat(crlMm);
  if (isNaN(crl) || crl <= 0) return null;

  const gaDaysExact = 8.052 * Math.sqrt(crl * 1.037) + 23.73;
  const gaDaysRounded = Math.round(gaDaysExact);
  const scanGa = daysToWeeksAndDays(gaDaysRounded);

  const lmp = addDays(scanDate, -gaDaysRounded);
  const baseResult = calculateFromLmp(lmp, targetDate, 28);

  return {
    ...baseResult,
    method: 'crl',
    crlMm: crl,
    scanDate,
    scanGaWeeks: scanGa.weeks,
    scanGaDays: scanGa.days,
    scanGaText: `${scanGa.weeks} 週 + ${scanGa.days} 天`,
    scanGaExactDays: gaDaysExact
  };
}

/**
 * 依超音波 GS (妊娠囊平均直徑, mm) 推算週數與預產期 (Tokyo / Nyberg / Hellman 國際標準)
 * GA (days) = GS (mm) + 30
 */
function calculateFromGs(gsMm, scanDate = new Date(), targetDate = new Date()) {
  const gs = parseFloat(gsMm);
  if (isNaN(gs) || gs <= 0) return null;

  const gaDaysExact = gs + 30;
  const gaDaysRounded = Math.round(gaDaysExact);
  const scanGa = daysToWeeksAndDays(gaDaysRounded);

  const lmp = addDays(scanDate, -gaDaysRounded);
  const baseResult = calculateFromLmp(lmp, targetDate, 28);

  return {
    ...baseResult,
    method: 'gs',
    gsMm: gs,
    scanDate,
    scanGaWeeks: scanGa.weeks,
    scanGaDays: scanGa.days,
    scanGaText: `${scanGa.weeks} 週 + ${scanGa.days} 天`,
    scanGaExactDays: gaDaysExact
  };
}

/**
 * 建議產檢里程碑清單
 */
function getMilestones(lmp) {
  if (!lmp) return [];

  const milestones = [
    {
      id: 'heartbeat',
      title: '超音波胎心音確認',
      weeksText: '6 ~ 8 週',
      startDay: 6 * 7,
      endDay: 8 * 7,
      description: '確認胚胎著床及心跳',
      tag: '胚胎心跳'
    },
    {
      id: 'nt_nipt',
      title: '第一孕期頸部透明帶 (NT) / NIPT',
      weeksText: '11+0 ~ 13+6 週',
      startDay: 11 * 7,
      endDay: 13 * 7 + 6,
      description: '第一孕期染色體與結構評估',
      tag: '染色體篩檢'
    },
    {
      id: 'amnio',
      title: '羊膜穿刺 / 羊水晶片',
      weeksText: '16 ~ 18 週',
      startDay: 16 * 7,
      endDay: 18 * 7,
      description: '染色體晶片分析 (aCGH)',
      tag: '產前診斷'
    },
    {
      id: 'level2',
      title: '高層次超音波 (Level II)',
      weeksText: '20 ~ 24 週',
      startDay: 20 * 7,
      endDay: 24 * 7,
      description: '全器官解剖構造檢查',
      tag: '器官結構'
    },
    {
      id: 'ogtt',
      title: '妊娠糖尿病篩檢 (OGTT)',
      weeksText: '24 ~ 28 週',
      startDay: 24 * 7,
      endDay: 28 * 7,
      description: '耐糖試驗與血紅素檢驗',
      tag: '代謝篩檢'
    },
    {
      id: 'tdap',
      title: '百日咳三合一疫苗 (Tdap)',
      weeksText: '28 ~ 36 週',
      startDay: 28 * 7,
      endDay: 36 * 7,
      description: '建立新生兒保護抗體',
      tag: '疫苗注射'
    },
    {
      id: 'gbs',
      title: '乙型鏈球菌篩檢 (GBS)',
      weeksText: '35 ~ 37 週',
      startDay: 35 * 7,
      endDay: 37 * 7,
      description: '產道採檢預防感染',
      tag: '產前篩檢'
    },
    {
      id: 'term',
      title: '早期足月 (Early Term)',
      weeksText: '37+0 週',
      startDay: 37 * 7,
      endDay: 37 * 7,
      description: '器官發育成熟，準備待產',
      tag: '成熟足月'
    },
    {
      id: 'edd',
      title: '預產期 (EDD, 40+0w)',
      weeksText: '40+0 週',
      startDay: 280,
      endDay: 280,
      description: '滿 40 週整',
      tag: '預產期'
    }
  ];

  return milestones.map(m => {
    const startDate = addDays(lmp, m.startDay);
    const endDate = addDays(lmp, m.endDay);
    let dateRangeText = '';
    if (m.startDay === m.endDay) {
      dateRangeText = formatDateChinese(startDate);
    } else {
      dateRangeText = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
    }
    return {
      ...m,
      startDate,
      endDate,
      dateRangeText
    };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatDate,
    formatDateChinese,
    parseLocalDate,
    addDays,
    diffDays,
    daysToWeeksAndDays,
    calculateFromLmp,
    calculateFromEdd,
    calculateFromGa,
    calculateFromCrl,
    calculateFromGs,
    getMilestones
  };
}
