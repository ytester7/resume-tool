import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSectionOrder } from './useSectionOrder';
import { useTabsStore } from '@/stores/tabs';

describe('useSectionOrder', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('默认使用模板默认顺序', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const { order, mutable } = useSectionOrder();
    expect(mutable.value).toBe(true);
    expect(order.value).toEqual(['summary','skills','experience','projects','education','evaluation']);
  });

  it('用户自定义顺序优先', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setSectionOrder(['skills', 'summary']);
    const { order } = useSectionOrder();
    expect(order.value).toEqual(['skills', 'summary']);
  });

  it('不支持区块顺序的模板 mutable 为 false', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', template: 'modern' });
    const { mutable, order } = useSectionOrder();
    expect(mutable.value).toBe(false);
    expect(order.value).toEqual([]);
  });

  it('resetToDefault 设置 sectionOrder 为 null', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setSectionOrder(['skills', 'summary']);
    const { resetToDefault } = useSectionOrder();
    resetToDefault();
    expect(tabs.active?.sectionOrder).toBe(null);
  });

  it('切换到不支持顺序的模板，sectionOrder 字段保留但 order 返回空', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setSectionOrder(['skills', 'summary']);
    tabs.setTemplate('modern');
    const { order, mutable } = useSectionOrder();
    expect(mutable.value).toBe(false);
    expect(order.value).toEqual([]);
    expect(tabs.active?.sectionOrder).toEqual(['skills', 'summary']);
  });

  it('切回支持顺序的模板，沿用之前的自定义顺序', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setSectionOrder(['skills', 'summary']);
    tabs.setTemplate('modern');
    tabs.setTemplate('classic');
    const { order, mutable } = useSectionOrder();
    expect(mutable.value).toBe(true);
    expect(order.value).toEqual(['skills', 'summary']);
  });

  it('无 active Tab 时返回安全默认值', () => {
    useTabsStore();
    const { order, mutable } = useSectionOrder();
    expect(mutable.value).toBe(false);
    expect(order.value).toEqual([]);
  });
});
