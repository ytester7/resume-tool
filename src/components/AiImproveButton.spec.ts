import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AiImproveButton from './AiImproveButton.vue';
import { useSettingsStore } from '@/stores/settings';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';
import { toErrorMessage } from '@/utils/errors';

vi.mock('@/utils/ai/improve', () => ({
  improveLine: vi.fn(),
}));

import { improveLine } from '@/utils/ai/improve';
const improveMock = vi.mocked(improveLine);

function enableAi(): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    ai: { provider: 'deepseek', baseURL: 'https://api.deepseek.com/v1', apiKey: 'sk-x', model: 'deepseek-chat' },
  }));
}

function mountButton(line: string) {
  return mount(AiImproveButton, {
    props: { line, context: { owner: 'A 公司 · 后端' } },
  });
}

describe('AiImproveButton', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    improveMock.mockReset();
  });

  it('未配置 AI 时整个按钮不渲染（零网络承诺）', () => {
    const wrapper = mountButton('负责搭建 CI');
    expect(wrapper.find('.improve-btn').exists()).toBe(false);
  });

  it('配置后可打开弹层并发起润色，展示结果', async () => {
    enableAi();
    setActivePinia(createPinia());
    improveMock.mockResolvedValueOnce({ text: '主导搭建 CI', why: '动词更强', addsFacts: false });

    const wrapper = mountButton('负责搭建 CI');
    await wrapper.find('.improve-btn').trigger('click');
    await wrapper.findAll('.option-btn')[0].trigger('click');
    await flushPromises();

    expect(improveMock).toHaveBeenCalledOnce();
    expect(wrapper.find('.result-text').text()).toBe('主导搭建 CI');
    expect(wrapper.find('.result-warning').exists()).toBe(false);

    await wrapper.find('.result-btn.primary').trigger('click');
    expect(wrapper.emitted('apply')).toEqual([['主导搭建 CI']]);
  });

  it('addsFacts=true 时展示核对警示', async () => {
    enableAi();
    setActivePinia(createPinia());
    improveMock.mockResolvedValueOnce({ text: '主导搭建 CI，效率提升 30%', why: '量化', addsFacts: true });

    const wrapper = mountButton('负责搭建 CI');
    await wrapper.find('.improve-btn').trigger('click');
    await wrapper.findAll('.option-btn')[0].trigger('click');
    await flushPromises();

    expect(wrapper.find('.result-warning').exists()).toBe(true);
  });

  it('请求期间原文被改动后拒绝应用并提示', async () => {
    enableAi();
    setActivePinia(createPinia());
    let resolveImprove!: (value: { text: string; why: string; addsFacts: boolean }) => void;
    improveMock.mockReturnValueOnce(new Promise((r) => { resolveImprove = r; }));

    const wrapper = mountButton('负责搭建 CI');
    await wrapper.find('.improve-btn').trigger('click');
    await wrapper.findAll('.option-btn')[0].trigger('click');

    // 模拟请求期间用户编辑了这一行
    await wrapper.setProps({ line: '负责搭建 CI 与 CD' });
    resolveImprove({ text: '主导搭建 CI', why: 'r', addsFacts: false });
    await new Promise((r) => setTimeout(r, 0));

    await wrapper.find('.result-btn.primary').trigger('click');
    expect(wrapper.emitted('apply')).toBeUndefined();
    // 弹层回退到选项态，用户可基于新内容重新润色
    expect(wrapper.find('.improve-options').exists()).toBe(true);
  });

  it('润色失败时展示人话错误', async () => {
    enableAi();
    setActivePinia(createPinia());
    improveMock.mockRejectedValueOnce(new Error('服务暂不可用'));

    const wrapper = mountButton('负责搭建 CI');
    await wrapper.find('.improve-btn').trigger('click');
    await wrapper.findAll('.option-btn')[0].trigger('click');
    await new Promise((r) => setTimeout(r, 0));

    // 错误走 ui store 的 toast，弹层保持选项态可重试
    expect(wrapper.find('.improve-options').exists()).toBe(true);
    expect(toErrorMessage(new Error('服务暂不可用'))).toBe('服务暂不可用');
    expect(useSettingsStore().aiReady).toBe(true);
  });
});
