import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import SkillsSection from './SkillsSection.vue';
import { useTabsStore } from '@/stores/tabs';
import { defaultResumeData } from '@/types/resume';

describe('SkillsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('空技能列表显示添加按钮', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(SkillsSection);
    expect(wrapper.find('.add-btn').text()).toContain('添加技能');
  });

  it('点击添加按钮调用 addSkill', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(SkillsSection);
    await wrapper.find('.add-btn').trigger('click');
    expect(tabs.active?.data.skills.length).toBe(1);
  });

  it('渲染已有技能行', () => {
    const tabs = useTabsStore();
    tabs.open({
      title: 'A',
      data: {
        ...defaultResumeData(),
        skills: [
          { id: '1', category: '自动化', items: 'Selenium', level: '精通' },
        ],
      },
    });
    const wrapper = mount(SkillsSection);
    expect(wrapper.findAll('.skill-edit-row')).toHaveLength(1);
  });
});
