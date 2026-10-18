import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import type { App as VueApp } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useUndoHistory, __clearHistory } from './useUndoHistory';

let app: VueApp | null = null;
let history: ReturnType<typeof useUndoHistory>;

function mountHistory(): void {
  const pinia = createPinia();
  setActivePinia(pinia);
  let api: ReturnType<typeof useUndoHistory> | null = null;
  app = createApp({
    setup() {
      api = useUndoHistory();
      return () => null;
    },
  });
  app.use(pinia);
  app.mount(document.createElement('div'));
  history = api!;
}

describe('useUndoHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __clearHistory();
    mountHistory();
  });

  afterEach(() => {
    app?.unmount();
    app = null;
    vi.useRealTimers();
    __clearHistory();
  });

  it('新 Tab 没有可撤销内容', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    await nextTick();
    expect(history.canUndo.value).toBe(false);
    expect(history.canRedo.value).toBe(false);
  });

  it('编辑后可撤销，撤销后可重做', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    await nextTick();

    tabs.patchActive({ name: '张三' });
    await nextTick();
    vi.advanceTimersByTime(500);

    expect(history.canUndo.value).toBe(true);
    expect(history.undo()).toBe(true);
    await nextTick();
    expect(tabs.active?.data.name).toBe('');
    expect(tabs.active?.dirty).toBe(true);

    expect(history.redo()).toBe(true);
    await nextTick();
    expect(tabs.active?.data.name).toBe('张三');
  });

  it('切换 Tab 后各自独立撤销', async () => {
    const tabs = useTabsStore();
    const a = tabs.open({ title: 'A' });
    await nextTick();
    tabs.patchActive({ name: 'A 简历' });
    await nextTick();
    vi.advanceTimersByTime(500);

    tabs.open({ title: 'B' });
    await nextTick();
    expect(history.canUndo.value).toBe(false);

    tabs.patchActive({ name: 'B 简历' });
    await nextTick();
    vi.advanceTimersByTime(500);
    expect(history.undo()).toBe(true);
    await nextTick();
    expect(tabs.active?.data.name).toBe('');

    tabs.switchTo(a.id);
    await nextTick();
    expect(history.canUndo.value).toBe(true);
    expect(history.undo()).toBe(true);
    await nextTick();
    expect(tabs.active?.data.name).toBe('');
  });

  it('没有历史时 undo/redo 返回 false', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
  });
});
