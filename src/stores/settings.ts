import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AiProviderConfig } from '@/types/settings';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';
import { chatCompletion } from '@/utils/ai/client';
import { isConfigComplete, maskApiKey } from '@/utils/ai/providers';

function loadSettings(): AiProviderConfig | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ai?: AiProviderConfig | null };
    return isConfigComplete(parsed.ai) ? parsed.ai : null;
  } catch {
    return null;
  }
}

function persist(ai: AiProviderConfig | null): void {
  try {
    if (ai) localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ai }));
    else localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级为会话内配置
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const ai = ref<AiProviderConfig | null>(loadSettings());

  /** AI 是否已配置可用：所有 AI 入口的显隐依据；未配置时应用保持零网络 */
  const aiReady = computed(() => isConfigComplete(ai.value));

  const keyPreview = computed(() => (ai.value?.apiKey ? maskApiKey(ai.value.apiKey) : ''));

  function saveAiConfig(config: AiProviderConfig): void {
    if (!isConfigComplete(config)) return;
    ai.value = { ...config };
    persist(ai.value);
  }

  function clearAiConfig(): void {
    ai.value = null;
    persist(null);
  }

  /**
   * 连接测试：让模型只回一个字符 "1"。
   * 成功即认为 Key、地址、模型三者匹配；失败抛 AiRequestError（人话消息）。
   */
  async function testConnection(config: AiProviderConfig): Promise<void> {
    await chatCompletion(
      config,
      [
        { role: 'system', content: 'You are a connection test. Reply with exactly: 1' },
        { role: 'user', content: '1' },
      ],
      { timeoutMs: 30_000 },
    );
  }

  /** 供 AI 功能直接取用已保存的配置；未配置返回 null，调用方应先检查 aiReady */
  function requireAiConfig(): AiProviderConfig | null {
    return aiReady.value ? ai.value : null;
  }

  return {
    ai, aiReady, keyPreview,
    saveAiConfig, clearAiConfig, testConnection, requireAiConfig,
  };
});
