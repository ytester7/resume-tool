import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { buildResumeDocx } from '@/utils/docxExport';
import { applyHiddenSections } from '@/utils/hiddenSections';
import { sanitizeFilename } from '@/utils/sanitize';
import { toErrorMessage } from '@/utils/errors';
import { TEMPLATE_REGISTRY } from '@/types/resume';
import type { SectionId, SectionKey } from '@/types/resume';

const FALLBACK_ORDER: SectionKey[] = [
  'summary', 'skills', 'experience', 'projects', 'education', 'evaluation',
];

export function useDocxExport() {
  const tabs = useTabsStore();
  const ui = useUiStore();

  async function exportDocx(): Promise<boolean> {
    const tab = tabs.active;
    if (!tab) {
      ui.toastWarning('没有打开的简历');
      return false;
    }

    const meta = TEMPLATE_REGISTRY[tab.template];
    const rawOrder: SectionId[] = meta?.sectionOrderMutable
      ? (tab.sectionOrder ?? meta.defaultSectionOrder)
      : (meta?.defaultSectionOrder?.length ? meta.defaultSectionOrder : FALLBACK_ORDER);
    const order = rawOrder.filter(id => !tab.hiddenSections.includes(id));

    try {
      ui.toastInfo('正在生成 Word 文档…');
      const blob = await buildResumeDocx(applyHiddenSections(tab.data, tab.hiddenSections), order);
      const fileName = sanitizeFilename(tab.data.name || tab.title) + '-简历.docx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      ui.toastSuccess('Word 文档已导出');
      return true;
    } catch (e: unknown) {
      console.error('DOCX 导出失败', e);
      ui.toastError('Word 导出失败: ' + toErrorMessage(e));
      return false;
    }
  }

  return { exportDocx };
}
