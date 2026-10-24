import { watch, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useTabsStore } from '@/stores/tabs';
import { useFileSystemStore } from '@/stores/fileSystem';
import { useSnapshotsStore } from '@/stores/snapshots';
import { serializeResume } from '@/utils/parseResume';
import type { ResumeSession } from '@/types/resume';

const FILE_SAVE_DEBOUNCE_MS = 2000;
const LOCAL_STORAGE_INTERVAL_MS = 30000;

function snapshotPayload(tab: ResumeSession) {
  return {
    data: tab.data,
    template: tab.template,
    sectionOrder: tab.sectionOrder,
    title: tab.title,
    savedAt: new Date().toISOString(),
    theme: tab.theme,
    targetJd: tab.targetJd,
    hiddenSections: tab.hiddenSections,
  };
}

export function useAutoSave() {
  const tabs = useTabsStore();
  const fs = useFileSystemStore();
  const snapshots = useSnapshotsStore();

  const debouncedFileSave = useDebounceFn(async () => {
    const tab = tabs.active;
    if (!tab?.fileHandle || !tab.dirty) return;
    const content = serializeResume(
      tab.data, tab.template, tab.sectionOrder, tab.theme, tab.targetJd, tab.hiddenSections,
    );
    const ok = await fs.writeToFile(tab.fileHandle, content);
    if (ok) {
      tab.dirty = false;
      // 自动写回同样留档（超过单条大小上限时 store 内部跳过，不提示打扰）
      snapshots.capture(tab, content);
    }
  }, FILE_SAVE_DEBOUNCE_MS);

  const stopWatch = watch(
    () => {
      const tab = tabs.active;
      if (!tab) return null;
      return {
        id: tab.id,
        data: tab.data,
        template: tab.template,
        sectionOrder: tab.sectionOrder,
        theme: tab.theme,
        targetJd: tab.targetJd,
        hiddenSections: tab.hiddenSections,
      };
    },
    (val, old) => {
      const tab = tabs.active;
      // 新建 / 关闭 / 切换 Tab 时不应把新 Tab 标脏；只有同一 Tab 的内容变化才算修改
      if (!tab || !val || !old || val.id !== old.id) return;
      tab.dirty = true;
      if (tab.fileHandle) {
        debouncedFileSave();
      }
    },
    { deep: true },
  );

  const interval = setInterval(() => {
    for (const tab of tabs.tabs) {
      if (!tab.dirty) continue;
      try {
        localStorage.setItem(`resume_tab_${tab.id}`, JSON.stringify(snapshotPayload(tab)));
      } catch {
        // quota exceeded 静默失败
      }
    }
  }, LOCAL_STORAGE_INTERVAL_MS);

  const beforeUnloadHandler = () => {
    for (const tab of tabs.tabs) {
      if (!tab.dirty) continue;
      try {
        localStorage.setItem(`resume_tab_${tab.id}`, JSON.stringify(snapshotPayload(tab)));
      } catch {
        // 静默
      }
    }
  };
  window.addEventListener('beforeunload', beforeUnloadHandler);

  onUnmounted(() => {
    clearInterval(interval);
    stopWatch();
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  });
}

export interface OrphanedTabData {
  key: string;
  data: {
    data: any;
    template: string;
    sectionOrder: any;
    title: string;
    savedAt: string;
    theme?: any;
    targetJd?: string;
    hiddenSections?: string[];
  };
}

export function collectOrphanedTabs(): OrphanedTabData[] {
  const result: OrphanedTabData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('resume_tab_')) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.data && typeof parsed.data === 'object') {
        result.push({ key, data: parsed });
      }
    } catch {
      // 静默跳过损坏数据
    }
  }
  return result;
}

export function clearOrphanedTab(key: string): void {
  localStorage.removeItem(key);
}
