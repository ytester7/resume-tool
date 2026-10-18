import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PreviewPanel from './PreviewPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import { defaultResumeData, TEMPLATE_LIST } from '@/types/resume';
import type { TemplateName } from '@/types/resume';

describe('PreviewPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('无 active Tab 显示空状态', () => {
    const wrapper = mount(PreviewPanel);
    expect(wrapper.find('.preview-empty').exists()).toBe(true);
  });

  it('有 Tab 时渲染预览', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', data: { ...defaultResumeData(), name: '张三' } });
    const wrapper = mount(PreviewPanel);
    expect(wrapper.find('.preview-canvas').exists()).toBe(true);
  });

  it('设置主题后在预览画布注入 CSS 变量', () => {
    const tabs = useTabsStore();
    tabs.open({
      title: 'A',
      theme: { primaryColor: '#ff0000', fontFamily: '' },
      data: { ...defaultResumeData(), name: '张三' },
    });
    const wrapper = mount(PreviewPanel);
    const style = wrapper.find('.preview-canvas').attributes('style') ?? '';
    expect(style).toContain('--c-primary: #ff0000');
  });

  it('未设置主题时不注入 CSS 变量', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', data: { ...defaultResumeData(), name: '张三' } });
    const wrapper = mount(PreviewPanel);
    expect(wrapper.find('.preview-canvas').attributes('style')).toBeUndefined();
  });
});

describe('PreviewPanel 模块显隐', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function openWithSections() {
    const tabs = useTabsStore();
    tabs.open({
      title: 'A',
      data: {
        ...defaultResumeData(),
        name: '张三',
        experience: [{
          id: 'e1', company: '某公司', role: '测试', time: '2024',
          description: '', achievement: '', items: ['一条工作内容'],
        }],
        projects: [{
          id: 'p1', name: '某项目', time: '2024', role: 'r',
          background: '', subtitle: '', achievement: '', items: ['一条项目内容'],
        }],
      },
    });
    return tabs;
  }

  /** 模板是 defineAsyncComponent 懒加载的，等它真正渲染出内容 */
  async function waitForTemplate(wrapper: VueWrapper) {
    await vi.waitFor(() => {
      expect(wrapper.find('.preview-canvas .resume').exists()).toBe(true);
    });
    await flushPromises();
  }

  it('默认渲染所有有内容的模块', async () => {
    openWithSections();
    const wrapper = mount(PreviewPanel);
    await waitForTemplate(wrapper);

    const text = wrapper.text();
    expect(text).toContain('工作经历');
    expect(text).toContain('项目经历');
  });

  it('隐藏后该模块从预览中消失，其余模块保留', async () => {
    const tabs = openWithSections();
    tabs.setSectionHidden('projects', true);

    const wrapper = mount(PreviewPanel);
    await waitForTemplate(wrapper);

    const text = wrapper.text();
    expect(text).toContain('工作经历');
    expect(text).not.toContain('项目经历');
  });

  it('重新显示后模块回到预览', async () => {
    const tabs = openWithSections();
    tabs.setSectionHidden('projects', true);
    tabs.setSectionHidden('projects', false);

    const wrapper = mount(PreviewPanel);
    await waitForTemplate(wrapper);

    expect(wrapper.text()).toContain('项目经历');
  });

  it('隐藏专业概述后不渲染概述文本', async () => {
    const tabs = useTabsStore();
    tabs.open({
      title: 'A',
      data: { ...defaultResumeData(), name: '张三', summary: '这是概述正文' },
    });
    tabs.setSectionHidden('summary', true);

    const wrapper = mount(PreviewPanel);
    await waitForTemplate(wrapper);

    expect(wrapper.text()).not.toContain('这是概述正文');
  });
});

describe('PreviewPanel 13 模板切换', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it.each(TEMPLATE_LIST.map(t => [t.name, t.name] as [TemplateName, string]))(
    '切换到 %s 模板不报错',
    async (tpl) => {
      const tabs = useTabsStore();
      tabs.open({ title: 'A', template: tpl, data: { ...defaultResumeData(), name: '张三' } });
      const wrapper = mount(PreviewPanel);
      await flushPromises();
      expect(wrapper.find('.preview-canvas').exists()).toBe(true);
    },
  );
});
