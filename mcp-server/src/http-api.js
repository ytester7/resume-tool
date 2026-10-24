import http from 'node:http';
import { DEFAULT_PORT, logLine } from './paths.js';
import { appError } from './errors.js';

/**
 * 本地 HTTP API（仅绑定 127.0.0.1）：
 * - GET  /health          供 web 应用探测伴随进程是否在线
 * - POST /api/fetch-jd    {url} → {company, position, salary, jd, url}
 * - POST /api/search-jobs {query, city?, page?} → {jobs: [...]}
 * - POST /api/login       打开登录浏览器（用户扫码）
 *
 * 来源校验：虽然只监听回环地址，任意网页仍可向 127.0.0.1 发起跨站请求，
 * 因此 Origin 必须是本机开发地址（localhost/127.0.0.1 任意端口）或
 * file:// 的 "null"；非浏览器客户端（无 Origin，如 curl）放行。
 */

const ALLOWED_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === 'null') return true; // file:// 打开的本地页面
  return ALLOWED_ORIGIN_RE.test(origin);
}

function corsHeadersFor(origin) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function sendJson(res, status, payload, cors) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(appError('请求体过大', 'BAD_REQUEST'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(appError('请求体不是合法 JSON', 'BAD_REQUEST'));
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
    const origin = req.headers.origin;
    const cors = corsHeadersFor(origin);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      res.end();
      return;
    }
    if (!isAllowedOrigin(origin)) {
      logLine(`http blocked disallowed origin: ${origin}`);
      return sendJson(res, 403, { ok: false, error: '来源不被允许', code: 'FORBIDDEN_ORIGIN' }, cors);
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
        }, cors);
      }

      const boss = await loadBoss();

      if (req.method === 'POST' && url.pathname === '/api/fetch-jd') {
        const { url: jobUrl } = await readBody(req);
        if (typeof jobUrl !== 'string' || !jobUrl) {
          return sendJson(res, 400, errorPayload(appError('缺少 url 参数', 'BAD_REQUEST')), cors);
        }
        const detail = await boss.fetchJd(jobUrl);
        return sendJson(res, 200, { ok: true, data: detail }, cors);
      }

      if (req.method === 'POST' && url.pathname === '/api/search-jobs') {
        const body = await readBody(req);
        if (typeof body.query !== 'string' || !body.query.trim()) {
          return sendJson(res, 400, errorPayload(appError('缺少 query 参数', 'BAD_REQUEST')), cors);
        }
        const jobs = await boss.searchJobs({
          query: body.query,
          city: typeof body.city === 'string' ? body.city : undefined,
          page: Number.isInteger(body.page) ? body.page : 1,
        });
        return sendJson(res, 200, { ok: true, data: { jobs } }, cors);
      }

      if (req.method === 'POST' && url.pathname === '/api/login') {
        const result = await boss.openLoginBrowser();
        return sendJson(res, 200, { ok: true, data: result }, cors);
      }

      return sendJson(res, 404, errorPayload(appError('接口不存在', 'NOT_FOUND')), cors);
    } catch (e) {
      logLine(`http ${req.method} ${url.pathname} -> ${e?.code ?? ''} ${e?.message ?? ''}`);
      const status = e?.code === 'BAD_REQUEST' ? 400 : 502;
      return sendJson(res, status, errorPayload(e), cors);
    }
  });

  // 红线：只绑定回环地址，绝不监听对外网卡
  server.listen(port, '127.0.0.1');
  logLine(`http api listening on http://127.0.0.1:${port} (loopback only)`);
  return server;
}
