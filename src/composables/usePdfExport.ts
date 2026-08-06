import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { sanitizeFilename } from '@/utils/sanitize';
import { toErrorMessage } from '@/utils/errors';

export function usePdfExport() {
  const tabs = useTabsStore();
  const ui = useUiStore();

  async function exportActiveToPdf(element: HTMLElement): Promise<boolean> {
    const tab = tabs.active;
    if (!tab) {
      ui.toastWarning('没有打开的简历');
      return false;
    }

    try {
      // 动态导入避免首屏加载 html2pdf
      const html2pdf = (await import('html2pdf.js')).default;

      const filename = sanitizeFilename(tab.data.name || tab.title) + '-简历.pdf';

      const options = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(options).from(element).save();
      ui.toastSuccess('PDF 导出成功');
      return true;
    } catch (e: unknown) {
      console.error('PDF 导出失败', e);
      ui.toastError('PDF 导出失败: ' + toErrorMessage(e));
      return false;
    }
  }

  return { exportActiveToPdf };
}
