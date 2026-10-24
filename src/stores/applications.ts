import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ApplicationStatus, JobApplication } from '@/types/applications';
import { APPLICATIONS_STORAGE_KEY } from '@/types/applications';
import { generateId } from '@/types/resume';
import { calcApplicationStats } from '@/utils/applications';

function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // 逐条兜底校验：缺关键字段的记录直接丢弃，坏数据不拖垮整个台账
    return parsed.filter(
      (a): a is JobApplication =>
        !!a && typeof a === 'object'
        && typeof (a as JobApplication).id === 'string'
        && typeof (a as JobApplication).company === 'string'
        && typeof (a as JobApplication).position === 'string',
    );
  } catch {
    return [];
  }
}

function persist(list: JobApplication[]): void {
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 存储不可用时静默降级为会话内台账
  }
}

export interface NewApplicationInput {
  company: string;
  position: string;
  channel: JobApplication['channel'];
  jd?: string;
  link?: string;
}

export const useApplicationsStore = defineStore('applications', () => {
  const list = ref<JobApplication[]>(loadApplications());

  const stats = computed(() => calcApplicationStats(list.value));

  function commit(next: JobApplication[]): void {
    list.value = next;
    persist(next);
  }

  function addApplication(input: NewApplicationInput): JobApplication | null {
    const company = input.company.trim();
    const position = input.position.trim();
    if (!company || !position) return null;
    const now = new Date().toISOString();
    const app: JobApplication = {
      id: generateId(),
      company,
      position,
      channel: input.channel,
      status: '意向',
      jd: input.jd?.trim() ?? '',
      link: input.link?.trim() ?? '',
      resumeTitle: '',
      createdAt: now,
      updatedAt: now,
      notes: [{ at: now, text: '创建记录' }],
    };
    commit([app, ...list.value]);
    return app;
  }

  function updateApplication(id: string, patch: Partial<Omit<JobApplication, 'id' | 'notes'>>): void {
    commit(list.value.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
    ));
  }

  function removeApplication(id: string): void {
    commit(list.value.filter((a) => a.id !== id));
  }

  /** 状态变更自动写入时间线，便于回顾每条投递的推进节奏 */
  function setStatus(id: string, status: ApplicationStatus): void {
    const now = new Date().toISOString();
    commit(list.value.map((a) => {
      if (a.id !== id || a.status === status) return a;
      return {
        ...a,
        status,
        updatedAt: now,
        notes: [...a.notes, { at: now, text: `状态：${a.status} → ${status}` }],
      };
    }));
  }

  function addNote(id: string, text: string): void {
    const note = text.trim();
    if (!note) return;
    const now = new Date().toISOString();
    commit(list.value.map((a) =>
      a.id === id
        ? { ...a, updatedAt: now, notes: [...a.notes, { at: now, text: note }] }
        : a,
    ));
  }

  function getByTitle(title: string): JobApplication | undefined {
    return list.value.find((a) => a.resumeTitle === title);
  }

  /** 导出为可迁移的 JSON 字符串 */
  function exportJson(): string {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), applications: list.value }, null, 2);
  }

  /**
   * 导入并按 id 去重合并：已存在的 id 跳过（不覆盖本地更新），
   * 返回 {imported, skipped}；坏数据整体拒绝。
   */
  function importJson(raw: string): { imported: number; skipped: number } | null {
    try {
      const parsed = JSON.parse(raw) as { applications?: unknown };
      const incoming = Array.isArray(parsed.applications) ? parsed.applications : null;
      if (!incoming) return null;
      const existing = new Set(list.value.map((a) => a.id));
      const valid = incoming.filter(
        (a): a is JobApplication =>
          !!a && typeof a === 'object'
          && typeof (a as JobApplication).id === 'string'
          && typeof (a as JobApplication).company === 'string'
          && typeof (a as JobApplication).position === 'string',
      );
      const fresh = valid.filter((a) => !existing.has(a.id));
      if (fresh.length > 0) commit([...fresh, ...list.value]);
      return { imported: fresh.length, skipped: valid.length - fresh.length };
    } catch {
      return null;
    }
  }

  return {
    list, stats,
    addApplication, updateApplication, removeApplication,
    setStatus, addNote, getByTitle,
    exportJson, importJson,
  };
});
