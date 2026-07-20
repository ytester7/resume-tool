import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { collectOrphanedTabs, clearOrphanedTab } from './useAutoSave';
import { parseResumeFile } from '@/utils/parseResume';
import type { TemplateName, SectionKey } from '@/types/resume';

export function useStartupRecovery() {
  const tabs = useTabsStore();
  const ui = useUiStore();

  async function recoverOrphanedTabs(): Promise<void> {
    const orphans = collectOrphanedTabs();
    if (orphans.length === 0) return;

    const action = await ui.confirmDialog({
      title: '检测到未保存的简历',
      message: `发现 ${orphans.length} 个上次会话未保存的简历数据，是否恢复？`,
      actions: ['全部恢复', '全部丢弃'],
    });

    if (action === '全部恢复') {
      for (const orphan of orphans) {
        try {
          const parsed = parseResumeFile(orphan.data.data);
          tabs.open({
            title: orphan.data.title || '恢复的简历',
            data: parsed.data,
            template: (orphan.data.template as TemplateName) || 'classic',
            sectionOrder: (orphan.data.sectionOrder as SectionKey[] | null) ?? null,
            dirty: true,
          });
          clearOrphanedTab(orphan.key);
        } catch {
          clearOrphanedTab(orphan.key);
        }
      }
      ui.toastSuccess(`已恢复 ${orphans.length} 个简历`);
    } else {
      for (const orphan of orphans) {
        clearOrphanedTab(orphan.key);
      }
    }
  }

  return { recoverOrphanedTabs };
}
