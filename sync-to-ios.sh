#!/bin/bash
set -e

# 將 web/ 資源同步至 iOS 工程的 WebResources 資料夾
echo "==> 同步 web 資源至 iOS WebResources..."
cp -R web/* ios/OBCalculator/OBCalculator/WebResources/
echo "==> 同步完成！您可以在 Xcode 中直接 Command + R 重新編譯執行。"
