# 產科週數計算機 & 擬真紙轉盤 (OB Gestational Age & Pregnancy Wheel)

專為產科醫師於門診與臨床情境設計的專屬應用程式，適配 iPhone 介面操作規範（Apple Human Interface Guidelines），支援以 Xcode 直接打包為原生 iPhone App，具備雙重模式切換與完整的擴充推算功能。

---

## 🌟 核心功能特點

### 1. 雙重模式切換 (Dual Modes)
- **⚡ 臨床計算面板 (Clinical Calculator)**：
  - 核心輸出：**當前懷孕週數 (GA: X週+Y天, 例如 `14週+1天`)**、**預估預產期 (EDD, 40W)**、**孕期階段 (第一/二/三孕期)**、**倒數剩餘天數**及**孕期進度條**。
  - 支援單鍵「📋 複製臨床病歷格式」，一鍵複製格式化病歷文字直接貼入電子病歷系統 (EMR)。
  - 自動推算產檢時程里程碑（心跳確認、NT頸部透明帶、羊穿、高層次、妊娠糖尿病OGTT、百日咳疫苗、GBS鏈球菌、足月等）。
- **🎡 擬真紙轉盤 (Pregnancy Wheel)**：
  - 高擬真還原產科醫師桌上常用的雙層紙轉盤。
  - **外盤**：365天日曆刻度盤（12個月與每日刻度）。
  - **內盤**：40週妊娠刻度、LMP 與 EDD 專屬指示箭頭、重點產檢時程點。
  - **流暢觸控**：支援單指流暢滑動旋轉與慣性阻尼，轉動時數值即時雙向連動！

### 2. 擴充臨床推算模式 (Extended Calculation Modes)
- **末次月經 (LMP)**：標準 Naegele 規則，支援 21~40 天生理週期微調。
- **預產期逆推 (EDD Reverse)**：已知排定之預產期，精確反推受孕與當日實際週數。
- **超音波校正 (Ultrasound Correction)**：輸入特定超音波檢查日與測得週數天數，自動校準預產期。
- **人工生殖推算 (IVF / ART)**：支援「D5 囊胚植入」、「D3 胚胎植入」、「取卵/受精日」，臨床計算法規級精確。

---

## 📱 iPhone 專案架構

```text
OB calculator/
├── web/                       # 核心前端應用程式 (可在瀏覽器預覽)
│   ├── index.html            # 主介面 (iOS 現代卡片、安全區域適配、雙重模式切換)
│   ├── css/
│   │   └── ios-style.css     # iOS HIG 設計規範樣式表
│   └── js/
│       ├── ob-engine.js      # 產科核心演算法 (Naegele, 週期校正, 超音波, IVF)
│       ├── wheel-canvas.js   # 雙層擬真紙轉盤高解析度 Canvas 引擎
│       └── app.js            # 雙向資料同步、手勢監聽與病歷複製邏輯
├── ios/
│   └── OBCalculator/         # 完整的原生 Xcode iOS 工程
│       ├── OBCalculator.xcodeproj # Xcode 專案檔案
│       └── OBCalculator/
│           ├── OBCalculatorApp.swift
│           ├── ContentView.swift (WKWebView 離線載入引擎)
│           ├── Info.plist
│           ├── Assets.xcassets
│           └── WebResources/  # 打包進 App Bundle 的前端資源
├── sync-to-ios.sh            # 一鍵同步 web/ 變更至 iOS 工程的腳本
└── test/
    └── run-tests.js          # 產科臨床演算法驗證腳本
```

---

## 🛠️ 如何以 Xcode 打包為 iPhone App

1. **開啟專案**：
   在終端機中執行以下指令即可直接開啟 Xcode：
   ```bash
   open ios/OBCalculator/OBCalculator.xcodeproj
   ```

2. **選擇設備與簽署 (Signing)**：
   - 在 Xcode 頂部視窗選擇您的 **實體 iPhone** 或任意 **iOS Simulator (如 iPhone 16 Pro)**。
   - 點選專案設定左側的 `OBCalculator` Target，在 **Signing & Capabilities** 標籤頁中，勾選 **Automatically manage signing** 並選擇您的 Apple 帳號 (Team)。

3. **編譯並安裝至 iPhone**：
   - 按下 **Command + R**（或點擊左上角的 ▶ 播放按鈕）。
   - Xcode 將自動編譯並直接將 App 安裝至您的 iPhone 上！

---

## 🌐 快速在電腦瀏覽器預覽

若您想在電腦瀏覽器中即時檢視或調整介面：
1. 終端機執行：
   ```bash
   python3 -m http.server 8080 --directory web
   ```
2. 開啟瀏覽器訪問：`http://localhost:8080`
3. 使用 Safari 或 Chrome 的「回應式設計模式 (Cmd+Opt+M)」，切換為 iPhone 15/16 尺寸預覽。
