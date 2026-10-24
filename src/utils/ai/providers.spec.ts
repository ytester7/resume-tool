import { describe, it, expect } from 'vitest';
import { PROVIDER_CATALOG, PROVIDER_ORDER, isConfigComplete, maskApiKey } from './providers';
import type { AiProviderConfig } from '@/types/settings';

function config(overrides: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: 'sk-abc',
    model: 'deepseek-chat',
    ...overrides,
  };
}

describe('PROVIDER_CATALOG', () => {
  it('目录与排序覆盖全部服务商且一一对应', () => {
    expect(Object.keys(PROVIDER_CATALOG).sort()).toEqual([...PROVIDER_ORDER].sort());
  });

  it('除 openai-compatible 外都有默认地址', () => {
    for (const id of PROVIDER_ORDER) {
      if (id === 'openai-compatible') continue;
      expect(PROVIDER_CATALOG[id].defaultBaseURL).toMatch(/^https?:\/\//);
    }
  });
});

describe('isConfigComplete', () => {
  it('null 不完整', () => {
    expect(isConfigComplete(null)).toBe(false);
  });

  it('常规服务商缺 Key 不完整', () => {
    expect(isConfigComplete(config({ apiKey: '' }))).toBe(false);
  });

  it('Ollama 无 Key 也完整', () => {
    expect(isConfigComplete(config({ provider: 'ollama', apiKey: '' }))).toBe(true);
  });

  it('缺地址或模型不完整', () => {
    expect(isConfigComplete(config({ baseURL: ' ' }))).toBe(false);
    expect(isConfigComplete(config({ model: '' }))).toBe(false);
  });
});

describe('maskApiKey', () => {
  it('长 Key 保留首尾四位', () => {
    expect(maskApiKey('sk-1234567890abcdef')).toBe('sk-1...cdef');
  });

  it('空 Key 返回空串，短 Key 整体打码', () => {
    expect(maskApiKey('')).toBe('');
    expect(maskApiKey('short')).toBe('****');
  });
});
