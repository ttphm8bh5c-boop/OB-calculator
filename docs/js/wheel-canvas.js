/**
 * Interactive Pregnancy Wheel (擬真產科雙層紙轉盤)
 * 支援 Retina 高解析度、流暢單指手勢旋轉、物理阻尼與雙向數據同步
 */

class PregnancyWheel {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = Object.assign({
      onRotate: null, // 回調函數: 當使用者旋轉轉盤時傳出當前 LMP
      size: 360
    }, options);

    // 狀態變數
    this.currentAngle = 0; // 內盤相對於外盤的旋轉角度 (弧度)
    this.targetAngle = 0;
    this.isDragging = false;
    this.startTouchAngle = 0;
    this.startDiscAngle = 0;
    this.lastTouchAngle = 0;
    this.velocity = 0;
    this.animId = null;

    // 當前基準年 (預設為今年)
    this.baseYear = new Date().getFullYear();
    
    // 初始化月份天數（以平年 365 天計算刻度）
    this.monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    this.monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    this.monthShortEn = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    this.totalDays = 365;

    // 每一天對應的角度 (360度 / 365天，順時針排列)
    this.radPerDay = (2 * Math.PI) / this.totalDays;

    this.initCanvasSize();
    this.bindEvents();
    this.render();
  }

  initCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2;
    const displaySize = Math.min(rect.width || 360, window.innerWidth - 32, 420);
    this.size = displaySize;

    this.canvas.width = displaySize * dpr;
    this.canvas.height = displaySize * dpr;
    this.canvas.style.width = `${displaySize}px`;
    this.canvas.style.height = `${displaySize}px`;

    this.ctx.scale(dpr, dpr);
    this.centerX = displaySize / 2;
    this.centerY = displaySize / 2;
    this.radius = displaySize / 2 - 4;
  }

  bindEvents() {
    // 監聽視窗縮放
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    // Touch 事件 (手機專用優化)
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleStart(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMove(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (this.isDragging) {
        this.handleEnd();
      }
    });

    // Mouse 事件 (電腦/模擬器測試用)
    this.canvas.addEventListener('mousedown', (e) => {
      this.handleStart(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.handleMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.handleEnd();
      }
    });
  }

  getPointerAngle(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - this.centerX;
    const y = clientY - rect.top - this.centerY;
    return Math.atan2(y, x);
  }

  handleStart(x, y) {
    this.isDragging = true;
    this.velocity = 0;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.startTouchAngle = this.getPointerAngle(x, y);
    this.startDiscAngle = this.currentAngle;
    this.lastTouchAngle = this.startTouchAngle;
    this.lastTouchTime = performance.now();
  }

  handleMove(x, y) {
    const currentTouchAngle = this.getPointerAngle(x, y);
    let delta = currentTouchAngle - this.lastTouchAngle;
    
    // 處理 -PI 到 +PI 的環繞突變
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    this.currentAngle = this.normalizeAngle(this.currentAngle + delta);

    const now = performance.now();
    const dt = now - this.lastTouchTime;
    if (dt > 0) {
      this.velocity = delta / dt;
    }
    this.lastTouchAngle = currentTouchAngle;
    this.lastTouchTime = now;

    this.render();
    this.notifyLmpChange();
  }

  handleEnd() {
    this.isDragging = false;
    // 慣性旋轉動畫
    const stepInertia = () => {
      if (Math.abs(this.velocity) > 0.0002) {
        this.currentAngle = this.normalizeAngle(this.currentAngle + this.velocity * 16);
        this.velocity *= 0.92; // 摩擦阻尼
        this.render();
        this.notifyLmpChange();
        this.animId = requestAnimationFrame(stepInertia);
      } else {
        this.velocity = 0;
      }
    };
    this.animId = requestAnimationFrame(stepInertia);
  }

  normalizeAngle(angle) {
    let a = angle % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    return a;
  }

  /**
   * 計算 1 月 1 日到給定日期的年內天數 (0 ~ 364)
   */
  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * 由年內天數轉換為日期
   */
  getDateFromDayOfYear(dayOfYear, year = this.baseYear) {
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + Math.round(dayOfYear));
    return date;
  }

  /**
   * 將轉盤旋轉至指定的 LMP 日期
   */
  setLmpDate(date, animate = true) {
    if (!date) return;
    this.baseYear = date.getFullYear();
    const dayOfYear = this.getDayOfYear(date);
    // 0 度設在最頂端 (-PI/2)
    // 外盤 1月1日 位於頂端 -PI/2
    // LMP 指針旋轉到該天
    const targetAngle = dayOfYear * this.radPerDay;

    if (!animate) {
      this.currentAngle = this.normalizeAngle(targetAngle);
      this.render();
      return;
    }

    if (this.animId) cancelAnimationFrame(this.animId);
    const startAngle = this.currentAngle;
    let diff = this.normalizeAngle(targetAngle) - startAngle;
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;

    const startTime = performance.now();
    const duration = 400; // 400ms 動畫

    const animateWheel = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - p, 3);
      this.currentAngle = this.normalizeAngle(startAngle + diff * ease);
      this.render();
      if (p < 1) {
        this.animId = requestAnimationFrame(animateWheel);
      }
    };
    this.animId = requestAnimationFrame(animateWheel);
  }

  /**
   * 取得當前內盤 LMP 指針所指向的日期
   */
  getCurrentLmpDate() {
    const dayFloat = (this.currentAngle / this.radPerDay) % 365;
    return this.getDateFromDayOfYear(dayFloat, this.baseYear);
  }

  notifyLmpChange() {
    if (typeof this.options.onRotate === 'function') {
      const date = this.getCurrentLmpDate();
      this.options.onRotate(date);
    }
  }

  // ================= 繪圖渲染 =================
  render() {
    const ctx = this.ctx;
    const cx = this.centerX;
    const cy = this.centerY;
    const r = this.radius;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(cx, cy);

    // 1. 繪製最底層外盤陰影與盤身 (365天日曆外盤)
    this.drawOuterDisc(ctx, r);

    // 2. 繪製可旋轉的內盤 (妊娠 40 週刻度與產檢標籤)
    ctx.save();
    // 內盤旋轉角：以頂部 (-PI/2) 為基準
    ctx.rotate(-Math.PI / 2 + this.currentAngle);
    this.drawInnerDisc(ctx, r * 0.72);
    ctx.restore();

    // 3. 繪製中心指針軸與金屬固定鉚釘
    this.drawCenterPin(ctx, r * 0.16);

    ctx.restore();
  }

  /**
   * 繪製外盤 (固定或相對視角的外圈日曆)
   */
  drawOuterDisc(ctx, r) {
    // 圓盤底色 (微米白色，質感擬紙)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.85, '#F8FAFC');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fill();

    // 外邊框
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#CBD5E1';
    ctx.stroke();

    // 繪製 12 個月份區間
    let cumulativeDays = 0;
    for (let m = 0; m < 12; m++) {
      const days = this.monthDays[m];
      const startAngle = -Math.PI / 2 + cumulativeDays * this.radPerDay;
      const endAngle = startAngle + days * this.radPerDay;
      const midAngle = startAngle + (days * this.radPerDay) / 2;

      // 月份底色分界
      ctx.beginPath();
      ctx.arc(0, 0, r - 2, startAngle, endAngle);
      ctx.strokeStyle = m % 2 === 0 ? '#0284C7' : '#0EA5E9';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 月份名稱文字
      ctx.save();
      ctx.rotate(midAngle);
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.monthNames[m], 0, -r + 14);
      ctx.restore();

      // 繪製該月的日曆刻度 (每 5 天一長刻度，每 1 天一短刻度)
      for (let d = 1; d <= days; d++) {
        const dayAngle = -Math.PI / 2 + (cumulativeDays + d - 1) * this.radPerDay;
        ctx.save();
        ctx.rotate(dayAngle);

        const isFive = d % 5 === 0;
        const tickLength = isFive ? 8 : 4;
        ctx.strokeStyle = isFive ? '#475569' : '#94A3B8';
        ctx.lineWidth = isFive ? 1.2 : 0.8;

        ctx.beginPath();
        ctx.moveTo(0, -r + 22);
        ctx.lineTo(0, -r + 22 + tickLength);
        ctx.stroke();

        // 標記數字 (如 10, 20)
        if (d === 10 || d === 20) {
          ctx.fillStyle = '#64748B';
          ctx.font = '8px -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(d.toString(), 0, -r + 34);
        }

        ctx.restore();
      }

      cumulativeDays += days;
    }
  }

  /**
   * 繪製內盤 (妊娠週數與產檢指標，隨手勢旋轉)
   */
  drawInnerDisc(ctx, innerR) {
    // 內盤陰影
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    // 內盤盤面底色 (乾淨白微漸層)
    ctx.beginPath();
    ctx.arc(0, 0, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.shadowColor = 'transparent'; // 清除陰影

    // 內盤邊線
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0284C7';
    ctx.stroke();

    // 繪製三孕期彩色弧環
    // T1: 0~13週 (0 ~ 91天)
    this.drawTrimesterArc(ctx, innerR - 8, 0, 13 * 7, '#E0F2FE', '#0284C7', '第 1 孕期 (早期)');
    // T2: 14~27週 (91 ~ 189天)
    this.drawTrimesterArc(ctx, innerR - 8, 13 * 7, 27 * 7, '#FEF3C7', '#D97706', '第 2 孕期 (中期)');
    // T3: 28~40週 (189 ~ 280天)
    this.drawTrimesterArc(ctx, innerR - 8, 27 * 7, 40 * 7, '#DCFCE7', '#16A34A', '第 3 孕期 (後期)');

    // 繪製 0 ~ 42 週的刻度
    for (let w = 0; w <= 42; w++) {
      const angle = w * 7 * this.radPerDay;
      ctx.save();
      ctx.rotate(angle);

      // 週刻度線
      ctx.strokeStyle = w === 0 ? '#E11D48' : (w === 40 ? '#2563EB' : '#334155');
      ctx.lineWidth = (w === 0 || w === 40) ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -innerR);
      ctx.lineTo(0, -innerR + 14);
      ctx.stroke();

      // 週數數字
      if (w % 2 === 0 || w === 37) {
        ctx.fillStyle = w === 0 ? '#E11D48' : (w === 40 ? '#2563EB' : '#1E293B');
        ctx.font = (w === 0 || w === 40) 
          ? 'bold 10px -apple-system, sans-serif' 
          : '9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${w}W`, 0, -innerR + 16);
      }

      ctx.restore();
    }

    // ★ 繪製 LMP 關鍵指示箭頭 (0 週)
    this.drawPointerArrow(ctx, 0, innerR, '#E11D48', '末次月經 (LMP)');

    // ★ 繪製 40 週預產期 EDD 關鍵指示箭頭
    const eddAngle = 280 * this.radPerDay;
    this.drawPointerArrow(ctx, eddAngle, innerR, '#2563EB', '預產期 (EDD 40W)');

    // 繪製臨床產檢區間標記
    this.drawMilestoneBadge(ctx, 12 * 7 * this.radPerDay, innerR - 38, 'NT 頸部透明帶', '#7C3AED');
    this.drawMilestoneBadge(ctx, 22 * 7 * this.radPerDay, innerR - 38, '高層次超音波', '#0891B2');
    this.drawMilestoneBadge(ctx, 26 * 7 * this.radPerDay, innerR - 38, 'OGTT 糖耐', '#D97706');
    this.drawMilestoneBadge(ctx, 36 * 7 * this.radPerDay, innerR - 38, 'GBS 鏈球菌', '#16A34A');
    this.drawMilestoneBadge(ctx, 37 * 7 * this.radPerDay, innerR - 52, '37W 足月', '#059669');
  }

  drawTrimesterArc(ctx, r, startDays, endDays, bgColor, strokeColor, label) {
    const startAngle = startDays * this.radPerDay;
    const endAngle = endDays * this.radPerDay;

    ctx.beginPath();
    ctx.arc(0, 0, r, startAngle, endAngle);
    ctx.lineWidth = 5;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }

  drawPointerArrow(ctx, angle, r, color, text) {
    ctx.save();
    ctx.rotate(angle);

    // 繪製突出內盤的紅色/藍色三角箭頭
    ctx.beginPath();
    ctx.moveTo(0, -r - 8);
    ctx.lineTo(-6, -r + 2);
    ctx.lineTo(6, -r + 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // 標籤文字
    ctx.font = 'bold 9px -apple-system, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, -r + 28);

    ctx.restore();
  }

  drawMilestoneBadge(ctx, angle, distance, label, color) {
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(0, -distance);

    // 小圓點
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // 標籤
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 8);

    ctx.restore();
  }

  /**
   * 繪製中心金屬固定鉚釘與金屬質感反光
   */
  drawCenterPin(ctx, pinR) {
    // 陰影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    // 金屬漸層本體
    const grad = ctx.createLinearGradient(-pinR, -pinR, pinR, pinR);
    grad.addColorStop(0, '#F1F5F9');
    grad.addColorStop(0.5, '#94A3B8');
    grad.addColorStop(1, '#475569');

    ctx.beginPath();
    ctx.arc(0, 0, pinR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // 中心小凹點
    ctx.beginPath();
    ctx.arc(0, 0, pinR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PregnancyWheel };
}
