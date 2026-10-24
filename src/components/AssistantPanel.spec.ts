import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import AssistantPanel from './AssistantPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';
import { defaultResumeData } from '@/types/resume';
import type { ResumeData } from '@/types/resume';

vi.mock('@/utils/ai/assistant', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/ai/assistant')>();
  return { ...original, chatWithAssistant: vi.fn() };
});

import { chatWithAssistant } from '@/utils/ai/assistant';
import { collectPassages, resolveProposals } from '@/utils/ai/proposals';
const chatMock = vi.mocked(chatWithAssistant);

function makeData(): ResumeData {
  const data = defaultResumeData();
  data.name = '陈默';
  data.summary = '五年测试开发经验';
  data.experience = [{
    id: 'exp1', company: '云舟科技', role: '测试开发', time: '2023-至今',
    description: '', achievement: '', items: ['搭建自动化框架'],
  }];
  return data;
}

/** 让 mock 返回针对当前数据的真实 pending 提案（改写第一条工作内容） */
function mockProposalTurn(data: ResumeData, after: string): void {
  const passage = collectPassages(data).find(
    (p) => p.location.startsWith('工作经历 · ') && p.location.includes('第 1 条'),
  )!;
  chatMock.mockResolvedValueOnce({
    reply: '已改写为更量化的表述',
    proposals: resolveProposals(collectPassages(data), [{ passageId: passage.id, text: after, why: '补充量化' }]),
  });
}

function enableAi(): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    ai: { provider: 'deepseek', baseURL: 'https://api.example.com/v1', apiKey: 'sk-x', model: 'deepseek-chat' },
  }));
}

function mountPanel() {
  const tabs = useTabsStore();
  tabs.open({ data: makeData() });
  return mount(AssistantPanel);
}

describe('AssistantPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    enableAi();
    setActivePinia(createPinia());
    chatMock.mockReset();
  });

  it('打开面板发送请求：消息上屏、提案卡片渲染', async () => {
    const wrapper = mountPanel();
    mockProposalTurn(useTabsStore().active!.data, '主导搭建自动化框架，覆盖率达 90%');

    await wrapper.find('.assistant-fab').trigger('click');
    await wrapper.find('.panel-input').setValue('改得更量化');
    await wrapper.find('.send-btn').trigger('click');
    await flushPromises();

    const messages = wrapper.findAll('.msg');
    expect(messages).toHaveLength(2);
    expect(messages[0].text()).toBe('改得更量化');
    expect(messages[1].text()).toContain('量化');
    const card = wrapper.find('.proposal-card');
    expect(card.exists()).toBe(true);
    expect(card.find('.proposal-after').text()).toContain('90%');
  });

  it('采纳提案：写入简历数据并标记已采纳', async () => {
    const wrapper = mountPanel();
    mockProposalTurn(useTabsStore().active!.data, '主导搭建自动化框架');

    await wrapper.find('.assistant-fab').trigger('click');
    await wrapper.find('.panel-input').setValue('改写');
    await wrapper.find('.send-btn').trigger('click');
    await flushPromises();

    await wrapper.find('.proposal-btn.primary').trigger('click');
    expect(useTabsStore().active!.data.experience[0].items[0]).toBe('主导搭建自动化框架');
    expect(wrapper.find('.proposal-state.ok').text()).toBe('已采纳');
    expect(useTabsStore().active!.dirty).toBe(true);
  });

  it('忽略提案：数据不变', async () => {
    const wrapper = mountPanel();
    mockProposalTurn(useTabsStore().active!.data, '新文案');

    await wrapper.find('.assistant-fab').trigger('click');
    await wrapper.find('.panel-input').setValue('改写');
    await wrapper.find('.send-btn').trigger('click');
    await flushPromises();

    await wrapper.findAll('.proposal-btn')[1].trigger('click');
    expect(useTabsStore().active!.data.experience[0].items[0]).toBe('搭建自动化框架');
    expect(wrapper.find('.proposal-state').text()).toBe('已忽略');
  });

  it('提案后原文被手动改过：采纳失败并提示重新提案', async () => {
    const wrapper = mountPanel();
    mockProposalTurn(useTabsStore().active!.data, 'AI 的改写');

    await wrapper.find('.assistant-fab').trigger('click');
    await wrapper.find('.panel-input').setValue('改写');
    await wrapper.find('.send-btn').trigger('click');
    await flushPromises();

    // AI 返回后、用户采纳前手动改了这一行
    useTabsStore().active!.data.experience[0].items[0] = '用户手改';

    await wrapper.find('.proposal-btn.primary').trigger('click');
    expect(useTabsStore().active!.data.experience[0].items[0]).toBe('用户手改');
    expect(wrapper.find('.proposal-state.bad').exists()).toBe(true);
  });

  it('请求失败时展示人话错误，不崩', async () => {
    const wrapper = mountPanel();
    chatMock.mockRejectedValueOnce(new Error('网络请求失败：请检查 API 地址'));

    await wrapper.find('.assistant-fab').trigger('click');
    await wrapper.find('.panel-input').setValue('改写');
    await wrapper.find('.send-btn').trigger('click');
    await flushPromises();

    const messages = wrapper.findAll('.msg');
    expect(messages[messages.length - 1].text()).toContain('网络请求失败');
  });

  it('对话按 Tab 持久化，切换 Tab 互不串扰', async () => {
    const wrapper = mountPanel();
    const tabs = useTabsStore();
    chatMock.mockResolvedValueOnce({ reply: '第一份简历的回复', proposals: [] });

    await wrapper.find('.assistant-fab').trigger('click');
    await wrapper.find('.panel-input').setValue('你好');
    await wrapper.find('.send-btn').trigger('click');
    await flushPromises();

    // 开第二个 Tab 并切换
    tabs.open({ data: makeData() });
    await flushPromises();
    expect(wrapper.findAll('.msg').length).toBe(0);

    tabs.switchTo(tabs.tabs[0].id);
    await flushPromises();
    expect(wrapper.findAll('.msg').length).toBe(2);
  });
});
