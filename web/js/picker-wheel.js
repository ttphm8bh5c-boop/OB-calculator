/**
 * iOS Native 3D Picker Wheel (週數 + 天數 轉輪滾輪組件)
 * 模擬 iOS 原生 UIPickerView 的 3D 圓柱滾動、慣性與磁吸對齊
 */

class IOSPickerColumn {
  constructor(container, options = {}) {
    this.container = container;
    this.items = options.items || [];
    this.itemHeight = options.itemHeight || 36;
    this.visibleCount = options.visibleCount || 5;
    this.onChange = options.onChange || null;

    this.selectedIndex = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.startY = 0;
    this.startTranslateY = 0;
    this.velocity = 0;
    this.lastY = 0;
    this.lastTime = 0;
    this.animId = null;

    this.initDOM();
    this.bindEvents();
    this.updateTransform(0);
  }

  initDOM() {
    this.container.innerHTML = '';
    this.container.classList.add('ios-picker-col');

    this.wheelWrapper = document.createElement('div');
    this.wheelWrapper.className = 'ios-picker-wheel';

    this.items.forEach((text, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'ios-picker-item';
      itemEl.textContent = text;
      itemEl.dataset.index = index;
      this.wheelWrapper.appendChild(itemEl);
    });

    this.container.appendChild(this.wheelWrapper);
  }

  bindEvents() {
    // Touch 手勢
    this.container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        this.handleStart(e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        e.preventDefault();
        this.handleMove(e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (this.isDragging) this.handleEnd();
    });

    // Mouse 手勢
    this.container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleStart(e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        this.handleMove(e.clientY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) this.handleEnd();
    });

    // 滾輪支援
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.animId) cancelAnimationFrame(this.animId);
      const delta = e.deltaY * 0.5;
      const target = this.clampTranslate(this.translateY - delta);
      this.updateTransform(target);
      this.snapToNearest();
    }, { passive: false });

    // 點擊項目快速滾動對齊
    this.container.addEventListener('click', (e) => {
      const item = e.target.closest('.ios-picker-item');
      if (item) {
        const idx = parseInt(item.dataset.index, 10);
        this.setSelectedIndex(idx, true, true);
      }
    });
  }

  handleStart(clientY) {
    this.isDragging = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.startY = clientY;
    this.startTranslateY = this.translateY;
    this.lastY = clientY;
    this.lastTime = performance.now();
    this.velocity = 0;
  }

  handleMove(clientY) {
    const delta = clientY - this.startY;
    let targetY = this.startTranslateY + delta;

    // 邊界阻尼拉伸效果
    const minTranslate = -(this.items.length - 1) * this.itemHeight;
    const maxTranslate = 0;
    if (targetY > maxTranslate) {
      targetY = maxTranslate + (targetY - maxTranslate) * 0.3;
    } else if (targetY < minTranslate) {
      targetY = minTranslate + (targetY - minTranslate) * 0.3;
    }

    const now = performance.now();
    const dt = now - this.lastTime;
    if (dt > 0) {
      this.velocity = (clientY - this.lastY) / dt;
    }
    this.lastY = clientY;
    this.lastTime = now;

    this.updateTransform(targetY);
  }

  handleEnd() {
    this.isDragging = false;
    // 慣性滑動
    let currentV = this.velocity;
    const inertiaStep = () => {
      if (Math.abs(currentV) > 0.05) {
        let nextY = this.translateY + currentV * 16;
        currentV *= 0.92;
        this.updateTransform(nextY);
        this.animId = requestAnimationFrame(inertiaStep);
      } else {
        this.snapToNearest();
      }
    };

    if (Math.abs(currentV) > 0.1) {
      this.animId = requestAnimationFrame(inertiaStep);
    } else {
      this.snapToNearest();
    }
  }

  clampTranslate(y) {
    const minTranslate = -(this.items.length - 1) * this.itemHeight;
    const maxTranslate = 0;
    return Math.max(minTranslate, Math.min(maxTranslate, y));
  }

  snapToNearest() {
    const clampedY = this.clampTranslate(this.translateY);
    const nearestIndex = Math.round(-clampedY / this.itemHeight);
    this.setSelectedIndex(nearestIndex, true, true);
  }

  setSelectedIndex(index, animated = true, triggerChange = false) {
    const idx = Math.max(0, Math.min(this.items.length - 1, index));
    const targetY = -idx * this.itemHeight;

    if (!animated) {
      this.selectedIndex = idx;
      this.updateTransform(targetY);
      if (triggerChange && this.onChange) this.onChange(idx);
      return;
    }

    if (this.animId) cancelAnimationFrame(this.animId);
    const startY = this.translateY;
    const diff = targetY - startY;
    const startTime = performance.now();
    const duration = Math.min(350, Math.max(150, Math.abs(diff) * 1.5));

    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      this.updateTransform(startY + diff * ease);

      if (p < 1) {
        this.animId = requestAnimationFrame(step);
      } else {
        this.selectedIndex = idx;
        if (triggerChange && this.onChange) this.onChange(idx);
      }
    };
    this.animId = requestAnimationFrame(step);
  }

  updateTransform(y) {
    this.translateY = y;
    const currentIndex = -y / this.itemHeight;

    // 應用 3D 圓柱效果 (標準 iOS UIPickerView 弧度)
    const itemElements = this.wheelWrapper.children;
    const anglePerItem = 22; // 每個項目夾角 22 度
    const radius = 95; // 圓柱半徑

    for (let i = 0; i < itemElements.length; i++) {
      const el = itemElements[i];
      const offset = i - currentIndex;
      const angle = offset * anglePerItem;

      if (Math.abs(offset) > 3.2) {
        el.style.display = 'none';
      } else {
        el.style.display = 'block';
        const opacity = Math.max(0.15, 1 - Math.abs(offset) * 0.35);
        el.style.opacity = opacity;
        el.style.transform = `rotateX(${-angle}deg) translateZ(${radius}px)`;
        if (Math.abs(offset) < 0.45) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      }
    }
  }
}


/**
 * 整合週數 + 天數 雙滾輪轉盤
 */
class GestationalAgePicker {
  constructor(container, options = {}) {
    this.container = container;
    this.onGaChange = options.onGaChange || null;

    // 建立 0 ~ 42 週
    this.weeksData = Array.from({ length: 43 }, (_, i) => `${i} 週`);
    // 建立 0 ~ 6 天
    this.daysData = Array.from({ length: 7 }, (_, i) => `+ ${i} 天`);

    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="ios-ga-picker-wrapper">
        <div class="ios-picker-selection-lens"></div>
        <div class="ios-picker-col-box" id="colWeeks"></div>
        <div class="ios-picker-col-box" id="colDays"></div>
      </div>
    `;

    const colWeeksEl = this.container.querySelector('#colWeeks');
    const colDaysEl = this.container.querySelector('#colDays');

    this.colWeeks = new IOSPickerColumn(colWeeksEl, {
      items: this.weeksData,
      onChange: () => this.handleValueChange()
    });

    this.colDays = new IOSPickerColumn(colDaysEl, {
      items: this.daysData,
      onChange: () => this.handleValueChange()
    });
  }

  handleValueChange() {
    const w = this.colWeeks.selectedIndex;
    const d = this.colDays.selectedIndex;
    if (this.onGaChange) {
      this.onGaChange(w, d);
    }
  }

  setGa(weeks, days, animated = true) {
    const w = Math.max(0, Math.min(42, weeks));
    const d = Math.max(0, Math.min(6, days));
    this.colWeeks.setSelectedIndex(w, animated, false);
    this.colDays.setSelectedIndex(d, animated, false);
  }

  getGa() {
    return {
      weeks: this.colWeeks.selectedIndex,
      days: this.colDays.selectedIndex
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GestationalAgePicker };
}
