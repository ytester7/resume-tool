import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ResumeSession } from '@/types/resume';
import { generateId } from '@/types/resume';
import { serializeResume } from '@/utils/parseResume';

/**
 * 版本快照：每次成功保存（手动保存 / FSAA 自动写回）自动留一份完整 JSON。
 * 恢复永远以「新 Tab」打开，不做原地覆盖——误操作零风险。
 *
 * 容量纪律：每 Tab 最多 5 份、全局 30 份、总预算约 4MB、单条 >1MB 跳过
 * （照片 dataURL 过大时宁可不留也不挤爆 localStorage）；LRU 淘汰最旧。
 */

const STORAGE_KEY = 'resume_snapshots_v1';
const PER_TAB_LIMIT = 5;
const TOTAL_LIMIT = 30;
const TOTAL_BUDGET_BYTES = 4 * 1024 * 1024;
const MAX_ENTRY_BYTES = 1024 * 1024;

export interface SnapshotEntry {
  id: string;
  tabId: string;
  tabTitle: string;
  /** ISO 时间戳 */
  savedAt: string;
  /** serializeResume 产出的完整 ResumeFile JSON */
  content: string;
}

interface SnapshotStore {
  version: 1;
  entries: SnapshotEntry[];
}

function loadEntries(): SnapshotEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<SnapshotStore>;
    if (!Array.isArray(parsed.entries)) return [];
    // 坏数据逐条剔除（与投递台账同款防御）
    return parsed.entries.filter(
      (e): e is SnapshotEntry =>
        !!e && typeof e === 'object'
        && typeof e.id === 'string'
        && typeof e.tabId === 'string'
        && typeof e.content === 'string',
    );
  } catch {
    return [];
  }
}

function entryBytes(e: SnapshotEntry): number {
  return e.content.length + e.tabTitle.length + 64;
}

export const useSnapshotsStore = defineStore('snapshots', () => {
  const entries = ref<SnapshotEntry[]>(loadEntries());

  const byTab = computed(() => {
    const map = new Map<string, SnapshotEntry[]>();
    for (const e of entries.value) {
      const list = map.get(e.tabId) ?? [];
      list.push(e);
      map.set(e.tabId, list);
    }
    // 各组内新的在前
    for (const list of map.values()) list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    return map;
  });

  function persist(next: SnapshotEntry[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: next } satisfies SnapshotStore));
      return true;
    } catch {
      return false;
    }
  }

  function commit(next: SnapshotEntry[]): void {
    // quota 超限：删最旧重试一次
    if (!persist(next)) {
      const trimmed = next.slice(0, Math.max(next.length - 5, 0));
      if (persist(trimmed)) next = trimmed;
    }
    entries.value = next;
  }

  /**
   * 捕获一份快照。返回 false 表示跳过（内容超限），调用方可据此提示。
   * content 可不传（由本函数序列化），App 手动保存路径已有序列化产物时直传避免重复。
   */
  function capture(tab: ResumeSession, content?: string): boolean {
    const json = content ?? serializeResume(
      tab.data, tab.template, tab.sectionOrder, tab.theme, tab.targetJd, tab.hiddenSections,
    );
    if (json.length > MAX_ENTRY_BYTES) return false;

    const entry: SnapshotEntry = {
      id: generateId(),
      tabId: tab.id,
      tabTitle: tab.title || tab.data.name || '未命名',
      savedAt: new Date().toISOString(),
      content: json,
    };

    const next = [entry, ...entries.value];
    // 每 Tab 上限：保留该 Tab 最新 N 份
    let count = 0;
    const perTabFiltered = next.filter((e) => {
      if (e.tabId !== tab.id) return true;
      count += 1;
      return count <= PER_TAB_LIMIT;
    });
    // 全局条数上限 + 总预算（LRU：按 savedAt 保留最新的）
    let list = perTabFiltered
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, TOTAL_LIMIT);
    let total = list.reduce((sum, e) => sum + entryBytes(e), 0);
    while (total > TOTAL_BUDGET_BYTES && list.length > 1) {
      const dropped = list.pop();
      if (!dropped) break;
      total -= entryBytes(dropped);
    }
    commit(list);
    return true;
  }

  function remove(id: string): void {
    commit(entries.value.filter((e) => e.id !== id));
  }

  function clearTab(tabId: string): void {
    commit(entries.value.filter((e) => e.tabId !== tabId));
  }

  function clearAll(): void {
    entries.value = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 忽略
    }
  }

  return { entries, byTab, capture, remove, clearTab, clearAll };
});
