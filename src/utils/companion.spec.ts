import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectCompanion, fetchJdViaCompanion, companionErrorCode } from './companion';

const HEALTH_DATA = { service: 'resume-tool-mcp', version: '0.1.0', requestsUsed: 3, requestsLimit: 60 };

function mockFetch(handler: (url: string, init?: RequestInit) => { status: number; body: unknown }): void {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const { status, body } = handler(url, init);
    return new Response(JSON.stringify(body), { status });
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectCompanion', () => {
  it('在线时返回健康信息', async () => {
    mockFetch((url) => (url.endsWith('/health') ? { status: 200, body: { ok: true, data: HEALTH_DATA } } : { status: 404, body: {} }));
    const health = await detectCompanion();
    expect(health?.service).toBe('resume-tool-mcp');
    expect(health?.requestsUsed).toBe(3);
  });

  it('不在线（网络拒绝/超时）返回 null 而不是抛错', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await detectCompanion()).toBeNull();
  });

  it('返回非 200 也视为不在线', async () => {
    mockFetch(() => ({ status: 500, body: { ok: false } }));
    expect(await detectCompanion()).toBeNull();
  });
});

describe('fetchJdViaCompanion', () => {
  it('透传 POST body 并解包 data', async () => {
    let capturedInit: RequestInit | undefined;
    mockFetch((_url, init) => {
      capturedInit = init;
      return {
        status: 200,
        body: { ok: true, data: { company: '云舟科技', position: '测开', salary: '20K', jd: '职责', url: 'u' } },
      };
    });

    const job = await fetchJdViaCompanion('https://www.zhipin.com/job_detail/x.html');
    expect(job.company).toBe('云舟科技');
    expect(capturedInit?.method).toBe('POST');
    expect(String(capturedInit?.body)).toContain('job_detail');
  });

  it('错误响应抛出携带 code 的 Error', async () => {
    mockFetch(() => ({ status: 502, body: { ok: false, error: '触发平台风控', code: 'RISK_CONTROL' } }));

    await expect(fetchJdViaCompanion('x')).rejects.toSatisfy((e: unknown) =>
      companionErrorCode(e) === 'RISK_CONTROL' && (e as Error).message.includes('风控'),
    );
  });
});
