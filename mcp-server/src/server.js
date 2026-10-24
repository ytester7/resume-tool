#!/usr/bin/env node
import { DEFAULT_PORT, ensureDataDirs, logLine, pinBrowsersPath } from './paths.js';

/**
 * 入口：
 *   node src/server.js           启动伴随进程（HTTP API，供 web 应用直连）
 *   node src/server.js --stdio   以 MCP stdio 模式运行（供 Claude Desktop 等外部 Agent）
 *   node src/server.js --login   只打开登录浏览器，扫码后手动关闭窗口
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

  if (args.includes('--stdio')) {
    // MCP stdio 模式：stdin/stdout 是 JSON-RPC 通道，绝不能向 stdout 打印日志
    const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { buildMcpServer } = await import('./mcp.js');
    const mcp = buildMcpServer(McpServer, boss);
    await mcp.connect(new StdioServerTransport());
    logLine('mcp stdio transport connected');
    return;
  }

  const port = Number(process.env.RESUME_TOOL_MCP_PORT ?? DEFAULT_PORT);
  const { createHttpServer } = await import('./http-api.js');
  createHttpServer(() => boss, port);

  console.log(`[resume-tool-mcp] 伴随进程已启动：http://127.0.0.1:${port} （仅本机回环）`);
  console.log('[resume-tool-mcp] 数据目录：.mcp/（项目内，登录态与日志都在这里，删除即清空）');
  console.log('[resume-tool-mcp] 首次使用请先运行 npm run mcp:login 扫码登录');
  console.log('[resume-tool-mcp] 外部 Agent 接入：node src/server.js --stdio');
}

main().catch((e) => {
  console.error('[resume-tool-mcp] 启动失败：', e);
  process.exitCode = 1;
});
