import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ClassicLayout from './ClassicLayout.vue';
import { defaultResumeData } from '@/types/resume';
import type { SectionKey } from '@/types/resume';

const sampleData = {
  ...defaultResumeData(),
  name: '张三',
  title: '测试工程师',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  summary: '5年测试经验',
  skills: [{ id: '1', category: '自动化', items: 'Selenium', level: '精通' as const }],
  experience: [{
    id: '1', company: '腾讯', role: '测试工程师', time: '2020-2023',
    description: '负责测试', achievement: '提升效率50%', items: ['搭建框架'],
  }],
};

const defaultOrder: SectionKey[] = ['summary','skills','experience','projects','education','evaluation'];

describe('ClassicLayout', () => {
  it('渲染姓名与职位', () => {
    const wrapper = mount(ClassicLayout, {
      props: { data: sampleData, sectionOrder: defaultOrder },
    });
    expect(wrapper.find('.resume-name').text()).toBe('张三');
    expect(wrapper.find('.resume-title').text()).toBe('测试工程师');
  });

  it('按 sectionOrder 顺序渲染区块', () => {
    const wrapper = mount(ClassicLayout, {
      props: { data: sampleData, sectionOrder: ['skills', 'summary'] as SectionKey[] },
    });
    const sections = wrapper.findAll('.resume-section');
    expect(sections[0].find('.section-title').text()).toBe('专业技能');
    expect(sections[1].find('.section-title').text()).toBe('专业概述');
  });

  it('空区块不渲染', () => {
    const wrapper = mount(ClassicLayout, {
      props: { data: sampleData, sectionOrder: defaultOrder },
    });
    const titles = wrapper.findAll('.section-title').map(t => t.text());
    expect(titles).not.toContain('项目经历');
    expect(titles).not.toContain('教育背景');
    expect(titles).not.toContain('自我评价');
  });

  it('空 sectionOrder 渲染 0 个区块', () => {
    const wrapper = mount(ClassicLayout, {
      props: { data: sampleData, sectionOrder: [] },
    });
    expect(wrapper.findAll('.resume-section')).toHaveLength(0);
  });
});
