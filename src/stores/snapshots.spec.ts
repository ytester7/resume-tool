import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSnapshotsStore } from './snapshots';
import { useTabsStore } from './tabs';
import { defaultResumeData } from '@/types/resume';
import { serializeResume } from '@/utils/parseResume';

function makeTab(name = '陈默') {
  const tabs = useTabsStore();
  const data = defaultResumeData();
  data.name = name;
  data.summary = '概述';
  return tabs.open({ data });
}

describe('useSnapshotsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('捕获快照并持久化；重载后恢复', () => {
    const store = useSnapshotsStore();
    const tab = makeTab();
    expect(store.capture(tab)).toBe(true);
    expect(store.entries).toHaveLength(1);
    expect(JSON.parse(store.entries[0].content).name).toBe('陈默');

    setActivePinia(createPinia());
    const reloaded = useSnapshotsStore();
    expect(reloaded.entries).toHaveLength(1);
    expect(reloaded.entries[0].tabTitle).toBe('陈默');
  });

  it('同一 Tab 只保留最新 5 份', () => {
    const store = useSnapshotsStore();
    const tab = makeTab();
    for (let i = 0; i < 7; i++) {
      tab.data.summary = `第 ${i} 版`;
      store.capture(tab);
    }
    const mine = store.byTab.get(tab.id)!;
    expect(mine).toHaveLength(5);
    // 最新的在前
    expect(mine[0].content).toContain('第 6 版');
    expect(store.entries).toHaveLength(5);
  });

  it('全局上限 30 份；每 Tab 各留最新 5 份', () => {
    const store = useSnapshotsStore();
    const tabA = makeTab('A');
    const tabB = makeTab('B');
    for (let i = 0; i < 20; i++) {
      tabA.data.summary = `A${i}`;
      tabB.data.summary = `B${i}`;
      store.capture(tabA);
      store.capture(tabB);
    }
    // 每 Tab 5 份 × 2 = 10，未触及全局 30 上限
    expect(store.entries.length).toBe(10);
    expect(store.byTab.get(tabA.id)).toHaveLength(5);
    expect(store.byTab.get(tabB.id)).toHaveLength(5);
    // 各自保留的是最新版本
    expect(store.byTab.get(tabA.id)![0].content).toContain('A19');
    expect(store.byTab.get(tabB.id)![0].content).toContain('B19');
  });

  it('单条超 1MB 直接跳过并返回 false', () => {
    const store = useSnapshotsStore();
    const tab = makeTab();
    const huge = 'x'.repeat(1024 * 1024 + 100);
    expect(store.capture(tab, huge)).toBe(false);
    expect(store.entries).toHaveLength(0);
  });

  it('损坏的持久化数据被剔除', () => {
    localStorage.setItem(
      'resume_snapshots_v1',
      '{"entries": [{"id": 123}, {"id":"ok","tabId":"t","tabTitle":"T","savedAt":"2026","content":"{}"}, "broken"]}',
    );
    setActivePinia(createPinia());
    const store = useSnapshotsStore();
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].id).toBe('ok');
  });

  it('删除/清空当前 Tab/全清', () => {
    const store = useSnapshotsStore();
    const tab = makeTab();
    store.capture(tab);
    const other = makeTab('B');
    store.capture(other);

    store.remove(store.entries[0].id);
    expect(store.entries).toHaveLength(1);

    store.clearTab(other.id);
    expect(store.entries).toHaveLength(1);

    store.clearAll();
    expect(store.entries).toHaveLength(0);
    expect(localStorage.getItem('resume_snapshots_v1')).toBeNull();
  });

  it('不传 content 时自动序列化（与 serializeResume 一致）', () => {
    const store = useSnapshotsStore();
    const tab = makeTab();
    store.capture(tab);
    const expected = serializeResume(
      tab.data, tab.template, tab.sectionOrder, tab.theme, tab.targetJd, tab.hiddenSections,
    );
    expect(store.entries[0].content).toBe(expected);
  });
});
