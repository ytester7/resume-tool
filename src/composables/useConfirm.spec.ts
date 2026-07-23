import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useConfirm } from './useConfirm';
import { useUiStore } from '@/stores/ui';

describe('useConfirm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('confirm 调用 ui.confirmDialog 并返回 Promise', async () => {
    const { confirm } = useConfirm();
    const promise = confirm({
      title: '测试',
      message: '确认操作？',
      actions: ['确定', '取消'],
    });
    const ui = useUiStore();
    expect(ui.confirmState.visible).toBe(true);
    expect(ui.confirmState.options.title).toBe('测试');
    ui.resolveConfirm('确定');
    const result = await promise;
    expect(result).toBe('确定');
  });

  it('confirm 返回的 Promise resolve null 当用户取消', async () => {
    const { confirm } = useConfirm();
    const promise = confirm({
      title: '测试',
      message: 'msg',
      actions: ['ok'],
    });
    const ui = useUiStore();
    ui.resolveConfirm(null);
    const result = await promise;
    expect(result).toBe(null);
  });
});
