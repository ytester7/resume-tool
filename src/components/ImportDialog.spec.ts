import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ImportDialog from './ImportDialog.vue';
import { parseResumeText } from '@/utils/importText';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';
import type { ResumeImportDraft } from '@/types/import';

const text = `陈默
软件测试工程师
13800138000 | chenmo@example.com

工作经历
2023.06-至今  云舟科技  测试开发工程师
• 搭建自动化框架

教育背景
2017.09-2021.06  杭州电子科技大学  计算机科学与技术  本科
`;

function makeDraft(overrides: Partial<ResumeImportDraft> = {}): ResumeImportDraft {
  const parsed = parseResumeText(text);
  return {
    fileName: 'resume.pdf',
    source: 'pdf',
    data: parsed.data,
    template: 'classic',
    sectionOrder: null,
    theme: null,
    targetJd: '',
    hiddenSections: [],
    warnings: parsed.warnings,
    rawText: text,
    confidence: parsed.confidence,
    structured: false,
    ...overrides,
  };
}

describe('ImportDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('展示文件信息、识别结果与统计', () => {
    const wrapper = mount(ImportDialog, { props: { draft: makeDraft() } });
    expect(wrapper.find('.import-file').text()).toContain('resume.pdf');
    expect(wrapper.find('.source-badge').text()).toBe('PDF');
    expect(wrapper.find('.field strong').text()).toBe('陈默');
    expect(wrapper.find('.confidence-num').text()).toBe('75');
    expect(wrapper.findAll('.count-chip')).toHaveLength(5);
    wrapper.unmount();
  });

  it('展示警告并在原文预览中截断', () => {
    const longText = 'A'.repeat(3000);
    const wrapper = mount(ImportDialog, {
      props: { draft: makeDraft({ rawText: longText, warnings: ['未识别到教育背景'] }) },
    });
    expect(wrapper.find('.warnings').text()).toContain('未识别到教育背景');
    expect(wrapper.find('.raw pre').text()).toContain('仅预览前 2500 字');
    wrapper.unmount();
  });

  it('确认与取消分别抛出事件', async () => {
    const wrapper = mount(ImportDialog, { props: { draft: makeDraft() } });
    await wrapper.find('.btn-primary').trigger('click');
    await wrapper.find('.btn-secondary').trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('cancel')).toBeTruthy();
    wrapper.unmount();
  });

  it('Esc 触发取消', async () => {
    const wrapper = mount(ImportDialog, { props: { draft: makeDraft() } });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('cancel')).toBeTruthy();
    wrapper.unmount();
  });

  it('未配置 AI 时不显示 AI 解析按钮，隐私文案为纯本地表述', () => {
    const wrapper = mount(ImportDialog, { props: { draft: makeDraft() } });
    expect(wrapper.find('.btn-ai').exists()).toBe(false);
    expect(wrapper.find('.hint').text()).toContain('不会上传到任何服务器');
    wrapper.unmount();
  });

  it('配置 AI 后出现解析按钮，点击抛出 ai-reparse；AI 草稿显示徽标', async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      ai: { provider: 'deepseek', baseURL: 'https://api.deepseek.com/v1', apiKey: 'sk-x', model: 'deepseek-chat' },
    }));
    const wrapper = mount(ImportDialog, { props: { draft: makeDraft({ aiAssisted: true }) } });

    const btn = wrapper.find('.btn-ai');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('再解析一次');
    expect(wrapper.find('.ai-badge').exists()).toBe(true);
    expect(wrapper.find('.hint').text()).toContain('发送给你配置的服务商');

    await btn.trigger('click');
    expect(wrapper.emitted('ai-reparse')).toBeTruthy();
    wrapper.unmount();
  });
});
