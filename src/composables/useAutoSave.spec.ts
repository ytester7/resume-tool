import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { effectScope } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { collectOrphanedTabs, clearOrphanedTab, useAutoSave } from './useAutoSave';
import { useTabsStore } from '@/stores/tabs';

describe('collectOrphanedTabs & clearOrphanedTab', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('空 localStorage 返回空数组', () => {
    expect(collectOrphanedTabs()).toEqual([]);
  });

  it('收集 resume_tab_ 前缀的条目', () => {
    const payload = {
      data: { name: '张三' },
      template: 'classic',
      sectionOrder: null,
      title: '测试',
      savedAt: '2026-07-18T00:00:00.000Z',
    };
    localStorage.setItem('resume_tab_abc', JSON.stringify(payload));
    localStorage.setItem('resume_tab_xyz', JSON.stringify({ ...payload, title: '另一个' }));
    localStorage.setItem('other_key', 'something');

    const result = collectOrphanedTabs();
    expect(result.length).toBe(2);
    expect(result.map(o => o.key).sort()).toEqual(['resume_tab_abc', 'resume_tab_xyz']);
    expect(result[0].data.title).toBeTruthy();
  });

  it('跳过损坏的 JSON 数据', () => {
    localStorage.setItem('resume_tab_bad', '{invalid json');
    expect(collectOrphanedTabs()).toEqual([]);
  });

  it('跳过 data 字段非对象的条目', () => {
    localStorage.setItem('resume_tab_str', JSON.stringify({ data: 'not-object', template: 'classic' }));
    expect(collectOrphanedTabs()).toEqual([]);
  });

  it('clearOrphanedTab 移除指定 key', () => {
    localStorage.setItem('resume_tab_a', JSON.stringify({ data: { name: 'a' }, template: 'classic' }));
    clearOrphanedTab('resume_tab_a');
    expect(localStorage.getItem('resume_tab_a')).toBe(null);
  });

  it('clearOrphanedTab 对不存在的 key 不报错', () => {
    expect(() => clearOrphanedTab('resume_tab_nonexist')).not.toThrow();
  });
});

describe('useAutoSave 主函数', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('编辑后标记 dirty 并触发 localStorage 持久化', () => {
    const scope = effectScope();
    scope.run(() => {
      useAutoSave();
    });
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    expect(tabs.active?.dirty).toBe(true);

    // 快进 30s 触发 localStorage 持久化
    vi.advanceTimersByTime(31000);
    const orphans = collectOrphanedTabs();
    expect(orphans.length).toBe(1);
    expect(orphans[0].data.data.name).toBe('张三');
    scope.stop();
  });

  it('无 dirty 时不写入 localStorage', () => {
    const scope = effectScope();
    scope.run(() => {
      useAutoSave();
    });
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    vi.advanceTimersByTime(31000);
    expect(collectOrphanedTabs().length).toBe(0);
    scope.stop();
  });
});
