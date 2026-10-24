import type { AiProviderConfig, AiProviderId } from '@/types/settings';

export interface ProviderMeta {
  id: AiProviderId;
  name: string;
  /** 留空表示必须由用户填写（openai-compatible 适配硅基流动 / 火山方舟等） */
  defaultBaseURL: string;
  /** 模型建议列表，供 datalist 快速选择 */
  models: string[];
  /** Key 获取入口，展示在设置弹窗 */
  keyUrl: string;
  /** 额外提示（如 Ollama 的跨域配置） */
  hint?: string;
}

export const PROVIDER_CATALOG: Record<AiProviderId, ProviderMeta> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek（国内推荐）',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyUrl: 'https://platform.deepseek.com/api_keys',
  },
  'openai-compatible': {
    id: 'openai-compatible',
    name: 'OpenAI 兼容接口（硅基流动 / 火山方舟等）',
    defaultBaseURL: '',
    models: [],
    keyUrl: '',
    hint: '填写服务商提供的 OpenAI 兼容地址（一般以 /v1 结尾）和模型名',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter（一个 Key 通吃多家模型）',
    defaultBaseURL: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-001', 'deepseek/deepseek-chat'],
    keyUrl: 'https://openrouter.ai/keys',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseURL: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o'],
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama（本地模型，完全离线）',
    defaultBaseURL: 'http://localhost:11434/v1',
    models: ['qwen2.5:7b', 'llama3.1:8b'],
    keyUrl: 'https://ollama.com/download',
    hint: '浏览器直连本地 Ollama 需要设置环境变量 OLLAMA_ORIGINS=* 后重启 Ollama',
  },
};

export const PROVIDER_ORDER: AiProviderId[] = ['deepseek', 'openai-compatible', 'openrouter', 'openai', 'ollama'];

/** 配置是否完整可发起请求（Key 对 Ollama 可为空） */
export function isConfigComplete(config: AiProviderConfig | null | undefined): config is AiProviderConfig {
  if (!config) return false;
  if (!config.baseURL.trim() || !config.model.trim()) return false;
  if (config.provider === 'ollama') return true;
  return config.apiKey.trim().length > 0;
}

/** Key 脱敏预览，如 sk-1AbC...wXyZ；过短的 Key 整体打码 */
export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
