/**
 * OB Calculator Application Controller
 * 精確對齊原型規範：
 * 1. 選擇模式：[LMP 算預產期] / [預產期查孕週] / [超音波推算]
 * 2. 第二欄位：輸入 LMP / EDC 或 超音波檢查日 + CRL / GS
 * 3. 第三欄位：查詢日期 (預設今天)
 * 4. 最下面：換算的週數 (指定日期孕週) 與預產期、滿20週日
 */

document.addEventListener('DOMContentLoaded', () => {
  // 模式切換按鈕
  const modeBtns = document.querySelectorAll('.mode-nav-btn');
  const cardTitle = document.getElementById('cardTitle');
  const btnClear = document.getElementById('btnClear');
  const btnSetToday = document.getElementById('btnSetToday');

  // LMP / EDD 欄位組
  const mainDateFieldGroup = document.getElementById('mainDateFieldGroup');
  const mainDateLabel = document.getElementById('mainDateLabel');
  const mainDateInput = document.getElementById('mainDateInput');

  // 超音波欄位組
  const usFieldGroup = document.getElementById('usFieldGroup');
  const usScanDateInput = document.getElementById('usScanDateInput');
  const crlInput = document.getElementById('crlInput');
  const gsInput = document.getElementById('gsInput');

  // 查詢日期欄位
  const queryDateInput = document.getElementById('queryDateInput');

  // 結果卡片元件
  const resultCardLabel = document.getElementById('resultCardLabel');
  const resultBadge = document.getElementById('resultBadge');
  const resultGaDisplay = document.getElementById('resultGaDisplay');
  const resultSubLabel = document.getElementById('resultSubLabel');
  const resultEddDisplay = document.getElementById('resultEddDisplay');
  const resultWeek20Display = document.getElementById('resultWeek20Display');
  const usScanRow = document.getElementById('usScanRow');
  const resultScanGaDisplay = document.getElementById('resultScanGaDisplay');

  let currentMode = 'lmp'; // 'lmp' | 'edd' | 'us'
  let currentResult = null;

  // 初始化日期
  const today = new Date();
  queryDateInput.value = formatDate(today);
  if (usScanDateInput) usScanDateInput.value = formatDate(today);

  // 預設 LMP 為 8 週前 (讓醫師一開畫面即可看見示範)
  const defaultInitialLmp = addDays(today, -56);
  mainDateInput.value = formatDate(defaultInitialLmp);

  const MODES = ['lmp', 'edd', 'us'];

  // 1. 統一模式切換核心函數
  function switchMode(mode) {
    if (!MODES.includes(mode) || mode === currentMode) return;
    currentMode = mode;

    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'lmp') {
      cardTitle.textContent = '輸入末次月經日期';
      mainDateFieldGroup.style.display = '';
      usFieldGroup.style.display = 'none';
      if (usScanRow) usScanRow.style.display = 'none';
      mainDateLabel.innerHTML = '末次月經第一天 <span class="field-sub">LMP</span>';
      resultCardLabel.textContent = '指定日期孕週 (GA)';
      resultSubLabel.textContent = '預產期 EDD (40W)';
      if (currentResult && currentResult.lmp) {
        mainDateInput.value = formatDate(currentResult.lmp);
      }
    } else if (mode === 'edd') {
      cardTitle.textContent = '查詢指定日期孕週';
      mainDateFieldGroup.style.display = '';
      usFieldGroup.style.display = 'none';
      if (usScanRow) usScanRow.style.display = 'none';
      mainDateLabel.innerHTML = '預產期 <span class="field-sub">EDD / EDC</span>';
      resultCardLabel.textContent = '指定日期孕週 (GA)';
      resultSubLabel.textContent = '預產期 EDD (40W)';
      if (currentResult && currentResult.edd) {
        mainDateInput.value = formatDate(currentResult.edd);
      }
    } else if (mode === 'us') {
      cardTitle.textContent = '超音波數值推算';
      mainDateFieldGroup.style.display = 'none';
      usFieldGroup.style.display = 'flex';
      if (usScanRow) usScanRow.style.display = 'flex';
      resultCardLabel.textContent = '查詢日期孕週 (GA)';
      resultSubLabel.textContent = '推算預產期 (40W)';
      
      // 若尚未填寫數值，提供常用示範值 CRL 15mm
      if (!crlInput.value && !gsInput.value) {
        crlInput.value = '15.0';
      }
    }

    updateCalculation();
  }

  // 模式按鈕點擊切換
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  // 左右滑動手勢監聽 (Swipe Gestures)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const duration = Date.now() - touchStartTime;

      // 判定為有效滑動：快速 (<500ms)、位移 > 45px、且水平移動明顯大於垂直移動
      if (duration < 500 && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        const currentIndex = MODES.indexOf(currentMode);
        if (deltaX < 0) {
          // 向左滑動 (Swipe Left) -> 切換至右邊下一個模式 (例如 LMP -> EDC -> 超音波)
          if (currentIndex < MODES.length - 1) {
            switchMode(MODES[currentIndex + 1]);
          }
        } else {
          // 向右滑動 (Swipe Right) -> 切換至左邊上一個模式 (例如 超音波 -> EDC -> LMP)
          if (currentIndex > 0) {
            switchMode(MODES[currentIndex - 1]);
          }
        }
      }
    }
  }, { passive: true });

  const btnResetAll = document.getElementById('btnResetAll');

  // 2. 一鍵清空所有欄位與結果
  function resetAllFields() {
    mainDateInput.value = '';
    if (crlInput) crlInput.value = '';
    if (gsInput) gsInput.value = '';
    const today = new Date();
    queryDateInput.value = formatDate(today);
    if (usScanDateInput) usScanDateInput.value = formatDate(today);

    currentResult = null;
    resultGaDisplay.textContent = '-- 週 + - 天';
    resultBadge.textContent = '--';
    resultEddDisplay.textContent = '-- 年 -- 月 -- 日';
    if (resultWeek20Display) resultWeek20Display.textContent = '-- 年 -- 月 -- 日';
    if (resultScanGaDisplay) resultScanGaDisplay.textContent = '-- 週 + - 天';
  }

  if (btnClear) btnClear.addEventListener('click', resetAllFields);
  if (btnResetAll) btnResetAll.addEventListener('click', resetAllFields);

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

  // 超音波輸入監聽
  if (usScanDateInput) {
    usScanDateInput.addEventListener('change', updateCalculation);
    usScanDateInput.addEventListener('input', updateCalculation);
  }
  if (crlInput) {
    crlInput.addEventListener('input', () => {
      updateCalculation();
    });
  }
  if (gsInput) {
    gsInput.addEventListener('input', () => {
      updateCalculation();
    });
  }

  // 5. 核心計算函數
  function updateCalculation() {
    const queryDate = parseLocalDate(queryDateInput.value) || new Date();

    if (currentMode === 'us') {
      const scanDate = parseLocalDate(usScanDateInput.value) || new Date();
      const crlVal = crlInput.value ? parseFloat(crlInput.value) : null;
      const gsVal = gsInput.value ? parseFloat(gsInput.value) : null;

      if ((crlVal === null || isNaN(crlVal) || crlVal <= 0) &&
          (gsVal === null || isNaN(gsVal) || gsVal <= 0)) {
        resultGaDisplay.textContent = '-- 週 + - 天';
        resultBadge.textContent = '請輸入數值';
        resultEddDisplay.textContent = '-- 年 -- 月 -- 日';
        if (resultWeek20Display) resultWeek20Display.textContent = '-- 年 -- 月 -- 日';
        if (resultScanGaDisplay) resultScanGaDisplay.textContent = '-- 週 + - 天';
        currentResult = null;
        return;
      }

      let res = null;
      // 優先依 CRL 計算 (國際黃金標準)，否則依 GS 計算
      if (crlVal && crlVal > 0) {
        res = calculateFromCrl(crlVal, scanDate, queryDate);
        resultBadge.textContent = `CRL ${crlVal}mm`;
      } else if (gsVal && gsVal > 0) {
        res = calculateFromGs(gsVal, scanDate, queryDate);
        resultBadge.textContent = `GS ${gsVal}mm`;
      }

      if (!res) return;
      currentResult = res;

      resultGaDisplay.textContent = res.gaText;
      if (resultScanGaDisplay) resultScanGaDisplay.textContent = res.scanGaText;
      resultEddDisplay.textContent = formatDateChinese(res.edd);

      const week20Date = addDays(res.lmp, 140);
      if (resultWeek20Display) resultWeek20Display.textContent = formatDateChinese(week20Date);
      return;
    }

    // LMP / EDD 模式
    const inputDate = parseLocalDate(mainDateInput.value);
    if (!inputDate) {
      resultGaDisplay.textContent = '-- 週 + - 天';
      resultBadge.textContent = '--';
      resultEddDisplay.textContent = '-- 年 -- 月 -- 日';
      if (resultWeek20Display) resultWeek20Display.textContent = '-- 年 -- 月 -- 日';
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
    resultEddDisplay.textContent = formatDateChinese(res.edd);

    // 計算滿 20 週 (20W0D = LMP + 140 天) 之精準日期
    const week20Date = addDays(res.lmp, 140);
    if (resultWeek20Display) {
      resultWeek20Display.textContent = formatDateChinese(week20Date);
    }
  }

  // 首次執行
  updateCalculation();
});

