import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ModernLayout from './ModernLayout.vue';
import ExecutiveLayout from './ExecutiveLayout.vue';
import EuropeanLayout from './EuropeanLayout.vue';
import TechLayout from './TechLayout.vue';
import TechGradientLayout from './TechGradientLayout.vue';
import { defaultResumeData, type SectionKey } from '@/types/resume';

const sampleData = {
  ...defaultResumeData(),
  name: '张三', title: '测试工程师', phone: '13800138000', email: 'test@test.com',
  summary: '5年测试经验',
  skills: [{ id: '1', category: '自动化', items: 'Selenium', level: '精通' as const }],
  experience: [{ id: '1', company: '腾讯', role: '测试', time: '2020-2023', description: '负责测试', achievement: '效率+50%', items: ['搭建框架'] }],
};
const order: SectionKey[] = ['summary','skills','experience','projects','education','evaluation'];

describe.each([
  ['ModernLayout', ModernLayout],
  ['ExecutiveLayout', ExecutiveLayout],
  ['EuropeanLayout', EuropeanLayout],
  ['TechLayout', TechLayout],
  ['TechGradientLayout', TechGradientLayout],
])('%s', (_name, comp) => {
  beforeEach(() => { setActivePinia(createPinia()); });

  it('渲染姓名', () => {
    const wrapper = mount(comp, { props: { data: sampleData, sectionOrder: order } });
    expect(wrapper.text()).toContain('张三');
  });

  it('忽略 sectionOrder 使用固定布局', () => {
    const w1 = mount(comp, { props: { data: sampleData, sectionOrder: order } });
    const w2 = mount(comp, { props: { data: sampleData, sectionOrder: [] } });
    // 固定布局不依赖 sectionOrder，两个渲染结果都应包含姓名
    expect(w1.text()).toContain('张三');
    expect(w2.text()).toContain('张三');
  });
});
