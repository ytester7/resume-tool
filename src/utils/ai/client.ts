import { z } from 'zod';
import { AiRequestError } from '@/utils/errors';
import type { AiProviderConfig } from '@/types/settings';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  /** 整体超时毫秒数，默认 60s */
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * 非流式对话补全：所有 AI 功能的统一出口。
 *
 * 返回模型原始文本（通常是 JSON），由调用方用 extractJson + zod 校验；
 * 失败统一抛 AiRequestError，消息已翻译成人话且不含 API Key。
 */
export async function chatCompletion(
  config: AiProviderConfig,
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  // 外部 signal 取消时同步中断内部请求；finally 移除监听避免 signal 复用时累积
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(`${config.baseURL.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new AiRequestError(`请求超时（${Math.round((options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000)} 秒），请重试或换更快的模型`, 'AI_TIMEOUT');
    }
    if (options.signal?.aborted) {
      throw new AiRequestError('请求已取消', 'AI_CANCELLED');
    }
    throw new AiRequestError(
      '网络请求失败：请检查 API 地址是否正确、网络是否可达（本地 Ollama 需配置 OLLAMA_ORIGINS）',
      'AI_NETWORK',
      e,
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }

  if (!response.ok) {
    throw new AiRequestError(
      describeHttpFailure(response.status, await safeErrorText(response), config.apiKey),
      'AI_HTTP_ERROR',
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiRequestError('服务商返回了无法解析的内容，请确认地址指向 OpenAI 兼容接口', 'AI_BAD_RESPONSE');
  }
  const content = extractContent(payload);
  if (!content) {
    throw new AiRequestError('服务商返回内容为空，请检查模型名是否正确', 'AI_EMPTY_RESPONSE');
  }
  return content;
}

/**
 * 防御式 JSON 抽取：模型输出常带 ```json 围栏或前后闲话，
 * 依次尝试直接解析 → 剥围栏 → 取最外层大括号/中括号子串。
 * 解析成功不代表结构正确，调用方仍需用 zod schema 校验。
 */
export function extractJson(raw: string): unknown {
  const text = raw.trim();
  const direct = tryParse(text);
  if (direct.ok) return direct.value;

  const unfenced = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (unfenced !== text) {
    const parsed = tryParse(unfenced);
    if (parsed.ok) return parsed.value;
  }

  const start = Math.min(
    ...[text.indexOf('{'), text.indexOf('[')].filter((i) => i >= 0),
  );
  if (Number.isFinite(start)) {
    const open = text[start];
    const close = open === '{' ? '}' : ']';
    const end = text.lastIndexOf(close);
    if (end > start) {
      const sliced = tryParse(text.slice(start, end + 1));
      if (sliced.ok) return sliced.value;
    }
  }
  throw new AiRequestError('模型输出不是合法 JSON，请重试', 'AI_BAD_JSON');
}

/** extractJson + zod 校验的组合：失败给统一人话 */
export function parseWithSchema<T>(raw: string, schema: z.ZodType<T>): T {
  const value = extractJson(raw);
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AiRequestError('模型输出结构不符合预期，请重试', 'AI_SCHEMA_MISMATCH');
  }
  return result.data;
}

function extractContent(payload: unknown): string {
  const choices = (payload as { choices?: unknown[] })?.choices;
  const first = choices?.[0] as { message?: { content?: unknown } } | undefined;
  const content = first?.message?.content;
  return typeof content === 'string' ? content : '';
}

async function safeErrorText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return '';
  }
}

function describeHttpFailure(status: number, body: string, apiKey: string): string {
  const safeBody = redactKey(body, apiKey);
  switch (status) {
    case 401:
    case 403:
      return `API Key 被拒绝（${status}）：请检查 Key 是否有效、是否属于所选服务商${safeBody ? `；${safeBody}` : ''}`;
    case 404:
      return `接口地址或模型不存在（404）：请检查 API 地址与模型名${safeBody ? `；${safeBody}` : ''}`;
    case 429:
      return '请求过于频繁或额度不足（429）：请稍后重试或检查账户余额';
    default:
      return `服务商返回错误（${status}）${safeBody ? `：${safeBody}` : ''}`;
  }
}

/** 把错误文本里可能出现的 API Key 替换为 ***，避免 Key 泄漏到界面/日志 */
export function redactKey(text: string, apiKey: string): string {
  const key = apiKey.trim();
  if (!key) return text;
  return text.split(key).join('***');
}

function tryParse(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/**
 * 流式 reply 抽取状态机：增量喂入模型的原始输出（JSON 文本），
 * 只吐出 "reply":"..." 字符串内的内容片段（含转义还原）。
 * 模型输出契约是 {reply, proposals} 整体 JSON——流式期间无法完整解析，
 * 这个抽取器让 reply 文本可以边到边显；提案仍等完整文本后统一校验。
 */
export function createReplyStreamExtractor() {
  type State = 'search-key' | 'expect-quote' | 'in-string' | 'escape' | 'done';
  let state: State = 'search-key';
  let window = '';

  function feed(chunk: string): string[] {
    const out: string[] = [];
    for (const ch of chunk) {
      if (state === 'search-key') {
        window += ch;
        const idx = window.indexOf('"reply"');
        if (idx !== -1) {
          window = '';
          state = 'expect-quote';
        } else if (window.length > 16) {
          window = window.slice(-16);
        }
      } else if (state === 'expect-quote') {
        if (ch === '"') {
          state = 'in-string';
        } else if (ch !== ':' && ch !== ' ' && ch !== '\n' && ch !== '\t' && ch !== '\r') {
          // 键后不是字符串（异常结构），回到搜索态
          state = 'search-key';
          window = '';
        }
      } else if (state === 'in-string') {
        if (ch === '\\') state = 'escape';
        else if (ch === '"') state = 'done';
        else out.push(ch);
      } else if (state === 'escape') {
        out.push(ch === 'n' ? '\n' : ch === 't' ? '\t' : ch === 'r' ? '\r' : ch);
        state = 'in-string';
      }
      // done: 之后的字符（, "proposals"...）全部忽略
    }
    return out;
  }

  return { feed };
}

export interface StreamOptions extends ChatOptions {
  /** 每个 reply 增量片段的回调（UI 逐步上屏用） */
  onDelta?: (delta: string) => void;
}

/**
 * 流式对话补全（OpenAI 兼容 SSE）。返回完整文本（与 chatCompletion 一致），
 * onDelta 期间持续吐增量。响应不是 event-stream 时自动降级整包解析。
 */
export async function chatCompletionStream(
  config: AiProviderConfig,
  messages: ChatMessage[],
  options: StreamOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(`${config.baseURL.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2,
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new AiRequestError(`请求超时（${Math.round((options.timeoutMs ?? DEFAULT_TIMEOUT_MS) / 1000)} 秒），请重试或换更快的模型`, 'AI_TIMEOUT');
    }
    if (options.signal?.aborted) {
      throw new AiRequestError('请求已取消', 'AI_CANCELLED');
    }
    throw new AiRequestError(
      '网络请求失败：请检查 API 地址是否正确、网络是否可达（本地 Ollama 需配置 OLLAMA_ORIGINS）',
      'AI_NETWORK',
      e,
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }

  if (!response.ok) {
    throw new AiRequestError(
      describeHttpFailure(response.status, await safeErrorText(response), config.apiKey),
      'AI_HTTP_ERROR',
    );
  }

  // 降级：服务商不支持流式时返回普通 JSON
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new AiRequestError('服务商返回了无法解析的内容，请确认地址指向 OpenAI 兼容接口', 'AI_BAD_RESPONSE');
    }
    const content = extractContent(payload);
    if (!content) throw new AiRequestError('服务商返回内容为空，请检查模型名是否正确', 'AI_EMPTY_RESPONSE');
    options.onDelta?.(content);
    return content;
  }

  // SSE 解析：按行切 data: 前缀；chunk 边界可能截断行，用行缓冲
  const reader = response.body?.getReader();
  if (!reader) throw new AiRequestError('当前环境不支持流式读取，请重试', 'AI_BAD_RESPONSE');

  const decoder = new TextDecoder();
  let lineBuffer = '';
  let full = '';

  const handleLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') return;
    try {
      const payload = JSON.parse(data) as { choices?: { delta?: { content?: unknown } }[] };
      const delta = payload.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) {
        full += delta;
        options.onDelta?.(delta);
      }
    } catch {
      // 单行坏数据跳过，不影响后续块
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() ?? '';
      for (const line of lines) handleLine(line);
    }
    lineBuffer += decoder.decode();
    if (lineBuffer) handleLine(lineBuffer);
  } finally {
    reader.releaseLock();
  }

  if (!full) throw new AiRequestError('流式响应为空，请检查模型名是否正确', 'AI_EMPTY_RESPONSE');
  return full;
}
