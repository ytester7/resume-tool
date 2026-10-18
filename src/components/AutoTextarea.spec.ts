import { describe, it, expect, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import AutoTextarea from './AutoTextarea.vue';

/** jsdom 里 scrollHeight 恒为 0，这里给单个节点打桩以便验证高度联动 */
function stubScrollHeight(wrapper: VueWrapper, value: number): HTMLTextAreaElement {
  const el = wrapper.element as HTMLTextAreaElement;
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => value });
  return el;
}

let wrapper: VueWrapper | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe('AutoTextarea', () => {
  it('渲染 textarea 并透传 placeholder / rows / aria-label', () => {
    wrapper = mount(AutoTextarea, {
      props: { modelValue: '内容', placeholder: '请输入', ariaLabel: '工作内容' },
    });
    const el = wrapper.element as HTMLTextAreaElement;
    expect(el.tagName).toBe('TEXTAREA');
    expect(el.value).toBe('内容');
    expect(el.getAttribute('placeholder')).toBe('请输入');
    expect(el.getAttribute('rows')).toBe('1');
    expect(el.getAttribute('aria-label')).toBe('工作内容');
  });

  it('未传 aria-label 时不渲染空属性', () => {
    wrapper = mount(AutoTextarea, { props: { modelValue: '' } });
    expect((wrapper.element as HTMLTextAreaElement).hasAttribute('aria-label')).toBe(false);
  });

  it('输入时向外抛出 update:modelValue', async () => {
    wrapper = mount(AutoTextarea, { props: { modelValue: '' } });
    const el = wrapper.element as HTMLTextAreaElement;
    el.value = '新内容';
    await wrapper.trigger('input');
    expect(wrapper.emitted('update:modelValue')).toEqual([['新内容']]);
  });

  it('外部值变化后按 scrollHeight 重新撑高', async () => {
    wrapper = mount(AutoTextarea, { props: { modelValue: 'a' } });
    const el = stubScrollHeight(wrapper, 68);

    await wrapper.setProps({ modelValue: 'a\nb\nc' });
    await nextTick();

    expect(el.style.height).toBe('68px');
  });

  it('内容变短时高度跟着缩回', async () => {
    wrapper = mount(AutoTextarea, { props: { modelValue: 'a\nb\nc' } });
    let height = 68;
    const el = wrapper.element as HTMLTextAreaElement;
    Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => height });

    await wrapper.setProps({ modelValue: 'a\nb\nc\nd' });
    await nextTick();
    expect(el.style.height).toBe('68px');

    height = 22;
    await wrapper.setProps({ modelValue: 'a' });
    await nextTick();
    expect(el.style.height).toBe('22px');
  });

  it('不可见时（scrollHeight 为 0）不把高度压成 0px', async () => {
    wrapper = mount(AutoTextarea, { props: { modelValue: 'a' } });
    const el = stubScrollHeight(wrapper, 0);

    await wrapper.setProps({ modelValue: 'ab' });
    await nextTick();

    expect(el.style.height).not.toBe('0px');
  });
});
