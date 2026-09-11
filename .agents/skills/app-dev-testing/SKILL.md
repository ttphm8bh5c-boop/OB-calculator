---
name: app-dev-testing
description: >-
  專案開發與測試部署標準規範。在進行 Mac 桌面應用或 iPhone 行動裝置應用的開發、建置與測試時使用。規範 Mac 端一律在桌面建立可雙擊測試的 GUI App；iPhone 行動端桌面不設 App，而是架設本機網站伺服器供 iPhone 透過區網連線測試 UI 與功能。
---

# 專案開發與測試標準規範 (Skill: app-dev-testing)

本規範定義專案在開發過程中的發布與測試標準，依目標平台（Mac 桌面端 vs. iPhone 行動端）區分明確的測試與交付流程。

---

## 一、Mac 桌面應用開發與測試標準

### 核心原則：桌面常規建立獨立 GUI App，方便使用者直接點擊測試
當開發或更新目標為 macOS 桌面端的應用程式時：

1. **桌面建立可執行 GUI App**：
   * 在使用者的桌面（`~/Desktop/`）建立一個免終端機、可直接雙擊執行的 `.app` 軟體包。
   * 名稱使用繁體中文或專案名稱，例如：`~/Desktop/產科計算機.app`。
2. **圖示與視窗規範**：
   * 啟動時必須設定獨立、置中、適當尺寸的專屬視窗（例如 WebKit 獨立視窗或原生視窗），避免開啟雜亂的瀏覽器分頁。
   * 必須配備符合 Apple HIG 標準的專屬 `.icns` 圖示，嚴格遵循第三節「圖示 (Icon) 設計與封裝標準」。
3. **交付通知**：
   * 完成建置後，明確告知使用者：「已在您的 Mac 桌面上建立/更新 `<App名稱>.app`，您可以直接雙擊圖示開啟測試」。

---

## 二、行動裝置 (iPhone / Mobile) 開發與測試標準

### 核心原則：桌面不設 App，架設本機網站供 iPhone 透過 Wi-Fi 連線測試
當開發或更新目標為 iPhone / iPad 等行動端應用程式時：

1. **桌面不設 App**：
   * 嚴禁在 Mac 桌面上建立行動版應用的捷徑或 `.app`，避免桌面雜亂與平台體驗混淆。
2. **本機架設 HTTP 網站伺服器**：
   * 在專案的 Web 資源目錄（例如 `web/`）啟動輕量背景 HTTP 伺服器：
     ```bash
     python3 -m http.server 8088 --directory web
     ```
   * 保持伺服器以守護進程（Daemon）在背景持續運行。
3. **獲取區域網路 IP 並提供連線引導**：
   * 查詢本機當前連網的 Wi-Fi 內網 IP：
     ```bash
     ipconfig getifaddr en0 || ipconfig getifaddr en1
     ```
   * 組合成完整網址（例如：`http://192.168.0.167:8088`）。
   * 生成連線 QR Code 圖片，或清楚提供網址，方便 iPhone 鏡頭直接掃描開啟。
4. **行動端 UI 適配要求 (iPhone 實機標準)**：
   * **單屏無滾動 (Zero Scroll)**：所有核心功能、輸入框與結果顯示，必須完整容納在 iPhone 垂直視窗內，嚴禁出現非必要的垂直捲軸。
   * **移除多餘解說**：移除佔用版面的冗贅說明文字，保留最精練的標籤與操作元素。
   * **原生體驗**：使用 iOS 原生日期選擇器（`<input type="date">`）與符合人體工學的觸控按鈕尺寸（高 $\ge 44\text{px}$）。
5. **即時測試流程**：
   * 程式碼修改完成後，即時同步至 Web 目錄與 iOS 專案。
   * 告知使用者：「伺服器已更新，請在 iPhone Safari 重新整理網頁即可即時查看最新變更」。

---

## 三、圖示 (Icon) 設計與封裝標準 (Apple HIG 標準)

無論是 Mac 桌面 App 或是 iPhone 應用，圖示必須嚴格遵循 **Apple Human Interface Guidelines (HIG)** 美學與技術標準：

### 1. 視覺設計美學準則 (Design Aesthetics)
* **單一鮮明焦點 (Single Focal Point)**：傳達應用的核心醫學/工具屬性（例如：產科輪盤、聽診器、超音波探頭、胎兒心跳），避免將過多雜亂圖示或細碎元素塞入畫布中。
* **避免內嵌文字 (No Text)**：圖示內嚴禁放置細小或冗長的中英文字母，必須依靠象徵符號進行直覺識別。
* **精準配色與材質層次**：
  * 主色調對齊應用風格（如：醫療深海藍 `#0F3249`、科技藍 `#1473AB`、純淨白、溫潤金屬質感）。
  * 採用現代柔和漸層（Subtle Gradient）搭配微擬物光影（Soft Inner Shadow / Rim Light），凸顯高級精品質感。
* **安全距離與外距 (Safe Margin)**：核心圖形應收納於畫布中央的 75% ~ 80% 區域內，避免裁切時邊緣緊貼。

### 2. Mac 桌面 App 圖示標準 (`AppIcon.icns`)
* **外型形狀**：
  * 符合 macOS Big Sur+ 的連貫圓角矩形（Squircle），外圍具備自然的輕微環境投影（Drop Shadow）。
* **多解析度封裝 SOP (Iconset)**：
  * 必須從 $1024 \times 1024\text{ px}$ 高解析原始圖檔出發，使用 `sips` 轉出以下 10 種標準規格：
    * `icon_16x16.png`, `icon_16x16@2x.png`
    * `icon_32x32.png`, `icon_32x32@2x.png`
    * `icon_128x128.png`, `icon_128x128@2x.png`
    * `icon_256x256.png`, `icon_256x256@2x.png`
    * `icon_512x512.png`, `icon_512x512@2x.png`
  * 執行系統編譯工具生成：
    ```bash
    iconutil -c icns AppIcon.iconset -o AppIcon.icns
    ```
  * 將生成的 `AppIcon.icns` 拷貝至 `.app/Contents/Resources/`，並於 `Info.plist` 設定 `CFBundleIconFile = AppIcon`。

### 3. iPhone / iOS 應用與 Web Clip 圖示標準
* **iOS 原生 AppIcon (`Assets.xcassets`)**：
  * 畫布尺寸：**$1024 \times 1024\text{ px}$ 正方形**。
  * **背景必須不透明 (No Alpha/Transparency)**：由 iOS 系統在渲染時自動套用 22.37% 圓角的超橢圓遮罩。
* **Safari 網頁「加入主畫面」圖示 (Web Clip / PWA)**：
  * 放置於 Web 根目錄：`apple-touch-icon.png`（$180 \times 180\text{ px}$ 或 $1024 \times 1024\text{ px}$）。
  * 在 HTML `<head>` 宣告：
    ```html
    <link rel="apple-touch-icon" href="apple-touch-icon.png">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="應用名稱">
    ```
  * 確保使用者在 iPhone Safari 點擊「分享 $\rightarrow$ 加入主畫面」時，能呈現與 App Store 下載之原生 App 完全相同的精美圖示，啟動時不帶 Safari 網址列的全螢幕原生質感。

---

## 四、快速判斷與執行清單 (Checklist)

| 判斷項目 | Mac 桌面應用 | iPhone / 行動端應用 |
| :--- | :--- | :--- |
| **桌面呈現** | 建立 `~/Desktop/<AppName>.app` | **不放任何 App 到桌面** |
| **圖示規範** | 封裝標準 `AppIcon.icns`（Squircle 帶微投影） | 實體不透明正方形圖示（Web Clip & xcassets） |
| **測試方式** | 使用者在 Mac 桌面雙擊開啟獨立視窗測試 | 架設本地 Web 伺服器，iPhone 連線測試 |
| **連線提供** | 本地直接執行，不需網路 | 提供本機區網 IP 網址及 QR Code |
| **介面焦點** | 鍵盤快捷鍵、獨立視窗尺寸 | 觸控優化、一屏容納不滾動、iOS 原生組件 |
| **專案同步** | 產出/替換 `.app` 包 | 同步 Web 資源至 iOS Xcode 專案 (`WebResources/`) |
