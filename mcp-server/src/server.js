#!/usr/bin/env node
import { DEFAULT_PORT, ensureDataDirs, logLine, pinBrowsersPath } from './paths.js';

/**
 * 入口：
 *   node src/server.js          启动伴随进程（HTTP API + MCP）
 *   node src/server.js --login  只打开登录浏览器，扫码后手动关闭窗口
 *
 * 数据红线：所有可写数据（登录态/浏览器/日志）都在仓库 .mcp/ 下。
 */

// 必须在 import playwright 之前钉住浏览器路径（boss.js 内为动态 import，此处先固化）
pinBrowsersPath();
ensureDataDirs();

const args = process.argv.slice(2);

async function main() {
  const boss = await import('./boss.js');

  if (args.includes('--login')) {
    const result = await boss.openLoginBrowser();
    console.log(`[resume-tool-mcp] ${result.hint}`);
    console.log('[resume-tool-mcp] 登录完成后可直接关闭浏览器窗口；伴随进程不受影响。');
    return;
  }

  const port = Number(process.env.RESUME_TOOL_MCP_PORT ?? DEFAULT_PORT);
  const { createHttpServer } = await import('./http-api.js');
  createHttpServer(() => boss, port);

  // MCP 层按需启用：环境变量 RESUME_TOOL_MCP=off 可关闭（只留 HTTP API）
  if (process.env.RESUME_TOOL_MCP !== 'off') {
    try {
      const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
      const { buildMcpServer } = await import('./mcp.js');
      buildMcpServer(McpServer, boss);
      logLine('mcp tools registered (stdio usage via Claude Desktop config)');
    } catch (e) {
      logLine(`mcp layer unavailable (http api still fine): ${e?.message ?? e}`);
    }
  }

  console.log(`[resume-tool-mcp] 伴随进程已启动：http://127.0.0.1:${port} （仅本机回环）`);
  console.log('[resume-tool-mcp] 数据目录：.mcp/（项目内，登录态与日志都在这里，删除即清空）');
  console.log('[resume-tool-mcp] 首次使用请先运行 npm run mcp:login 扫码登录');
}

main().catch((e) => {
  console.error('[resume-tool-mcp] 启动失败：', e);
  process.exitCode = 1;
});
