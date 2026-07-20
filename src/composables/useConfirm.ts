import { useUiStore } from '@/stores/ui';
import type { ConfirmOptions } from '@/stores/ui';

export function useConfirm() {
  const ui = useUiStore();

  function confirm(options: ConfirmOptions): Promise<string | null> {
    return ui.confirmDialog(options);
  }

  return { confirm };
}
