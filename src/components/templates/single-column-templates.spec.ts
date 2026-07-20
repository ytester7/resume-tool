import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MinimalLayout from './MinimalLayout.vue';
import GradientLayout from './GradientLayout.vue';
import CreativeLayout from './CreativeLayout.vue';
import DataDrivenLayout from './DataDrivenLayout.vue';
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
  ['MinimalLayout', MinimalLayout],
  ['GradientLayout', GradientLayout],
  ['CreativeLayout', CreativeLayout],
  ['DataDrivenLayout', DataDrivenLayout],
])('%s', (_name, comp) => {
  beforeEach(() => { setActivePinia(createPinia()); });

  it('渲染姓名', () => {
    const wrapper = mount(comp, { props: { data: sampleData, sectionOrder: order } });
    expect(wrapper.text()).toContain('张三');
  });

  it('按 sectionOrder 渲染区块', () => {
    const wrapper = mount(comp, { props: { data: sampleData, sectionOrder: ['skills', 'summary'] } });
    const sections = wrapper.findAll('.resume-section');
    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  it('空 sectionOrder 渲染 0 个区块', () => {
    const wrapper = mount(comp, { props: { data: sampleData, sectionOrder: [] } });
    expect(wrapper.findAll('.resume-section')).toHaveLength(0);
  });
});
