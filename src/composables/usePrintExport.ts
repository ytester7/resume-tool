import { useUiStore } from '@/stores/ui';

/**
 * 浏览器打印通道。
 *
 * 相比 html2canvas 光栅化，浏览器原生打印输出的是矢量文字，
 * 可选中、可复制、ATS 系统能正常解析，是简历导出的首选方式。
 */
export function usePrintExport() {
  const ui = useUiStore();

  function printResume(): boolean {
    if (!document.querySelector('.preview-canvas')) {
      ui.toastError('预览区未就绪，请稍后再试');
      return false;
    }
    ui.toast('在打印窗口选择「另存为 PDF」即可导出可选中文字的 PDF', 'info', 5000);
    window.print();
    return true;
  }

  return { printResume };
}
