/**
 * OB Calculator Application Controller
 * 精確對齊原型規範：
 * 1. 選擇模式：[LMP 算預產期] / [預產期查孕週]
 * 2. 第二欄位：輸入 LMP / EDC
 * 3. 第三欄位：查詢日期 (預設今天)
 * 4. 最下面：換算的週數 (指定日期孕週) 與預產期
 */

document.addEventListener('DOMContentLoaded', () => {
  // 模式切換按鈕
  const modeBtns = document.querySelectorAll('.mode-nav-btn');
  const cardTitle = document.getElementById('cardTitle');
  const mainDateLabel = document.getElementById('mainDateLabel');
  const mainDateHint = document.getElementById('mainDateHint');
  const mainDateInput = document.getElementById('mainDateInput');
  const queryDateInput = document.getElementById('queryDateInput');
  const btnClear = document.getElementById('btnClear');
  const btnSetToday = document.getElementById('btnSetToday');
  const btnCopyNote = document.getElementById('btnCopyNote');

  // 結果卡片元件
  const resultCardLabel = document.getElementById('resultCardLabel');
  const resultBadge = document.getElementById('resultBadge');
  const resultGaDisplay = document.getElementById('resultGaDisplay');
  const resultEddDisplay = document.getElementById('resultEddDisplay');
  const resultWeek20Display = document.getElementById('resultWeek20Display');
  const resultFooterHint = document.getElementById('resultFooterHint');
  const toast = document.getElementById('toast');

  let currentMode = 'lmp'; // 'lmp' | 'edd'
  let currentResult = null;


  // 初始化日期
  const today = new Date();
  queryDateInput.value = formatDate(today);

  // 預設 LMP 為 8 週前 (讓醫師一開畫面即可看見計算示範，亦可隨時清除)
  const defaultInitialLmp = addDays(today, -56);
  mainDateInput.value = formatDate(defaultInitialLmp);

  // 1. 模式切換邏輯
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      currentMode = mode;

      if (mode === 'lmp') {
        cardTitle.textContent = '輸入末次月經日期';
        mainDateLabel.innerHTML = '末次月經第一天 <span class="field-sub">LMP</span>';
        if (mainDateHint) mainDateHint.textContent = '以月經第一天為孕期起算日。';
        resultCardLabel.textContent = '指定日期孕週 (GA)';
        if (resultSubLabel) resultSubLabel.textContent = '預產期 EDD (40W)';
        if (currentResult && currentResult.lmp) {
          mainDateInput.value = formatDate(currentResult.lmp);
        }
      } else {
        cardTitle.textContent = '查詢指定日期孕週';
        mainDateLabel.innerHTML = '預產期 <span class="field-sub">EDD / EDC</span>';
        if (mainDateHint) mainDateHint.textContent = '輸入已排定之預產期。';
        resultCardLabel.textContent = '指定日期孕週 (GA)';
        if (resultSubLabel) resultSubLabel.textContent = '末次月經推算 LMP';
        if (currentResult && currentResult.edd) {
          mainDateInput.value = formatDate(currentResult.edd);
        }
      }

      updateCalculation();
    });
  });

  // 2. 清除按鈕
  btnClear.addEventListener('click', () => {
    mainDateInput.value = '';
    currentResult = null;
    resultGaDisplay.textContent = '-- 週 + - 天';
    resultBadge.textContent = '--';
    resultEddDisplay.textContent = '-- 年 -- 月 -- 日';
    if (resultWeek20Display) resultWeek20Display.textContent = '-- 年 -- 月 -- 日';
    if (resultFooterHint) {
      resultFooterHint.textContent = currentMode === 'lmp' ? '選擇 LMP 日期後顯示結果' : '選擇預產期後顯示結果';
    }
  });

  // 3. 查詢日期設為「今天」
  btnSetToday.addEventListener('click', () => {
    queryDateInput.value = formatDate(new Date());
    updateCalculation();
  });

  // 4. 輸入變更監聽
  mainDateInput.addEventListener('change', updateCalculation);
  mainDateInput.addEventListener('input', updateCalculation);
  queryDateInput.addEventListener('change', updateCalculation);
  queryDateInput.addEventListener('input', updateCalculation);

  // 5. 核心計算函數
  function updateCalculation() {
    const inputDate = parseLocalDate(mainDateInput.value);
    const queryDate = parseLocalDate(queryDateInput.value) || new Date();

    if (!inputDate) {
      resultGaDisplay.textContent = '-- 週 + - 天';
      resultBadge.textContent = '--';
      resultEddDisplay.textContent = '-- 年 -- 月 -- 日';
      if (resultWeek20Display) resultWeek20Display.textContent = '-- 年 -- 月 -- 日';
      if (resultFooterHint) {
        resultFooterHint.textContent = currentMode === 'lmp' ? '選擇 LMP 日期後顯示結果' : '輸入預產期與查詢日期後顯示結果';
      }
      currentResult = null;
      return;
    }

    let res = null;
    if (currentMode === 'lmp') {
      res = calculateFromLmp(inputDate, queryDate, 28);
    } else {
      res = calculateFromEdd(inputDate, queryDate, 28);
    }

    if (!res) return;
    currentResult = res;

    // 渲染最下方結果卡片
    resultGaDisplay.textContent = res.gaText;
    resultBadge.textContent = res.trimester;
    
    if (currentMode === 'lmp') {
      resultEddDisplay.textContent = formatDateChinese(res.edd);
    } else {
      resultEddDisplay.textContent = formatDateChinese(res.edd);
    }

    // 計算滿 20 週 (20W0D = LMP + 140 天) 之精準日期
    const week20Date = addDays(res.lmp, 140);
    if (resultWeek20Display) {
      resultWeek20Display.textContent = formatDateChinese(week20Date);
    }

    if (resultFooterHint) {
      if (res.daysUntilEdd >= 0) {
        resultFooterHint.textContent = `距預產期尚餘 ${res.daysUntilEdd} 天`;
      } else {
        resultFooterHint.textContent = `已過預產期 ${Math.abs(res.daysUntilEdd)} 天`;
      }
    }
  }



  // 首次執行
  updateCalculation();
});

