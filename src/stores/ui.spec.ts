import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from './ui';

describe('useUiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始状态 toasts 为空，confirmState 不可见', () => {
    const ui = useUiStore();
    expect(ui.toasts).toEqual([]);
    expect(ui.confirmState.visible).toBe(false);
  });

  it('toast 添加通知项', () => {
    const ui = useUiStore();
    ui.toast('消息', 'info');
    expect(ui.toasts.length).toBe(1);
    expect(ui.toasts[0].message).toBe('消息');
    expect(ui.toasts[0].type).toBe('info');
  });

  it('toastSuccess/toastError/toastInfo/toastWarning 各自设置类型', () => {
    const ui = useUiStore();
    ui.toastSuccess('a');
    ui.toastError('b');
    ui.toastInfo('c');
    ui.toastWarning('d');
    expect(ui.toasts.map(t => t.type)).toEqual(['success', 'error', 'info', 'warning']);
  });

  it('toast 到期后自动移除', () => {
    const ui = useUiStore();
    ui.toast('临时', 'info', 3000);
    expect(ui.toasts.length).toBe(1);
    vi.advanceTimersByTime(3100);
    expect(ui.toasts.length).toBe(0);
  });

  it('dismissToast 手动移除指定通知', () => {
    const ui = useUiStore();
    ui.toast('a', 'info', 60000);
    ui.toast('b', 'info', 60000);
    const firstId = ui.toasts[0].id;
    ui.dismissToast(firstId);
    expect(ui.toasts.length).toBe(1);
    expect(ui.toasts[0].message).toBe('b');
  });

  it('dismissToast 不存在的 id 不报错', () => {
    const ui = useUiStore();
    expect(() => ui.dismissToast(99999)).not.toThrow();
    expect(ui.toasts.length).toBe(0);
  });

  it('confirmDialog 显示对话框并返回 Promise', async () => {
    const ui = useUiStore();
    const promise = ui.confirmDialog({
      title: '确认',
      message: '确定删除吗？',
      actions: ['确定', '取消'],
    });
    expect(ui.confirmState.visible).toBe(true);
    expect(ui.confirmState.options.title).toBe('确认');
    expect(ui.confirmState.options.actions).toEqual(['确定', '取消']);

    ui.resolveConfirm('确定');
    const result = await promise;
    expect(result).toBe('确定');
    expect(ui.confirmState.visible).toBe(false);
  });

  it('resolveConfirm(null) 表示取消', async () => {
    const ui = useUiStore();
    const promise = ui.confirmDialog({
      title: '确认',
      message: 'msg',
      actions: ['ok'],
    });
    ui.resolveConfirm(null);
    const result = await promise;
    expect(result).toBe(null);
    expect(ui.confirmState.visible).toBe(false);
  });

  it('resolveConfirm 后 confirmState 重置', async () => {
    const ui = useUiStore();
    const promise = ui.confirmDialog({
      title: 'T',
      message: 'M',
      actions: ['A'],
    });
    ui.resolveConfirm('A');
    await promise;
    expect(ui.confirmState.options.title).toBe('');
    expect(ui.confirmState.options.actions).toEqual([]);
    expect(ui.confirmState.resolver).toBe(null);
  });
});
