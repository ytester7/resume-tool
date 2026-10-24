#!/usr/bin/env node
/**
 * 把 Playwright 的 Chromium 安装到项目 .mcp/browsers 目录（数据收敛红线的一部分）。
 * 用法：node scripts/install-browsers.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browsersDir = path.resolve(mcpRoot, '..', '.mcp', 'browsers');
fs.mkdirSync(browsersDir, { recursive: true });

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npxCmd,
  ['playwright', 'install', 'chromium'],
  {
    stdio: 'inherit',
    cwd: mcpRoot,
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersDir },
  },
);

if (result.status !== 0) {
  console.error('[resume-tool-mcp] 浏览器安装失败，请检查网络后重试');
  process.exit(result.status ?? 1);
}
console.log(`[resume-tool-mcp] Chromium 已安装到项目内：${browsersDir}`);
