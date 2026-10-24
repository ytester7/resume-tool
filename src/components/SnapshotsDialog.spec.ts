import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import SnapshotsDialog from './SnapshotsDialog.vue';
import { useSnapshotsStore } from '@/stores/snapshots';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { defaultResumeData } from '@/types/resume';

function makeTab(name: string, summary: string) {
  const tabs = useTabsStore();
  const data = defaultResumeData();
  data.name = name;
  data.summary = summary;
  return tabs.open({ data });
}

describe('SnapshotsDialog', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('无快照时显示空态引导', () => {
    makeTab('陈默', '第一版');
    const wrapper = mount(SnapshotsDialog);
    expect(wrapper.find('.snap-empty').text()).toContain('Ctrl+S');
    wrapper.unmount();
  });

  it('当前简历的快照按时间倒序展示；其他简历折叠分组', () => {
    const snapshots = useSnapshotsStore();
    const tabA = makeTab('简历A', 'A 的内容');
    const tabB = makeTab('简历B', 'B 的内容');
    snapshots.capture(tabA);
    snapshots.capture(tabA);
    snapshots.capture(tabB);

    // 当前活跃 Tab 是 B
    const wrapper = mount(SnapshotsDialog);
    expect(wrapper.findAll('section .snap-item')).toHaveLength(1); // B 的 1 份
    expect(wrapper.findAll('details .snap-item')).toHaveLength(2); // A 的 2 份（折叠区）
    expect(wrapper.find('.snap-group-title').text()).toContain('简历B');
    expect(wrapper.find('details.snap-other summary').text()).toContain('简历A（2 份快照）');
    wrapper.unmount();
  });

  it('恢复：以新 Tab 打开快照内容，不覆盖原 Tab', async () => {
    const snapshots = useSnapshotsStore();
    const tab = makeTab('陈默', '旧版概述');
    snapshots.capture(tab);
    // 之后继续编辑（当前数据已前进）
    tab.data.summary = '新版概述';

    const wrapper = mount(SnapshotsDialog);
    await wrapper.find('.snap-btn.primary').trigger('click');

    const tabs = useTabsStore();
    expect(tabs.tabs).toHaveLength(2);
    expect(tabs.active!.data.summary).toBe('旧版概述');
    expect(tabs.active!.title).toContain('陈默@');
    expect(tabs.tabs[0].data.summary).toBe('新版概述'); // 原 Tab 未被覆盖
    expect(wrapper.emitted('close')).toBeTruthy();
    wrapper.unmount();
  });

  it('删除快照需确认，取消则不动', async () => {
    const snapshots = useSnapshotsStore();
    const tab = makeTab('陈默', '概述');
    snapshots.capture(tab);

    const wrapper = mount(SnapshotsDialog);
    const ui = useUiStore();

    // 拦截确认：先取消
    const confirmSpy = vi.spyOn(ui, 'confirmDialog')
      .mockResolvedValueOnce('取消')
      .mockResolvedValueOnce('删除');
    await wrapper.find('.snap-btn.danger').trigger('click');
    expect(snapshots.entries).toHaveLength(1);

    await wrapper.find('.snap-btn.danger').trigger('click');
    expect(snapshots.entries).toHaveLength(0);
    confirmSpy.mockRestore();
    wrapper.unmount();
  });

  it('快照内容损坏时恢复报错不崩', async () => {
    const snapshots = useSnapshotsStore();
    const tab = makeTab('陈默', '概述');
    snapshots.capture(tab);
    snapshots.entries[0].content = '{broken json';

    const wrapper = mount(SnapshotsDialog);
    await wrapper.find('.snap-btn.primary').trigger('click');
    const tabs = useTabsStore();
    expect(tabs.tabs).toHaveLength(1); // 未开新 Tab
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  });
});
