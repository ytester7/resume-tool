import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import JdMatchSection from './JdMatchSection.vue';
import { useTabsStore } from '@/stores/tabs';
import { SAMPLE_RESUMES } from '@/data/samples';

describe('JdMatchSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const tabs = useTabsStore();
    tabs.open({ data: SAMPLE_RESUMES[0].data });
  });

  it('未粘贴 JD 时只显示引导文案', () => {
    const wrapper = mount(JdMatchSection);
    expect(wrapper.find('.jd-sub').text()).toContain('粘贴 JD');
    expect(wrapper.find('.jd-score').exists()).toBe(false);
  });

  it('分析后显示匹配分与缺失关键词', async () => {
    const wrapper = mount(JdMatchSection);
    await wrapper.find('.jd-header').trigger('click');
    await wrapper.find('.jd-input').setValue('熟悉 Python、pytest、Kubernetes、Docker');
    await wrapper.find('.jd-btn.primary').trigger('click');

    expect(wrapper.find('.jd-score').text()).toBe('50');
    const missing = wrapper.findAll('.chip.missing').map(c => c.text());
    expect(missing).toContain('Kubernetes');
    expect(missing).toContain('Docker');
    expect(useTabsStore().active?.targetJd).toContain('Kubernetes');
  });

  it('清空后移除分析结果', async () => {
    const wrapper = mount(JdMatchSection);
    await wrapper.find('.jd-header').trigger('click');
    await wrapper.find('.jd-input').setValue('Python pytest');
    await wrapper.find('.jd-btn.primary').trigger('click');
    expect(wrapper.find('.jd-score').exists()).toBe(true);

    await wrapper.findAll('.jd-btn')[1].trigger('click');
    expect(wrapper.find('.jd-score').exists()).toBe(false);
    expect(useTabsStore().active?.targetJd).toBe('');
  });
});
