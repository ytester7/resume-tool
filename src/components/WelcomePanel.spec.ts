import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import WelcomePanel from './WelcomePanel.vue';
import { useSettingsStore } from '@/stores/settings';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';

function enableAi(): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    ai: { provider: 'deepseek', baseURL: 'https://api.example.com/v1', apiKey: 'sk-x', model: 'deepseek-chat' },
  }));
}

describe('WelcomePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('展示三套示例简历', () => {
    const wrapper = mount(WelcomePanel);
    expect(wrapper.findAll('.sample-card')).toHaveLength(3);
    expect(wrapper.text()).toContain('测试工程师');
    expect(wrapper.text()).toContain('后端工程师');
    expect(wrapper.text()).toContain('产品经理');
  });

  it('点击示例抛出 sample 事件', async () => {
    const wrapper = mount(WelcomePanel);
    await wrapper.find('.sample-card').trigger('click');
    const emitted = wrapper.emitted('sample');
    expect(emitted).toBeTruthy();
    expect((emitted![0][0] as { id: string }).id).toBe('qa');
  });

  it('新建与打开按钮各自抛出事件', async () => {
    const wrapper = mount(WelcomePanel);
    const buttons = wrapper.findAll('.hero .actions .btn');
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    expect(wrapper.emitted('new')).toBeTruthy();
    expect(wrapper.emitted('open')).toBeTruthy();
  });

  it('未配置 AI：展示三项能力与「配置 AI」按钮，点击抛出 configure-ai', async () => {
    const wrapper = mount(WelcomePanel);
    expect(wrapper.findAll('.ai-boost-item')).toHaveLength(3);
    expect(wrapper.find('.ai-ready-badge').exists()).toBe(false);

    await wrapper.find('.ai-boost-actions .btn.primary').trigger('click');
    expect(wrapper.emitted('configure-ai')).toBeTruthy();
    wrapper.unmount();
  });

  it('已配置 AI：显示启用徽标，无配置按钮', () => {
    enableAi();
    setActivePinia(createPinia());
    const wrapper = mount(WelcomePanel);
    expect(useSettingsStore().aiReady).toBe(true);
    expect(wrapper.find('.ai-ready-badge').text()).toContain('AI 已启用');
    expect(wrapper.find('.ai-boost-actions .btn.primary').exists()).toBe(false);
    wrapper.unmount();
  });

  it('隐私提示与全局承诺一致（未配置时零网络）', () => {
    const wrapper = mount(WelcomePanel);
    expect(wrapper.find('.ai-boost-hint').text()).toContain('零网络请求');
    wrapper.unmount();
  });
});
