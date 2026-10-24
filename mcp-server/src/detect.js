/**
 * 风控探测：从当前 URL / 页面标题 / HTML 特征判断是否触发了
 * Boss直聘的安全页、验证码或登录墙。探测到即停止当前操作并返回
 * 明确错误，绝不自动重试或绕过（红线）。
 */

import { appError } from './errors.js';

const RISK_URL_PATTERNS = [
  /\/web\/common\/security-check/,
  /\/web\/geek\/safe/,
  /captcha/i,
];

const RISK_HTML_PATTERNS = [
  /安全验证/,
  /请输入验证码/,
  /滑动验证/,
  /访问异常/,
  /请求过于频繁/,
];

const LOGIN_WALL_PATTERNS = [
  /请使用微信扫码登录/,
  /注册\/登录/,
  /登录后查看更多/,
];

/**
 * @param {{url: string, title?: string, html?: string}} page
 * @returns {{kind: 'none'} | {kind: 'risk'} | {kind: 'login'}}
 */
export function detectPageState({ url, title = '', html = '' }) {
  const haystackUrl = url || '';
  const haystack = `${title}\n${html.slice(0, 5000)}`;

  if (RISK_URL_PATTERNS.some((re) => re.test(haystackUrl))) return { kind: 'risk' };
  if (RISK_HTML_PATTERNS.some((re) => re.test(haystack))) return { kind: 'risk' };
  if (LOGIN_WALL_PATTERNS.some((re) => re.test(haystack))) return { kind: 'login' };
  return { kind: 'none' };
}

/** 把探测结果转成给调用方（web 端 / MCP 客户端）的结构化错误 */
export function riskError(kind) {
  if (kind === 'login') {
    return appError('登录态已失效：请点击应用里的「打开登录浏览器」重新扫码登录', 'NEED_LOGIN');
  }
  return appError('触发平台风控/验证码：已按红线停止本次操作，请稍后在浏览器里正常访问一次 zhipin.com 后再试', 'RISK_CONTROL');
}
