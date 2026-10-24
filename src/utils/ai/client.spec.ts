import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  chatCompletion, chatCompletionStream, createReplyStreamExtractor, extractJson, parseWithSchema, redactKey,
} from './client';
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

/** 用字符串数组构造 SSE ReadableStream（每个元素一次 chunk 推送） */
function sseResponse(chunks: string[], headers: Record<string, string> = { 'Content-Type': 'text/event-stream' }): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(new TextEncoder().encode(c));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers });
}

describe('createReplyStreamExtractor（流式 reply 抽取状态机）', () => {
  it('整体喂入：抽取 reply 字符串内容，忽略前后 JSON 结构', () => {
    const ex = createReplyStreamExtractor();
    const deltas = ex.feed('{"reply":"已把经历改得更量化","proposals":[]}');
    expect(deltas.join('')).toBe('已把经历改得更量化');
  });

  it('逐字符喂入（chunk 边界最坏情况）结果一致', () => {
    const whole = '{"reply":"主导搭建自动化框架，覆盖\\n率达 90\\%","proposals":[{"x":1}]}';
    const ex = createReplyStreamExtractor();
    let acc = '';
    for (const ch of whole) acc += ex.feed(ch).join('');
    // \\n 转义还原为换行；\\% 还原为 %
    expect(acc).toBe('主导搭建自动化框架，覆盖\n率达 90%');
  });

  it('reply 前有噪声文本仍能定位到键', () => {
    const ex = createReplyStreamExtractor();
    const out = ex.feed('好的，结果如下：{"reply":"目标文案","proposals":[]}').join('');
    expect(out).toBe('目标文案');
  });

  it('字符串内的转义引号不终止抽取', () => {
    const ex = createReplyStreamExtractor();
    const out = ex.feed('{"reply":"他说\\\"你好\\\"然后离开","proposals":[]}').join('');
    expect(out).toBe('他说"你好"然后离开');
  });

  it('字符串结束后的剩余内容（proposals 等）全部忽略', () => {
    const ex = createReplyStreamExtractor();
    ex.feed('{"reply":"abc"');
    const more = ex.feed(',"proposals":[{"text":"这段不该出现"}]}');
    expect(more).toEqual([]);
  });

  it('没有 reply 键时输出为空不报错', () => {
    const ex = createReplyStreamExtractor();
    expect(ex.feed('{"other":1}')).toEqual([]);
  });
});

describe('chatCompletionStream', () => {
  it('SSE 增量逐块回调并返回完整文本', async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"{"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"\\"reply\\":\\"第一"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"段。"}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
    ];
    const deltas: string[] = [];
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(chunks));
    vi.stubGlobal('fetch', fetchMock);

    const full = await chatCompletionStream(config, [], { onDelta: (d) => deltas.push(d) });

    // 增量拼起来正好是 {"reply":"第一段。
    expect(deltas).toEqual(['{', '"reply":"第一', '段。']);
    expect(full).toBe('{"reply":"第一段。');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).stream).toBe(true);
  });

  it('行被 chunk 边界截断也能正确拼接', async () => {
    const chunks = ['data: {"choices":[{"delta":{"conte', 'nt":"整行"}}]}\n\ndata: [DONE]\n\n'];
    const deltas: string[] = [];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(chunks)));

    const full = await chatCompletionStream(config, [], { onDelta: (d) => deltas.push(d) });
    expect(deltas).toEqual(['整行']);
    expect(full).toBe('整行');
  });

  it('响应非 event-stream 时降级为整包解析', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ choices: [{ message: { content: '整体内容' } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )));
    const deltas: string[] = [];
    const full = await chatCompletionStream(config, [], { onDelta: (d) => deltas.push(d) });
    expect(full).toBe('整体内容');
    expect(deltas).toEqual(['整体内容']);
  });

  it('HTTP 错误走统一翻译', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 401 })));
    await expect(chatCompletionStream(config, [])).rejects.toSatisfy((e: unknown) =>
      (e as AiRequestError).message.includes('API Key 被拒绝'),
    );
  });
});
