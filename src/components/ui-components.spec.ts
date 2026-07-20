import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ConfirmDialog from './ConfirmDialog.vue';
import Toast from './Toast.vue';
import { useUiStore } from '@/stores/ui';

describe('ConfirmDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('confirmState 不可见时不渲染', () => {
    const wrapper = mount(ConfirmDialog);
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false);
  });

  it('confirmState 可见时渲染标题与按钮', async () => {
    const ui = useUiStore();
    const promise = ui.confirmDialog({
      title: '测试标题',
      message: '测试消息',
      actions: ['确定', '取消'],
    });
    const wrapper = mount(ConfirmDialog);
    expect(wrapper.find('.confirm-title').text()).toBe('测试标题');
    expect(wrapper.find('.confirm-message').text()).toBe('测试消息');
    const btns = wrapper.findAll('.confirm-btn');
    expect(btns).toHaveLength(2);
    expect(btns[0].text()).toBe('确定');
    expect(btns[0].classes()).toContain('primary');
    expect(btns[1].classes()).toContain('secondary');

    btns[0].trigger('click');
    const result = await promise;
    expect(result).toBe('确定');
  });

  it('点击 backdrop 返回 null', async () => {
    const ui = useUiStore();
    const promise = ui.confirmDialog({
      title: 'T', message: 'M', actions: ['ok'],
    });
    const wrapper = mount(ConfirmDialog);
    await wrapper.find('.confirm-backdrop').trigger('click');
    const result = await promise;
    expect(result).toBe(null);
  });
});

describe('Toast', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('无 toast 时不渲染项', () => {
    const wrapper = mount(Toast);
    expect(wrapper.findAll('.toast-item')).toHaveLength(0);
  });

  it('有 toast 时按类型渲染', () => {
    const ui = useUiStore();
    ui.toastSuccess('成功');
    ui.toastError('失败');
    ui.toastInfo('信息');
    ui.toastWarning('警告');
    const wrapper = mount(Toast);
    const items = wrapper.findAll('.toast-item');
    expect(items).toHaveLength(4);
    expect(items[0].classes()).toContain('toast-success');
    expect(items[1].classes()).toContain('toast-error');
    expect(items[2].classes()).toContain('toast-info');
    expect(items[3].classes()).toContain('toast-warning');
    expect(items[0].text()).toBe('成功');
  });

  it('点击 toast 项触发 dismiss', async () => {
    const ui = useUiStore();
    ui.toast('可关闭', 'info', 60000);
    const wrapper = mount(Toast);
    expect(wrapper.findAll('.toast-item')).toHaveLength(1);
    await wrapper.find('.toast-item').trigger('click');
    expect(ui.toasts).toHaveLength(0);
  });
});
