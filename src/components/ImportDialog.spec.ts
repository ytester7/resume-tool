import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ImportDialog from './ImportDialog.vue';
import { parseResumeText } from '@/utils/importText';
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
});
