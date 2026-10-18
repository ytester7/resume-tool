import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { collectOrphanedTabs, clearOrphanedTab } from './useAutoSave';
import { parseResumeFile } from '@/utils/parseResume';
import { sanitizeHiddenSections } from '@/utils/hiddenSections';
import type { TemplateName, SectionId, ThemeConfig } from '@/types/resume';

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
      let recovered = 0;
      for (const orphan of orphans) {
        try {
          const parsed = parseResumeFile(orphan.data.data);
          tabs.open({
            title: parsed.data.name || orphan.data.title || '恢复的简历',
            data: parsed.data,
            template: (orphan.data.template as TemplateName) || 'classic',
            sectionOrder: (orphan.data.sectionOrder as SectionId[] | null) ?? null,
            theme: (orphan.data.theme as ThemeConfig | null) ?? null,
            targetJd: orphan.data.targetJd ?? '',
            hiddenSections: sanitizeHiddenSections(orphan.data.hiddenSections),
            dirty: true,
          });
          clearOrphanedTab(orphan.key);
          recovered++;
        } catch {
          clearOrphanedTab(orphan.key);
        }
      }
      if (recovered === 0) {
        ui.toastWarning('未能恢复任何简历，数据可能已损坏');
      } else {
        const failed = orphans.length - recovered;
        ui.toastSuccess(
          failed > 0
            ? `已恢复 ${recovered} 个简历，${failed} 个数据损坏已丢弃`
            : `已恢复 ${recovered} 个简历`,
        );
      }
    } else {
      for (const orphan of orphans) {
        clearOrphanedTab(orphan.key);
      }
    }
  }

  return { recoverOrphanedTabs };
}
