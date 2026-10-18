import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Toolbar from './Toolbar.vue';

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onPrintPdf: vi.fn(),
    onExportPdf: vi.fn(),
    onExportDocx: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    canUndo: false,
    canRedo: false,
    hasTab: true,
    ...overrides,
  };
}

describe('Toolbar', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('没有打开简历时禁用保存与导出', () => {
    const wrapper = mount(Toolbar, { props: makeProps({ hasTab: false }) });
    const saveBtn = wrapper.find('button[title^="保存"]');
    expect(saveBtn.attributes('disabled')).toBeDefined();
    expect(wrapper.find('.export-menu').exists()).toBe(false);
    expect(wrapper.find('button[title="请先新建或打开简历"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('导出菜单包含三种导出方式并回调对应 handler', async () => {
    const props = makeProps();
    const wrapper = mount(Toolbar, { props });
    expect(wrapper.findAll('.export-item')).toHaveLength(3);

    await wrapper.findAll('.export-item')[0].trigger('click');
    expect(props.onPrintPdf).toHaveBeenCalled();

    await wrapper.findAll('.export-item')[1].trigger('click');
    expect(props.onExportDocx).toHaveBeenCalled();

    await wrapper.findAll('.export-item')[2].trigger('click');
    expect(props.onExportPdf).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('撤销/重做按钮根据状态禁用', () => {
    const wrapper = mount(Toolbar, { props: makeProps() });
    expect(wrapper.find('button[aria-label="撤销"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button[aria-label="重做"]').attributes('disabled')).toBeDefined();
    wrapper.unmount();

    const enabled = mount(Toolbar, { props: makeProps({ canUndo: true, canRedo: true }) });
    expect(enabled.find('button[aria-label="撤销"]').attributes('disabled')).toBeUndefined();
    expect(enabled.find('button[aria-label="重做"]').attributes('disabled')).toBeUndefined();
    enabled.unmount();
  });
});
