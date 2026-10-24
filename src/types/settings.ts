/** AI 服务商标识：OpenAI 兼容协议覆盖绝大多数厂商 */
export type AiProviderId =
  | 'deepseek'
  | 'openai'
  | 'openrouter'
  | 'ollama'
  | 'openai-compatible';

/** 用户自带的 AI 服务商配置（BYOK：Key 只存本地 localStorage） */
export interface AiProviderConfig {
  provider: AiProviderId;
  /** API 地址，保存时按服务商预填默认值，可改 */
  baseURL: string;
  /** 明文 API Key，仅存 localStorage，不参与任何导出 */
  apiKey: string;
  /** 模型名，如 deepseek-chat */
  model: string;
}

export interface AppSettings {
  ai: AiProviderConfig | null;
}

/** localStorage 持久化键；升版时旧键数据直接废弃 */
export const SETTINGS_STORAGE_KEY = 'resume_tool_settings_v1';
