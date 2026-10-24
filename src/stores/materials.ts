import { defineStore } from 'pinia';
import { ref } from 'vue';
import { generateId } from '@/types/resume';

/**
 * 个人素材库：沉淀用户在优化工程师访谈中提供的真实经历素材，
 * 跨岗位复用（换岗位不必重答）；AI 助手对话也会附带最近素材，
 * 「把之前说的 K8s 经历用进来」这类请求直接生效。
 *
 * 同 topic 重新访谈 = 更新而非堆积；上限 100 条按 updatedAt LRU。
 */

const STORAGE_KEY = 'resume_materials_v1';
const MAX_ENTRIES = 100;

export interface MaterialEntry {
  id: string;
  /** 差距点主题，如「Kubernetes 实践」 */
  topic: string;
  /** 用户真实经历的浓缩事实（AI 只整理、不添加） */
  material: string;
  createdAt: string;
  updatedAt: string;
}

function loadEntries(): MaterialEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is MaterialEntry =>
        !!m && typeof m === 'object'
        && typeof (m as MaterialEntry).id === 'string'
        && typeof (m as MaterialEntry).topic === 'string'
        && typeof (m as MaterialEntry).material === 'string',
    );
  } catch {
    return [];
  }
}

export const useMaterialsStore = defineStore('materials', () => {
  const entries = ref<MaterialEntry[]>(loadEntries());

  function commit(next: MaterialEntry[]): void {
    // 按 updatedAt 保留最新 N 条
    const trimmed = next
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_ENTRIES);
    entries.value = trimmed;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // 存储不可用时静默降级为会话内素材
    }
  }

  /** 入库：同 topic（精确匹配）更新原条目，否则新增 */
  function upsert(topic: string, material: string): MaterialEntry | null {
    const t = topic.trim();
    const m = material.trim();
    if (!t || !m) return null;
    const now = new Date().toISOString();
    const existing = entries.value.find((e) => e.topic === t);
    if (existing) {
      const updated: MaterialEntry = { ...existing, material: m, updatedAt: now };
      commit(entries.value.map((e) => (e.id === existing.id ? updated : e)));
      return updated;
    }
    const entry: MaterialEntry = { id: generateId(), topic: t, material: m, createdAt: now, updatedAt: now };
    commit([entry, ...entries.value]);
    return entry;
  }

  /** 按 topic 关键词找相近素材（带入访谈用） */
  function findByTopic(keyword: string): MaterialEntry | null {
    const k = keyword.trim();
    if (!k) return null;
    const direct = entries.value.find((e) => e.topic === k);
    if (direct) return direct;
    // 宽松匹配：topic 互含对方关键词（按 2 字以上子串粗匹配，中短主题够用）
    return entries.value.find(
      (e) => e.topic.includes(k) || k.includes(e.topic) || e.topic.split(/[ ·]/).some((w) => w.length >= 2 && k.includes(w)),
    ) ?? null;
  }

  function remove(id: string): void {
    commit(entries.value.filter((e) => e.id !== id));
  }

  function clearAll(): void {
    entries.value = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 忽略
    }
  }

  return { entries, upsert, findByTopic, remove, clearAll };
});
