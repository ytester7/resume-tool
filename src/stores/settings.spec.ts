import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from './settings';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';

const VALID_CONFIG = {
  provider: 'deepseek' as const,
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: 'sk-abc',
  model: 'deepseek-chat',
};

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('初始未配置：aiReady 为 false', () => {
    const settings = useSettingsStore();
    expect(settings.ai).toBeNull();
    expect(settings.aiReady).toBe(false);
    expect(settings.requireAiConfig()).toBeNull();
  });

  it('保存合法配置后持久化到 localStorage', () => {
    const settings = useSettingsStore();
    settings.saveAiConfig({ ...VALID_CONFIG });

    expect(settings.aiReady).toBe(true);
    expect(settings.requireAiConfig()).toEqual(VALID_CONFIG);
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}');
    expect(stored.ai.model).toBe('deepseek-chat');
  });

  it('不完整的配置被拒绝保存', () => {
    const settings = useSettingsStore();
    settings.saveAiConfig({ ...VALID_CONFIG, apiKey: '' });
    expect(settings.aiReady).toBe(false);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('清除配置同时清掉 localStorage', () => {
    const settings = useSettingsStore();
    settings.saveAiConfig({ ...VALID_CONFIG });
    settings.clearAiConfig();

    expect(settings.ai).toBeNull();
    expect(settings.aiReady).toBe(false);
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('重新加载时从 localStorage 恢复', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ai: VALID_CONFIG }));
    setActivePinia(createPinia());
    const settings = useSettingsStore();

    expect(settings.aiReady).toBe(true);
    expect(settings.ai?.provider).toBe('deepseek');
  });

  it('损坏的 localStorage 数据被忽略（静默回到未配置）', () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, '{broken json');
    setActivePinia(createPinia());
    const settings = useSettingsStore();

    expect(settings.aiReady).toBe(false);
  });

  it('keyPreview 输出脱敏预览', () => {
    const settings = useSettingsStore();
    settings.saveAiConfig({ ...VALID_CONFIG, apiKey: 'sk-1234567890abcdef' });
    expect(settings.keyPreview).toBe('sk-1...cdef');
  });
});
