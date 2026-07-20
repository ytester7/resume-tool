import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import TabBar from './TabBar.vue';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';

describe('TabBar', () => {
  // vi 与 useUiStore 预留给后续扩展（如关闭确认弹窗交互测试）
  void vi;
  void useUiStore;

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('空 Tab 列表显示新建按钮', () => {
    const wrapper = mount(TabBar);
    expect(wrapper.find('.tab-new-btn').exists()).toBe(true);
  });

  it('渲染所有 Tab 项', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.open({ title: 'B' });
    const wrapper = mount(TabBar);
    expect(wrapper.findAll('.tab-item')).toHaveLength(2);
  });

  it('当前 Tab 高亮', () => {
    const tabs = useTabsStore();
    const s1 = tabs.open({ title: 'A' });
    tabs.open({ title: 'B' });
    tabs.switchTo(s1.id);
    const wrapper = mount(TabBar);
    const activeTab = wrapper.find('.tab-item.active');
    expect(activeTab.text()).toContain('A');
  });

  it('点击 Tab 切换激活', async () => {
    const tabs = useTabsStore();
    const s1 = tabs.open({ title: 'A' });
    tabs.open({ title: 'B' });
    const wrapper = mount(TabBar);
    const firstTab = wrapper.findAll('.tab-item')[0];
    await firstTab.trigger('click');
    expect(tabs.activeId).toBe(s1.id);
  });

  it('点击新建按钮创建 Tab', async () => {
    const tabs = useTabsStore();
    const wrapper = mount(TabBar);
    await wrapper.find('.tab-new-btn').trigger('click');
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.active?.title).toBe('未命名');
  });

  it('dirty Tab 显示未保存标记', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '修改' });
    const wrapper = mount(TabBar);
    expect(wrapper.find('.tab-dirty-mark').exists()).toBe(true);
  });

  it('关闭非 dirty Tab 直接关闭', async () => {
    const tabs = useTabsStore();
    const s1 = tabs.open({ title: 'A' });
    tabs.open({ title: 'B' });
    const wrapper = mount(TabBar);
    const closeBtn = wrapper.findAll('.tab-close-btn')[0];
    await closeBtn.trigger('click');
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.tabs[0].id).not.toBe(s1.id);
  });
});
