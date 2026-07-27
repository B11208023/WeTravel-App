#!/bin/bash
# WeTravel asset tool launcher for macOS / Linux. Double-click to run.
# Windows users: use the .bat file instead.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "[X] Node.js not found. Install the LTS version from https://nodejs.org"
  echo "    then double-click this file again."
  echo "    找不到 Node.js：請到 nodejs.org 下載 LTS 版安裝後，再雙擊一次這個檔案。"
  read -r -p "Press Enter to close..." _
  exit 1
fi

# start.mjs 會在第一次執行時自動安裝相依套件，之後直接開素材牆
node tools/start.mjs

echo ""
echo "Tool stopped. 工具已停止（可關閉此視窗）。"
read -r -p "Press Enter to close this window..." _
