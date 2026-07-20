import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import App from './App.vue';
import { useTabsStore } from '@/stores/tabs';

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

  it('空 Tab 启动时自动创建一个未命名 Tab', async () => {
    mount(App);
    await new Promise(r => setTimeout(r, 100));
    const tabs = useTabsStore();
    expect(tabs.tabs.length).toBeGreaterThanOrEqual(1);
  });

  it('渲染工具栏与 TabBar', () => {
    const wrapper = mount(App);
    expect(wrapper.find('.toolbar').exists()).toBe(true);
    expect(wrapper.find('.tab-bar').exists()).toBe(true);
  });

  it('渲染编辑器与预览面板', () => {
    const wrapper = mount(App);
    expect(wrapper.find('.app-editor').exists()).toBe(true);
    expect(wrapper.find('.app-preview').exists()).toBe(true);
  });
});
