import { onMounted, onUnmounted } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { TEMPLATE_LIST } from '@/types/resume';

export interface ShortcutHandlers {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  /** 打印 / 另存为 PDF（文本可选中） */
  onPrintPdf: () => void;
  /** 图片 PDF（兼容模式） */
  onExportPdf: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const tabs = useTabsStore();
  const ui = useUiStore();

  function isEditableTarget(t: EventTarget | null): boolean {
    const el = t as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function onKeydown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    // Ctrl+S 保存
    if (ctrl && !e.shiftKey && key === 's') {
      e.preventDefault();
      handlers.onSave();
      return;
    }
    // Ctrl+Shift+S 另存为
    if (ctrl && e.shiftKey && key === 's') {
      e.preventDefault();
      handlers.onSaveAs();
      return;
    }
    // Ctrl+O 打开
    if (ctrl && !e.shiftKey && key === 'o') {
      e.preventDefault();
      handlers.onOpen();
      return;
    }
    // Ctrl+P 打印 / 另存为 PDF（浏览器原生打印，文字可选中）
    if (ctrl && !e.shiftKey && key === 'p') {
      e.preventDefault();
      handlers.onPrintPdf();
      return;
    }
    // Ctrl+Shift+N 新建
    if (ctrl && e.shiftKey && key === 'n') {
      e.preventDefault();
      handlers.onNew();
      return;
    }
    // 撤销 / 重做：输入框内交给浏览器原生撤销，避免打断正常输入
    if (ctrl && !isEditableTarget(e.target)) {
      if (e.shiftKey && key === 'z') {
        e.preventDefault();
        handlers.onRedo();
        return;
      }
      if (!e.shiftKey && key === 'z') {
        e.preventDefault();
        handlers.onUndo();
        return;
      }
      if (!e.shiftKey && key === 'y') {
        e.preventDefault();
        handlers.onRedo();
        return;
      }
    }

    // [ ] 切换模板（仅在非编辑区生效）
    if (!isEditableTarget(e.target) && !ctrl && !e.altKey && tabs.active) {
      const currentIdx = TEMPLATE_LIST.findIndex(t => t.name === tabs.active!.template);
      if (e.key === '[') {
        e.preventDefault();
        const prev = (currentIdx - 1 + TEMPLATE_LIST.length) % TEMPLATE_LIST.length;
        tabs.setTemplate(TEMPLATE_LIST[prev].name);
        ui.toastInfo(`切换到 ${TEMPLATE_LIST[prev].displayName} 模板`);
      } else if (e.key === ']') {
        e.preventDefault();
        const next = (currentIdx + 1) % TEMPLATE_LIST.length;
        tabs.setTemplate(TEMPLATE_LIST[next].name);
        ui.toastInfo(`切换到 ${TEMPLATE_LIST[next].displayName} 模板`);
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}
