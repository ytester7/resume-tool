import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useApplicationsStore } from './applications';
import { APPLICATIONS_STORAGE_KEY } from '@/types/applications';

describe('useApplicationsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('初始为空，新增记录默认意向状态并带创建时间线', () => {
    const store = useApplicationsStore();
    expect(store.list).toEqual([]);

    const app = store.addApplication({ company: '云舟科技', position: '测试开发', channel: 'boss', jd: '会 Python' });
    expect(app).not.toBeNull();
    expect(store.list).toHaveLength(1);
    expect(store.list[0].status).toBe('意向');
    expect(store.list[0].notes[0].text).toBe('创建记录');
  });

  it('缺少公司或岗位时拒绝创建', () => {
    const store = useApplicationsStore();
    expect(store.addApplication({ company: ' ', position: 'x', channel: 'boss' })).toBeNull();
    expect(store.addApplication({ company: 'x', position: '', channel: 'boss' })).toBeNull();
    expect(store.list).toHaveLength(0);
  });

  it('状态变更写入时间线且 updatedAt 前移', () => {
    const store = useApplicationsStore();
    const app = store.addApplication({ company: 'A', position: 'P', channel: 'boss' })!;

    store.setStatus(app.id, '约面');
    const updated = store.list[0];
    expect(updated.status).toBe('约面');
    expect(updated.progressLevel).toBe(3);
    const notes = updated.notes;
    expect(notes[notes.length - 1].text).toBe('状态：意向 → 约面');

    // 同状态重复设置不产生记录，进度不回退
    store.setStatus(app.id, '约面');
    expect(store.list[0].notes).toHaveLength(2);

    // 关闭为不合适后，历史进度保留（漏斗历史口径）
    store.setStatus(app.id, '不合适');
    const closed = store.list[0];
    expect(closed.status).toBe('不合适');
    expect(closed.progressLevel).toBe(3);
  });

  it('旧数据缺 progressLevel 时按时间线回填历史进度', () => {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify([{
      id: 'old-1', company: 'A', position: 'P', channel: 'boss',
      status: '不合适', jd: '', link: '', resumeTitle: '',
      createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
      notes: [
        { at: '2026-10-01T00:00:00Z', text: '创建记录' },
        { at: '2026-10-02T00:00:00Z', text: '状态：意向 → 已投递' },
        { at: '2026-10-03T00:00:00Z', text: '状态：已投递 → 不合适' },
      ],
    }]));
    setActivePinia(createPinia());
    const store = useApplicationsStore();

    expect(store.list[0].progressLevel).toBe(1);
    expect(store.stats.applied).toBe(1);
  });

  it('删除与备注', () => {
    const store = useApplicationsStore();
    const app = store.addApplication({ company: 'A', position: 'P', channel: 'lagou' })!;

    store.addNote(app.id, 'HR 说下周安排一面');
    const noteList = store.list[0].notes;
    expect(noteList[noteList.length - 1].text).toContain('一面');

    store.removeApplication(app.id);
    expect(store.list).toHaveLength(0);
  });

  it('持久化到 localStorage 并在重载时恢复；坏记录被剔除', () => {
    const store = useApplicationsStore();
    store.addApplication({ company: 'A', position: 'P', channel: 'boss' });
    store.addApplication({ company: 'B', position: 'Q', channel: 'zhilian' });
    expect(JSON.parse(localStorage.getItem(APPLICATIONS_STORAGE_KEY)!)).toHaveLength(2);

    // 注入一条坏记录后重载
    const raw = JSON.parse(localStorage.getItem(APPLICATIONS_STORAGE_KEY)!);
    raw.push({ id: 'bad', company: 123 });
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(raw));

    setActivePinia(createPinia());
    const reloaded = useApplicationsStore();
    expect(reloaded.list).toHaveLength(2);
  });

  it('导出/导入按 id 去重合并，坏 JSON 拒绝', () => {
    const store = useApplicationsStore();
    store.addApplication({ company: 'A', position: 'P', channel: 'boss' });
    const exported = store.exportJson();
    expect(JSON.parse(exported).applications).toHaveLength(1);

    const result = store.importJson(exported);
    expect(result).toEqual({ imported: 0, skipped: 1 });

    // 构造一条新记录导入
    const other = JSON.stringify({
      applications: [{
        id: 'ext-1', company: '外部公司', position: '岗位', channel: 'other',
        status: '已投递', jd: '', link: '', resumeTitle: '',
        createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', notes: [],
      }],
    });
    expect(store.importJson(other)).toEqual({ imported: 1, skipped: 0 });
    expect(store.list).toHaveLength(2);

    expect(store.importJson('{broken')).toBeNull();
    expect(store.importJson('{"foo":1}')).toBeNull();
  });

  it('stats 随状态实时联动', () => {
    const store = useApplicationsStore();
    const a = store.addApplication({ company: 'A', position: 'P', channel: 'boss' })!;
    store.addApplication({ company: 'B', position: 'Q', channel: 'boss' })!;

    expect(store.stats.total).toBe(2);
    expect(store.stats.applied).toBe(0);

    store.setStatus(a.id, '已投递');
    expect(store.stats.applied).toBe(1);
  });
});
