import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DraggableList from './DraggableList.vue';

interface Item { id: string; label: string; }

const items: Item[] = [
  { id: '1', label: 'A' },
  { id: '2', label: 'B' },
  { id: '3', label: 'C' },
];

describe('DraggableList', () => {
  it('渲染所有项', () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: items },
      slots: {
        item: '<div class="item">x</div>',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('空数组不报错', () => {
    const wrapper = mount(DraggableList, {
      props: { modelValue: [] },
      slots: { item: '<div />' },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
