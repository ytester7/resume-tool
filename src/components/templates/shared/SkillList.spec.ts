import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SkillList from './SkillList.vue';
import type { Skill } from '@/types/resume';

const skills: Skill[] = [
  { id: '1', category: '自动化', items: 'Selenium, Playwright', level: '精通' },
  { id: '2', category: '接口', items: 'Postman', level: '熟练' },
];

describe('SkillList', () => {
  it('默认 list variant 渲染分类行', () => {
    const wrapper = mount(SkillList, { props: { skills } });
    expect(wrapper.findAll('.skill-row')).toHaveLength(2);
    expect(wrapper.text()).toContain('自动化');
    expect(wrapper.text()).toContain('Selenium, Playwright');
  });

  it('compact variant 渲染标签', () => {
    const wrapper = mount(SkillList, { props: { skills, variant: 'compact' } });
    expect(wrapper.findAll('.skill-tag')).toHaveLength(2);
  });

  it('table variant 渲染表格行', () => {
    const wrapper = mount(SkillList, { props: { skills, variant: 'table' } });
    expect(wrapper.findAll('tr')).toHaveLength(2);
  });

  it('bars variant 渲染进度条', () => {
    const wrapper = mount(SkillList, { props: { skills, variant: 'bars' } });
    expect(wrapper.findAll('.skill-bar-row')).toHaveLength(2);
    const fills = wrapper.findAll('.skill-bar-fill');
    expect(fills[0].attributes('style')).toContain('100%');
    expect(fills[1].attributes('style')).toContain('70%');
  });

  it('空数组不渲染', () => {
    const wrapper = mount(SkillList, { props: { skills: [] } });
    expect(wrapper.find('.skill-list').exists()).toBe(false);
  });
});
