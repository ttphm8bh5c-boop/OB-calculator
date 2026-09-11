/**
 * Clinical Date Numpad Controller (產科門診日期快速小鍵盤)
 * 支援單手純數字快速輸入 YYYY / MM / DD，支援「今天」、「退格」與快捷年切換
 */

class DateNumpad {
  constructor(options = {}) {
    this.currentDate = options.initialDate || new Date();
    this.onDateChange = options.onDateChange || null;

    // 內部輸入暫存緩衝 (MMDD 或 YYYYMMDD)
    this.buffer = '';
    this.activeField = 'month'; // 'year' | 'month' | 'day'

    this.year = this.currentDate.getFullYear();
    this.month = this.currentDate.getMonth() + 1;
    this.day = this.currentDate.getDate();

    this.initDOM(options.containerId, options.keypadId);
    this.updateDisplay();
  }

  initDOM(containerId, keypadId) {
    this.container = document.getElementById(containerId);
    this.keypadContainer = document.getElementById(keypadId);

    if (!this.container || !this.keypadContainer) return;

    // 渲染日期顯示槽 (年、月、日 分格點選)
    this.container.innerHTML = `
      <div class="date-numpad-display">
        <div class="date-slot" data-slot="year">
          <span class="slot-val" id="slotYear">${this.year}</span>
          <span class="slot-label">年</span>
        </div>
        <span class="slot-sep">/</span>
        <div class="date-slot active" data-slot="month">
          <span class="slot-val" id="slotMonth">${String(this.month).padStart(2, '0')}</span>
          <span class="slot-label">月</span>
        </div>
        <span class="slot-sep">/</span>
        <div class="date-slot" data-slot="day">
          <span class="slot-val" id="slotDay">${String(this.day).padStart(2, '0')}</span>
          <span class="slot-label">日</span>
        </div>
      </div>
    `;

    // 渲染 iOS 原生質感小鍵盤 (3x4 網格)
    this.keypadContainer.innerHTML = `
      <div class="ios-numpad-grid">
        <button class="numpad-btn" data-key="1">1</button>
        <button class="numpad-btn" data-key="2">2</button>
        <button class="numpad-btn" data-key="3">3</button>
        <button class="numpad-btn" data-key="4">4</button>
        <button class="numpad-btn" data-key="5">5</button>
        <button class="numpad-btn" data-key="6">6</button>
        <button class="numpad-btn" data-key="7">7</button>
        <button class="numpad-btn" data-key="8">8</button>
        <button class="numpad-btn" data-key="9">9</button>
        <button class="numpad-btn action-btn today-btn" data-key="today">今天</button>
        <button class="numpad-btn" data-key="0">0</button>
        <button class="numpad-btn action-btn backspace-btn" data-key="backspace">⌫</button>
      </div>
    `;

    // 綁定槽位點擊事件
    this.container.querySelectorAll('.date-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        this.container.querySelectorAll('.date-slot').forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
        this.activeField = slot.dataset.slot;
        this.buffer = '';
      });
    });

    // 綁定鍵盤按鍵點擊
    this.keypadContainer.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.dataset.key;
        this.handleKeyPress(key);
      });
    });
  }

  handleKeyPress(key) {
    if (key === 'today') {
      this.setDate(new Date());
      return;
    }

    if (key === 'backspace') {
      if (this.buffer.length > 0) {
        this.buffer = this.buffer.slice(0, -1);
      } else {
        // 回退到上一個槽
        if (this.activeField === 'day') {
          this.setActiveSlot('month');
        } else if (this.activeField === 'month') {
          this.setActiveSlot('year');
        }
      }
      this.updateSlotFromBuffer();
      return;
    }

    // 數字輸入 (0-9)
    if (this.buffer.length >= 4) this.buffer = ''; // 超出重置
    this.buffer += key;
    this.processNumericInput();
  }

  processNumericInput() {
    const val = parseInt(this.buffer, 10);

    if (this.activeField === 'year') {
      if (this.buffer.length === 4) {
        this.year = val;
        this.buffer = '';
        this.setActiveSlot('month');
      }
    } else if (this.activeField === 'month') {
      if (this.buffer.length === 1 && val > 1) {
        // 輸入 2~9 自動當作 02~09 月並跳到日
        this.month = val;
        this.buffer = '';
        this.setActiveSlot('day');
      } else if (this.buffer.length === 2) {
        this.month = Math.max(1, Math.min(12, val));
        this.buffer = '';
        this.setActiveSlot('day');
      }
    } else if (this.activeField === 'day') {
      if (this.buffer.length === 1 && val > 3) {
        // 輸入 4~9 自動當作 04~09 日
        const maxDays = new Date(this.year, this.month, 0).getDate();
        this.day = Math.min(maxDays, val);
        this.buffer = '';
      } else if (this.buffer.length === 2) {
        const maxDays = new Date(this.year, this.month, 0).getDate();
        this.day = Math.max(1, Math.min(maxDays, val));
        this.buffer = '';
      }
    }

    this.validateAndEmit();
  }

  setActiveSlot(slotName) {
    this.activeField = slotName;
    if (this.container) {
      this.container.querySelectorAll('.date-slot').forEach(s => {
        if (s.dataset.slot === slotName) s.classList.add('active');
        else s.classList.remove('active');
      });
    }
  }

  updateSlotFromBuffer() {
    if (this.buffer.length > 0) {
      const el = document.getElementById(`slot${this.activeField.charAt(0).toUpperCase() + this.activeField.slice(1)}`);
      if (el) el.textContent = this.buffer;
    } else {
      this.updateDisplay();
    }
  }

  validateAndEmit() {
    // 檢查月份與日期上限
    const maxDays = new Date(this.year, this.month, 0).getDate();
    if (this.day > maxDays) this.day = maxDays;

    this.currentDate = new Date(this.year, this.month - 1, this.day);
    this.updateDisplay();

    if (this.onDateChange) {
      this.onDateChange(this.currentDate);
    }
  }

  updateDisplay() {
    const elY = document.getElementById('slotYear');
    const elM = document.getElementById('slotMonth');
    const elD = document.getElementById('slotDay');
    if (elY) elY.textContent = this.year;
    if (elM) elM.textContent = String(this.month).padStart(2, '0');
    if (elD) elD.textContent = String(this.day).padStart(2, '0');
  }

  setDate(date, triggerChange = true) {
    if (!date || isNaN(date.getTime())) return;
    this.currentDate = new Date(date);
    this.year = this.currentDate.getFullYear();
    this.month = this.currentDate.getMonth() + 1;
    this.day = this.currentDate.getDate();
    this.buffer = '';
    this.updateDisplay();
    if (triggerChange && this.onDateChange) {
      this.onDateChange(this.currentDate);
    }
  }

  getDate() {
    return this.currentDate;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DateNumpad };
}
