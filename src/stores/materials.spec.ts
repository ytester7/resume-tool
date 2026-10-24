import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMaterialsStore } from './materials';
describe('useMaterialsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('新增素材并持久化；重载恢复', () => {
    const store = useMaterialsStore();
    const entry = store.upsert('Kubernetes 实践', '在 A 项目用 K8s 部署 3 个服务');
    expect(entry).not.toBeNull();
    expect(store.entries).toHaveLength(1);

    setActivePinia(createPinia());
    const reloaded = useMaterialsStore();
    expect(reloaded.entries[0].topic).toBe('Kubernetes 实践');
    expect(reloaded.entries[0].material).toContain('K8s');
    expect(localStorage.getItem('resume_materials_v1')).toBeTruthy();
  });

  it('同 topic 更新而非堆积', () => {
    const store = useMaterialsStore();
    store.upsert('K8s', '第一版素材');
    const second = store.upsert('K8s', '更完整的素材');
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].material).toBe('更完整的素材');
    expect(store.entries[0].id).toBe(second!.id);
    expect(store.entries[0].updatedAt >= store.entries[0].createdAt).toBe(true);
  });

  it('空 topic/material 拒绝', () => {
    const store = useMaterialsStore();
    expect(store.upsert('', '素材')).toBeNull();
    expect(store.upsert('主题', '  ')).toBeNull();
    expect(store.entries).toHaveLength(0);
  });

  it('findByTopic：精确命中优先，其次互含关键词', () => {
    const store = useMaterialsStore();
    store.upsert('Kubernetes 实践', '素材A');
    store.upsert('性能测试', '素材B');

    expect(store.findByTopic('Kubernetes 实践')!.material).toBe('素材A');
    // 宽松：主题含关键词
    expect(store.findByTopic('Kubernetes')!.material).toBe('素材A');
    expect(store.findByTopic('性能')!.material).toBe('素材B');
    expect(store.findByTopic('完全无关')).toBeNull();
  });

  it('上限 100 条 LRU：最旧的被挤出', () => {
    const store = useMaterialsStore();
    for (let i = 0; i < 105; i++) {
      const now = new Date(Date.now() + i).toISOString();
      store.upsert(`主题${i}`, `素材${i}`);
      // 手动回拨 createdAt/updatedAt 保证顺序可断言
      store.entries[0].createdAt = now;
      store.entries[0].updatedAt = now;
    }
    expect(store.entries.length).toBeLessThanOrEqual(100);
    expect(store.findByTopic('主题104')).not.toBeNull();
    expect(store.findByTopic('主题0')).toBeNull();
  });

  it('删除与全清', () => {
    const store = useMaterialsStore();
    const a = store.upsert('A', 'a')!;
    store.upsert('B', 'b');
    store.remove(a.id);
    expect(store.entries).toHaveLength(1);
    store.clearAll();
    expect(store.entries).toHaveLength(0);
    expect(localStorage.getItem('resume_materials_v1')).toBeNull();
  });

  it('损坏数据被剔除', () => {
    localStorage.setItem('resume_materials_v1', '{"bad": 1}');
    setActivePinia(createPinia());
    expect(useMaterialsStore().entries).toHaveLength(0);

    localStorage.setItem('resume_materials_v1', '[{"id":1},{"id":"ok","topic":"t","material":"m","createdAt":"","updatedAt":""}]');
    setActivePinia(createPinia());
    const store = useMaterialsStore();
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].id).toBe('ok');
  });
});
