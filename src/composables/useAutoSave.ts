import { watch, onUnmounted } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useTabsStore } from '@/stores/tabs';
import { useFileSystemStore } from '@/stores/fileSystem';
import { serializeResume } from '@/utils/parseResume';

const FILE_SAVE_DEBOUNCE_MS = 2000;
const LOCAL_STORAGE_INTERVAL_MS = 30000;

export function useAutoSave() {
  const tabs = useTabsStore();
  const fs = useFileSystemStore();

  const debouncedFileSave = useDebounceFn(async () => {
    const tab = tabs.active;
    if (!tab?.fileHandle || !tab.dirty) return;
    const content = serializeResume(tab.data, tab.template, tab.sectionOrder);
    const ok = await fs.writeToFile(tab.fileHandle, content);
    if (ok) tab.dirty = false;
  }, FILE_SAVE_DEBOUNCE_MS);

  const stopWatch = watch(
    () => tabs.active ? [tabs.active.data, tabs.active.template, tabs.active.sectionOrder] : null,
    () => {
      if (!tabs.active) return;
      tabs.active.dirty = true;
      if (tabs.active.fileHandle) {
        debouncedFileSave();
      }
    },
    { deep: true },
  );

  const interval = setInterval(() => {
    for (const tab of tabs.tabs) {
      if (!tab.dirty) continue;
      try {
        localStorage.setItem(`resume_tab_${tab.id}`, JSON.stringify({
          data: tab.data,
          template: tab.template,
          sectionOrder: tab.sectionOrder,
          title: tab.title,
          savedAt: new Date().toISOString(),
        }));
      } catch {
        // quota exceeded 静默失败
      }
    }
  }, LOCAL_STORAGE_INTERVAL_MS);

  const beforeUnloadHandler = () => {
    for (const tab of tabs.tabs) {
      if (!tab.dirty) continue;
      try {
        localStorage.setItem(`resume_tab_${tab.id}`, JSON.stringify({
          data: tab.data,
          template: tab.template,
          sectionOrder: tab.sectionOrder,
          title: tab.title,
          savedAt: new Date().toISOString(),
        }));
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
