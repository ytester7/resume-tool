import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PreviewPanel from './PreviewPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import { defaultResumeData } from '@/types/resume';

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
