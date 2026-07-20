import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import EditorPanel from './EditorPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import TemplateSection from './sections/TemplateSection.vue';
import SkillsSection from './sections/SkillsSection.vue';

describe('EditorPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('classic 模板显示区块顺序面板', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' }); // classic
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.section-order-panel').exists()).toBe(true);
  });

  it('modern 固定布局模板显示禁用提示', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', template: 'modern' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.section-order-disabled').exists()).toBe(true);
  });

  it('渲染所有编辑区块', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.findComponent(BasicInfoSection).exists()).toBe(true);
    expect(wrapper.findComponent(TemplateSection).exists()).toBe(true);
    expect(wrapper.findComponent(SkillsSection).exists()).toBe(true);
  });
});
