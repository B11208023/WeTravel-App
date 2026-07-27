// tools/start.mjs — 跨平台入口：缺相依套件就自動安裝，然後啟動素材牆 GUI。
// 存在理由：`node gui.mjs` 在剛解壓的專案裡必定丟 ERR_MODULE_NOT_FOUND（sharp 沒裝），
// Windows 的 .bat 有自動安裝、Mac／Linux 沒有 → 這支補上同一段（2026-07-27 Mac 用戶卡關）。
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === 'win32';

if (!existsSync(path.join(TOOLS_DIR, 'node_modules', 'sharp'))) {
  // ASCII 先行（cmd 沒切 UTF-8 時中文會亂碼），中文附後
  console.log('[1/2] First run: installing dependencies... about 1 minute, once only.');
  console.log('      第一次執行：正在安裝元件，約 1 分鐘，只做這一次。');
  const r = spawnSync(isWin ? 'npm.cmd' : 'npm', ['install'], {
    cwd: TOOLS_DIR, stdio: 'inherit', shell: isWin,
  });
  if (r.error?.code === 'ENOENT') {
    console.error('[X] npm not found. Install Node.js LTS from https://nodejs.org and retry.');
    console.error('    找不到 npm：請到 nodejs.org 安裝 LTS 版 Node.js 後再試一次。');
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error('[X] Install failed. Check your network and read the messages above.');
    console.error('    安裝失敗：請檢查網路，並看上面的訊息找原因。');
    process.exit(1);
  }
}

console.log('[2/2] Starting the asset tool. Your browser should open by itself.');
const { main } = await import('./gui.mjs');
await main().catch((e) => { console.error(e.message); process.exit(1); });
