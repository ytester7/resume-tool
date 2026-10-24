import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

/**
 * 路径收敛（本包的红线约束）：
 * 伴随进程产生的一切可写数据——浏览器登录态、缓存、日志、浏览器二进制——
 * 全部放在仓库根目录的 .mcp/ 下，绝不落到用户主目录 / AppData / 系统临时目录。
 * 其他人在自己机器上克隆使用时，数据同样落在他们的项目目录里。
 */

/**
 * 仓库根目录 = mcp-server/..
 * 首选 import.meta.url 推导；在测试运行器等 file URL 不可用的环境下，
 * 从 process.cwd() 逐级向上找含 mcp-server 目录的祖先作为兜底。
 */
function resolveProjectRoot() {
  try {
    return path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
  } catch {
    let dir = path.resolve(process.cwd());
    for (let i = 0; i < 6; i++) {
      if (path.basename(dir) === 'resume-tool' || fs.existsSync(path.join(dir, 'mcp-server', 'package.json'))) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return path.resolve(process.cwd());
  }
}

export const PROJECT_ROOT = resolveProjectRoot();

/** 伴随进程数据根目录（gitignore 已排除） */
export const MCP_DATA_ROOT = path.join(PROJECT_ROOT, '.mcp');

/** Chromium 用户数据目录：登录态 / Cookie 都在这里 */
export const BROWSER_PROFILE_DIR = path.join(MCP_DATA_ROOT, 'browser-profile');

/** Playwright 浏览器二进制目录（安装与运行都指向项目内） */
export const BROWSERS_DIR = path.join(MCP_DATA_ROOT, 'browsers');

/** 运行日志目录 */
export const LOGS_DIR = path.join(MCP_DATA_ROOT, 'logs');

/** 默认监听端口（仅 127.0.0.1，绝不绑定对外地址） */
export const DEFAULT_PORT = 41722;

export function ensureDataDirs() {
  for (const dir of [MCP_DATA_ROOT, BROWSER_PROFILE_DIR, BROWSERS_DIR, LOGS_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** 简单追加日志（按天滚动由文件名承载） */
export function logLine(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  const file = path.join(LOGS_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
  try {
    fs.appendFileSync(file, line, 'utf8');
  } catch {
    // 日志失败不阻断服务
  }
}

/**
 * 把 Playwright 浏览器下载/查找路径钉死在项目内。
 * 必须在首次 import playwright 之前调用（本包内由 server.js 保证顺序）。
 */
export function pinBrowsersPath() {
  process.env.PLAYWRIGHT_BROWSERS_PATH = BROWSERS_DIR;
}

/** 校验一个 URL 是否为本包允许访问的 Boss直聘域名（只读白名单） */
const ALLOWED_HOSTS = ['www.zhipin.com', 'zhipin.com'];

export function isAllowedZhipinUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
