import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHttpServer } from '../src/http-api.js';

/** loadBoss 桩：只用到 getThrottle 的 /health 路径 */
const bossStub = {
  getThrottle: () => ({ count: 0, maxPerSession: 60 }),
};

let server;
let baseUrl;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = createHttpServer(() => bossStub, 0);
    server.on('listening', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve(undefined);
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('HTTP API 来源校验与基础契约', () => {
  it('health 正常返回（无 Origin 的本机客户端）', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(payload.data.service).toBe('resume-tool-mcp');
  });

  it('localhost 来源放行且 ACAO 回显来源', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('file:// 的 null 来源放行', async () => {
    const res = await fetch(`${baseUrl}/health`, { headers: { Origin: 'null' } });
    expect(res.status).toBe(200);
  });

  it('外部网站来源被 403 拒绝（防任意网页打本机接口消耗配额）', async () => {
    const res = await fetch(`${baseUrl}/api/fetch-jd`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example.com', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.zhipin.com/job_detail/x.html' }),
    });
    expect(res.status).toBe(403);
    const payload = await res.json();
    expect(payload.code).toBe('FORBIDDEN_ORIGIN');
  });

  it('预检 OPTIONS 返回 204', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:5173' },
    });
    expect(res.status).toBe(204);
  });

  it('坏 JSON 请求体返回 400 BAD_REQUEST 而不是 502', async () => {
    const res = await fetch(`${baseUrl}/api/fetch-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken',
    });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('BAD_REQUEST');
  });
});
