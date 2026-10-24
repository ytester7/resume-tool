import http from 'node:http';
import { DEFAULT_PORT, logLine } from './paths.js';

/**
 * 本地 HTTP API（仅绑定 127.0.0.1）：
 * - GET  /health          供 web 应用探测伴随进程是否在线
 * - POST /api/fetch-jd    {url} → {company, position, salary, jd, url}
 * - POST /api/search-jobs {query, city?, page?} → {jobs: [...]}
 * - POST /api/login       打开登录浏览器（用户扫码）
 * CORS 对本机放开（监听只在回环地址，不对外暴露）
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function errorPayload(e) {
  return { ok: false, error: e?.message ?? '未知错误', code: e?.code ?? 'UNKNOWN' };
}

/**
 * @param {() => Promise<typeof import('./boss.js')>} loadBoss
 * 延迟加载 boss.js（连带 playwright）——进程启动不依赖浏览器，按需才拉起。
 */
export function createHttpServer(loadBoss, port = DEFAULT_PORT) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        const boss = loadBoss();
        return sendJson(res, 200, {
          ok: true,
          data: {
            service: 'resume-tool-mcp',
            version: '0.1.0',
            requestsUsed: boss.getThrottle().count,
            requestsLimit: boss.getThrottle().maxPerSession,
          },
        });
      }

      const boss = await loadBoss();

      if (req.method === 'POST' && url.pathname === '/api/fetch-jd') {
        const { url: jobUrl } = await readBody(req);
        if (typeof jobUrl !== 'string' || !jobUrl) {
          return sendJson(res, 400, { ok: false, error: '缺少 url 参数', code: 'BAD_REQUEST' });
        }
        const detail = await boss.fetchJd(jobUrl);
        return sendJson(res, 200, { ok: true, data: detail });
      }

      if (req.method === 'POST' && url.pathname === '/api/search-jobs') {
        const body = await readBody(req);
        if (typeof body.query !== 'string' || !body.query.trim()) {
          return sendJson(res, 400, { ok: false, error: '缺少 query 参数', code: 'BAD_REQUEST' });
        }
        const jobs = await boss.searchJobs({
          query: body.query,
          city: typeof body.city === 'string' ? body.city : undefined,
          page: Number.isInteger(body.page) ? body.page : 1,
        });
        return sendJson(res, 200, { ok: true, data: { jobs } });
      }

      if (req.method === 'POST' && url.pathname === '/api/login') {
        const result = await boss.openLoginBrowser();
        return sendJson(res, 200, { ok: true, data: result });
      }

      return sendJson(res, 404, { ok: false, error: '接口不存在', code: 'NOT_FOUND' });
    } catch (e) {
      logLine(`http ${req.method} ${url.pathname} -> ${e?.code ?? ''} ${e?.message ?? ''}`);
      const status = e?.code === 'BAD_REQUEST' ? 400 : 502;
      return sendJson(res, status, errorPayload(e));
    }
  });

  // 红线：只绑定回环地址，绝不监听对外网卡
  server.listen(port, '127.0.0.1');
  logLine(`http api listening on http://127.0.0.1:${port} (loopback only)`);
  return server;
}
