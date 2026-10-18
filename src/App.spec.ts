import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import App from './App.vue';
import WelcomePanel from './components/WelcomePanel.vue';
import { useTabsStore } from '@/stores/tabs';
import { SAMPLE_RESUMES } from '@/data/samples';

// mock window.matchMedia 与 indexedDB 防止 jsdom 报错
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  });
});

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('挂载时不报错', () => {
    const wrapper = mount(App);
    expect(wrapper.find('.app-root').exists()).toBe(true);
  });

  it('无 Tab 时展示欢迎页而不是空白编辑器', () => {
    const wrapper = mount(App);
    expect(wrapper.find('.toolbar').exists()).toBe(true);
    expect(wrapper.find('.welcome').exists()).toBe(true);
    expect(wrapper.find('.tab-bar').exists()).toBe(false);
    expect(useTabsStore().tabs.length).toBe(0);
  });

  it('从欢迎页选择示例后创建 Tab 并进入编辑器', async () => {
    const wrapper = mount(App);
    wrapper.findComponent(WelcomePanel).vm.$emit('sample', SAMPLE_RESUMES[0]);
    await nextTick();
    await nextTick();

    const tabs = useTabsStore();
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.active?.data.name).toBe('陈默');
    expect(tabs.active?.title).toBe('陈默');
    expect(wrapper.find('.tab-bar').exists()).toBe(true);
    expect(wrapper.find('.app-editor').exists()).toBe(true);
    expect(wrapper.find('.app-preview').exists()).toBe(true);
  });

  it('已有 Tab 时直接渲染编辑器与预览面板', () => {
    const tabs = useTabsStore();
    tabs.open({ title: '已有简历', data: SAMPLE_RESUMES[1].data });
    const wrapper = mount(App);
    expect(wrapper.find('.welcome').exists()).toBe(false);
    expect(wrapper.find('.app-editor').exists()).toBe(true);
    expect(wrapper.find('.app-preview').exists()).toBe(true);
  });
});
