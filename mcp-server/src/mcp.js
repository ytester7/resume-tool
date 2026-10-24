import { z } from 'zod';

/**
 * MCP 工具层：把 Boss直聘只读能力暴露为 MCP 工具，
 * 供 Claude Desktop / Cursor 等外部 Agent 连接使用。
 * 与 HTTP API 共享同一 boss.js 实现；工具只有「读」没有「写」。
 */

export function buildMcpServer(McpServer, boss) {
  const server = new McpServer(
    { name: 'resume-tool-boss', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.tool(
    'search_jobs',
    '搜索 Boss直聘岗位列表（只读）。返回职位名、公司、薪资与详情链接。',
    {
      query: z.string().min(1).max(60).describe('搜索关键词，如「测试开发」'),
      city: z.string().max(20).optional().describe('城市名，默认全国'),
      page: z.number().int().min(1).max(5).optional().describe('页码，默认 1'),
    },
    async ({ query, city, page }) => {
      const jobs = await boss.searchJobs({ query, city, page });
      return { content: [{ type: 'text', text: JSON.stringify({ jobs }, null, 2) }] };
    },
  );

  server.tool(
    'fetch_jd',
    '抓取 Boss直聘岗位详情页的完整 JD（只读）。需要伴随进程已扫码登录。',
    {
      url: z.string().url().describe('https://www.zhipin.com/job_detail/....html 形式的岗位链接'),
    },
    async ({ url }) => {
      const detail = await boss.fetchJd(url);
      return { content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }] };
    },
  );

  server.tool(
    'open_login_browser',
    '打开登录浏览器窗口让用户扫码登录 Boss直聘（登录态保存在项目 .mcp/ 目录）。',
    {},
    async () => {
      const result = await boss.openLoginBrowser();
      return { content: [{ type: 'text', text: result.hint }] };
    },
  );

  return server;
}
