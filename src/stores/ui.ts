import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  actions: string[];
}

let toastId = 0;

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([]);
  const confirmState = ref<{
    visible: boolean;
    options: ConfirmOptions;
    resolver: ((action: string | null) => void) | null;
  }>({
    visible: false,
    options: { title: '', message: '', actions: [] },
    resolver: null,
  });

  function toast(message: string, type: ToastItem['type'] = 'info', duration = 3000): void {
    const id = ++toastId;
    toasts.value.push({ id, type, message });
    setTimeout(() => dismissToast(id), duration);
  }

  function toastSuccess(message: string): void { toast(message, 'success'); }
  function toastError(message: string): void { toast(message, 'error'); }
  function toastInfo(message: string): void { toast(message, 'info'); }
  function toastWarning(message: string): void { toast(message, 'warning'); }

  function dismissToast(id: number): void {
    const idx = toasts.value.findIndex(t => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  function confirmDialog(options: ConfirmOptions): Promise<string | null> {
    return new Promise((resolve) => {
      confirmState.value = { visible: true, options, resolver: resolve };
    });
  }

  function resolveConfirm(action: string | null): void {
    confirmState.value.resolver?.(action);
    confirmState.value = {
      visible: false,
      options: { title: '', message: '', actions: [] },
      resolver: null,
    };
  }

  return {
    toasts, confirmState,
    toast, toastSuccess, toastError, toastInfo, toastWarning,
    dismissToast, confirmDialog, resolveConfirm,
  };
});
