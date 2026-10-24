import { Throttle } from './throttle.js';
import { detectPageState, riskError } from './detect.js';
import { appError } from './errors.js';
import { parseJobDetail, parseSearchResults } from './extract.js';
import { BROWSER_PROFILE_DIR, isAllowedZhipinUrl, logLine } from './paths.js';

/**
 * Boss直聘只读抓取（红线：只读，不投递、不打招呼、不绕过风控）。
 * 使用用户在登录浏览器里扫码得到的登录态（持久化在项目 .mcp/browser-profile）。
 * 每次导航前过节流器；探测到风控/登录墙立即抛错停止。
 */

const ZHIPIN_HOME = 'https://www.zhipin.com/';

/** @type {import('playwright').BrowserContext | null} */
let context = null;
/** @type {Throttle | null} */
let throttle = null;

export function getThrottle() {
  if (!throttle) throttle = new Throttle();
  return throttle;
}

async function getContext() {
  if (context) return context;
  const { chromium } = await import('playwright');
  context = await chromium.launchPersistentContext(BROWSER_PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 800 },
    // 让用户始终能看到浏览器在做什么；窗口最小化不影响功能
    args: ['--window-size=1100,760', '--start-minimized'],
  });
  context.on('page', (page) => {
    page.setDefaultTimeout(30_000);
  });
  logLine('browser context started (persistent profile in project .mcp/)');
  return context;
}

export async function closeBrowser() {
  if (context) {
    await context.close().catch(() => {});
    context = null;
    logLine('browser context closed');
  }
}

/** 打开可见浏览器让用户扫码登录；登录态落在项目内 profile */
export async function openLoginBrowser() {
  const ctx = await getContext();
  const page = ctx.pages()[0] ?? await ctx.newPage();
  await page.goto(ZHIPIN_HOME, { waitUntil: 'domcontentloaded' }).catch(() => {});
  return { ok: true, hint: '请在打开的浏览器窗口里完成登录；登录态只保存在项目 .mcp/browser-profile 目录' };
}

async function withThrottledPage(handler) {
  const t = getThrottle();
  const wait = t.acquire();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));

  const ctx = await getContext();
  const page = ctx.pages()[0] ?? await ctx.newPage();
  // 不关闭 context（保持登录态），只复用页面
  return handler(page);
}

function assertPageSafe(page) {
  const state = detectPageState({ url: page.url(), title: '', html: '' });
  if (state.kind !== 'none') throw riskError(state.kind);
}

/**
 * 抓取岗位详情页的 JD。
 * @param {string} url Boss直聘岗位详情链接
 */
export async function fetchJd(url) {
  if (!isAllowedZhipinUrl(url)) {
    throw appError('只允许 https://www.zhipin.com 的岗位详情链接', 'BAD_REQUEST');
  }
  return withThrottledPage(async (page) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    assertPageSafe(page);
    const html = await page.content();
    const state = detectPageState({ url: page.url(), title: await page.title(), html });
    if (state.kind !== 'none') throw riskError(state.kind);

    const detail = parseJobDetail(html);
    if (!detail.jd && !detail.company) {
      // DOM 可能未渲染完，等待关键节点再取一次
      await page.waitForSelector('.job-sec-text, [class*=job-detail]', { timeout: 10_000 }).catch(() => {});
      const retryHtml = await page.content();
      const retryState = detectPageState({ url: page.url(), title: await page.title(), html: retryHtml });
      if (retryState.kind !== 'none') throw riskError(retryState.kind);
      const retry = parseJobDetail(retryHtml);
      Object.assign(detail, retry);
    }
    if (!detail.jd) {
      throw appError('没解析到职位描述：页面结构可能已变化，或该链接需要登录后查看', 'PARSE_EMPTY');
    }
    logLine(`fetch-jd ok: ${detail.company} ${detail.position}`);
    return { ...detail, url: page.url() };
  });
}

/**
 * 搜索岗位列表（只读）。
 * @param {{query: string, city?: string, page?: number}} opts
 */
export async function searchJobs({ query, city = '全国', page = 1 }) {
  const kw = encodeURIComponent(query.trim());
  const cityParam = city && city !== '全国' ? `&city=${encodeURIComponent(city)}` : '';
  const url = `https://www.zhipin.com/web/geek/job?query=${kw}${cityParam}&page=${page}`;
  return withThrottledPage(async (pg) => {
    await pg.goto(url, { waitUntil: 'domcontentloaded' });
    assertPageSafe(pg);
    await pg.waitForSelector('.job-card-wrapper, .job-list-box', { timeout: 12_000 }).catch(() => {});
    const html = await pg.content();
    const state = detectPageState({ url: pg.url(), title: await pg.title(), html });
    if (state.kind !== 'none') throw riskError(state.kind);

    const jobs = parseSearchResults(html);
    logLine(`search-jobs "${query}" (city=${city}, page=${page}): ${jobs.length} results`);
    if (jobs.length === 0) {
      throw appError('没有解析到职位卡片：页面结构可能已变化，或触发风控', 'PARSE_EMPTY');
    }
    return jobs.slice(0, 20);
  });
}
