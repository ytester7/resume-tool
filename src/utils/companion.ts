/**
 * 本地伴随进程（mcp-server）客户端：
 * 探测 127.0.0.1 上的伴随进程是否在线，在线则提供
 * Boss直聘 JD 抓取 / 搜索 / 登录浏览器 三个只读能力的直连入口。
 * 伴随进程未启动时所有方法静默降级，主流程不受影响。
 */

import { AiRequestError } from '@/utils/errors';

const COMPANION_BASE = 'http://127.0.0.1:41722';

export interface CompanionHealth {
  service: string;
  version: string;
  requestsUsed: number;
  requestsLimit: number;
}

export interface FetchedJob {
  company: string;
  position: string;
  salary: string;
  jd: string;
  url: string;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${COMPANION_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    const payload = (await res.json()) as { ok: boolean; data?: T; error?: string; code?: string };
    if (!res.ok || !payload.ok) {
      const err = new Error(payload.error ?? `伴随进程返回 ${res.status}`);
      (err as Error & { code?: string }).code = payload.code ?? 'UNKNOWN';
      throw err;
    }
    return payload.data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new AiRequestError(`伴随进程请求超时（${Math.round(timeoutMs / 1000)} 秒）`, 'COMPANION_TIMEOUT', e);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** 探测伴随进程（1.5s 超时；任何失败都视为不在线） */
export async function detectCompanion(): Promise<CompanionHealth | null> {
  try {
    return await request<CompanionHealth>('/health', { method: 'GET' }, 1500);
  } catch {
    return null;
  }
}

/** 抓取岗位详情页 JD（需要伴随进程已登录） */
export function fetchJdViaCompanion(url: string): Promise<FetchedJob> {
  return request<FetchedJob>('/api/fetch-jd', {
    method: 'POST',
    body: JSON.stringify({ url }),
  }, 90_000);
}

/** 打开登录浏览器（用户手动扫码，登录态存项目 .mcp/ 目录） */
export function openCompanionLogin(): Promise<{ hint: string }> {
  return request<{ hint: string }>('/api/login', { method: 'POST' }, 20_000);
}

/** NEED_LOGIN / RISK_CONTROL 等伴随进程错误码的读取辅助 */
export function companionErrorCode(e: unknown): string {
  return ((e as { code?: string })?.code) ?? '';
}
