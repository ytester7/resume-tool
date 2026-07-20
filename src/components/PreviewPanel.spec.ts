import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
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
