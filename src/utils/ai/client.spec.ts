import { describe, it, expect, vi, afterEach } from 'vitest';
import { chatCompletion, extractJson, parseWithSchema, redactKey } from './client';
import { AiRequestError } from '@/utils/errors';
import { z } from 'zod';
import type { AiProviderConfig } from '@/types/settings';

const config: AiProviderConfig = {
  provider: 'deepseek',
  baseURL: 'https://api.example.com/v1/',
  apiKey: 'sk-test-1234567890abcd',
  model: 'test-model',
};

function okResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chatCompletion', () => {
  it('成功返回模型文本，baseURL 尾部斜杠被规范化', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('你好'));
    vi.stubGlobal('fetch', fetchMock);

    const out = await chatCompletion(config, [{ role: 'user', content: 'hi' }]);

    expect(out).toBe('你好');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test-1234567890abcd');
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('test-model');
    expect(body.stream).toBe(false);
  });

  it('401 时给出 Key 被拒绝的人话提示', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('{"error":"bad key"}', { status: 401 }),
    ));

    await expect(
      chatCompletion(config, [{ role: 'user', content: 'hi' }]),
    ).rejects.toSatisfy((e: unknown) => {
      const err = e as AiRequestError;
      return err instanceof AiRequestError
        && err.message.includes('API Key 被拒绝')
        && !err.message.includes('sk-test');
    });
  });

  it('429 时提示限流/额度', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 })));

    await expect(
      chatCompletion(config, [{ role: 'user', content: 'hi' }]),
    ).rejects.toSatisfy((e: unknown) => (e as AiRequestError).message.includes('429'));
  });

  it('错误响应体里出现 Key 时被脱敏', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(`invalid key sk-test-1234567890abcd`, { status: 403 }),
    ));

    await expect(
      chatCompletion(config, [{ role: 'user', content: 'hi' }]),
    ).rejects.toSatisfy((e: unknown) => {
      const msg = (e as AiRequestError).message;
      return msg.includes('***') && !msg.includes('sk-test-1234567890abcd');
    });
  });

  it('网络错误（CORS/断网）时给出排查提示', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(
      chatCompletion(config, [{ role: 'user', content: 'hi' }]),
    ).rejects.toSatisfy((e: unknown) =>
      (e as AiRequestError).message.includes('OLLAMA_ORIGINS'),
    );
  });

  it('响应缺少 choices 内容时提示模型名检查', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), { status: 200 }),
    ));

    await expect(
      chatCompletion(config, [{ role: 'user', content: 'hi' }]),
    ).rejects.toSatisfy((e: unknown) => (e as AiRequestError).message.includes('模型名'));
  });
});

describe('extractJson', () => {
  it('直接解析裸 JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('剥掉 ```json 围栏', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('从前后闲话中取最外层大括号', () => {
    expect(extractJson('好的，结果如下：{"a":1,"b":[2]} 以上。')).toEqual({ a: 1, b: [2] });
  });

  it('支持数组最外层', () => {
    expect(extractJson('结果：[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('完全不是 JSON 时抛错', () => {
    expect(() => extractJson('这不是 JSON')).toThrow(AiRequestError);
  });
});

describe('parseWithSchema', () => {
  const schema = z.object({ text: z.string() });

  it('结构匹配时返回数据', () => {
    expect(parseWithSchema('{"text":"你好"}', schema)).toEqual({ text: '你好' });
  });

  it('结构不符时抛出统一提示', () => {
    expect(() => parseWithSchema('{"other":1}', schema)).toThrow(AiRequestError);
  });
});

describe('redactKey', () => {
  it('把出现的 Key 替换为 ***', () => {
    expect(redactKey('key sk-secret-0000 leaked', 'sk-secret-0000')).toBe('key *** leaked');
  });

  it('空 Key 原样返回', () => {
    expect(redactKey('abc', '')).toBe('abc');
  });
});
