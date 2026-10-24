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
