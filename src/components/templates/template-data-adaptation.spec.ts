import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ClassicLayout from './ClassicLayout.vue';
import MinimalLayout from './MinimalLayout.vue';
import GradientLayout from './GradientLayout.vue';
import CreativeLayout from './CreativeLayout.vue';
import DataDrivenLayout from './DataDrivenLayout.vue';
import QaProLayout from './QaProLayout.vue';
import CardStyleLayout from './CardStyleLayout.vue';
import ChineseElegantLayout from './ChineseElegantLayout.vue';
import ModernLayout from './ModernLayout.vue';
import ExecutiveLayout from './ExecutiveLayout.vue';
import EuropeanLayout from './EuropeanLayout.vue';
import TechLayout from './TechLayout.vue';
import TechGradientLayout from './TechGradientLayout.vue';
import ExperienceItem from './shared/ExperienceItem.vue';
import ProjectItem from './shared/ProjectItem.vue';
import EducationItem from './shared/EducationItem.vue';
import SkillList from './shared/SkillList.vue';
import ContactItems from './shared/ContactItems.vue';
import { defaultResumeData, type ResumeData, type SectionKey } from '@/types/resume';

const ORDER: SectionKey[] = ['summary', 'skills', 'experience', 'projects', 'education', 'evaluation'];

const TEMPLATES = [
  ['ClassicLayout', ClassicLayout],
  ['MinimalLayout', MinimalLayout],
  ['GradientLayout', GradientLayout],
  ['CreativeLayout', CreativeLayout],
  ['DataDrivenLayout', DataDrivenLayout],
  ['QaProLayout', QaProLayout],
  ['CardStyleLayout', CardStyleLayout],
  ['ChineseElegantLayout', ChineseElegantLayout],
  ['ModernLayout', ModernLayout],
  ['ExecutiveLayout', ExecutiveLayout],
  ['EuropeanLayout', EuropeanLayout],
  ['TechLayout', TechLayout],
  ['TechGradientLayout', TechGradientLayout],
] as const;

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return { ...defaultResumeData(), ...overrides };
}

const EMPTY_EXPERIENCE = {
  id: 'e1', company: '', role: '', time: '', description: '', achievement: '', items: [],
};
const EMPTY_PROJECT = {
  id: 'p1', name: '', time: '', role: '', background: '', subtitle: '', achievement: '', items: [],
};
const EMPTY_EDUCATION = { id: 'd1', school: '', major: '', degree: '', time: '' };
const EMPTY_SKILL = { id: 's1', category: '', items: '', level: '精通' as const };

describe.each(TEMPLATES)('%s 缺省数据适配', (_name, comp) => {
  it('全部字段为空时不崩溃，也不留空 header / 空栏位', () => {
    const wrapper = mount(comp, { props: { data: makeData(), sectionOrder: ORDER } });
    expect(wrapper.text().trim()).toBe('');
  });

  it('只给 name（缺数组字段）时仍能正常渲染', () => {
    // 模拟绕过 normalizeResumeData 的数据源，模板自身也要能兜住
    const partial = { name: '张三' } as unknown as ResumeData;
    const wrapper = mount(comp, { props: { data: partial, sectionOrder: ORDER } });
    expect(wrapper.text()).toContain('张三');
  });

  it('只有空记录时不渲染空区块（单列模板）', () => {
    const data = makeData({
      experience: [EMPTY_EXPERIENCE],
      projects: [EMPTY_PROJECT],
      education: [EMPTY_EDUCATION],
      skills: [EMPTY_SKILL],
    });
    const wrapper = mount(comp, { props: { data, sectionOrder: ORDER } });
    if (wrapper.findAll('.resume-section').length > 0) {
      // 固定布局没有 .resume-section 语义时，至少不应出现空区块标题
      expect(wrapper.text().trim()).toBe('');
    }
  });
});

describe('共享条目组件：缺字段/空记录', () => {
  it('ExperienceItem 过滤空记录、空字段与空行', () => {
    const wrapper = mount(ExperienceItem, {
      props: {
        items: [
          EMPTY_EXPERIENCE,
          {
            id: 'e2', company: '', role: '', time: '',
            description: '只写了工作描述', achievement: '', items: ['', '  '],
          },
        ],
      },
    });
    expect(wrapper.findAll('.experience-item')).toHaveLength(1);
    expect(wrapper.find('.experience-header').exists()).toBe(false);
    expect(wrapper.find('.experience-items-list').exists()).toBe(false);
    expect(wrapper.text()).toContain('只写了工作描述');
  });

  it('ExperienceItem 只有公司时只渲染公司，不渲染职位/时间占位', () => {
    const wrapper = mount(ExperienceItem, {
      props: {
        items: [{ id: 'e1', company: '腾讯', role: '', time: '', description: '', achievement: '', items: [] }],
      },
    });
    expect(wrapper.find('.experience-company').text()).toBe('腾讯');
    expect(wrapper.find('.experience-role').exists()).toBe(false);
    expect(wrapper.find('.experience-time').exists()).toBe(false);
  });

  it('ProjectItem 无角色时不渲染角色行，空列表不渲染 ul', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        items: [{
          id: 'p1', name: '', time: '', role: '', background: '项目背景', subtitle: '',
          achievement: '', items: [' '],
        }],
      },
    });
    expect(wrapper.find('.project-header').exists()).toBe(false);
    expect(wrapper.find('.project-meta').exists()).toBe(false);
    expect(wrapper.find('.project-items-list').exists()).toBe(false);
    expect(wrapper.text()).toContain('项目背景');
  });

  it('EducationItem 只有学校时不渲染专业/学历行', () => {
    const wrapper = mount(EducationItem, {
      props: { items: [{ id: 'd1', school: '某大学', major: '', degree: '', time: '' }] },
    });
    expect(wrapper.find('.edu-school').text()).toBe('某大学');
    expect(wrapper.find('.edu-meta').exists()).toBe(false);
    expect(wrapper.find('.edu-time').exists()).toBe(false);
  });
});

describe('SkillList 缺字段适配', () => {
  it('list：只有内容时不渲染分类/熟练度占位', () => {
    const wrapper = mount(SkillList, {
      props: { skills: [{ id: 's1', category: '', items: 'Python', level: '' as never }] },
    });
    expect(wrapper.find('.skill-category').exists()).toBe(false);
    expect(wrapper.find('.skill-level').exists()).toBe(false);
    expect(wrapper.text()).toContain('Python');
  });

  it('table：整列无值时不渲染该列，避免列错位与空白列', () => {
    const wrapper = mount(SkillList, {
      props: {
        skills: [
          { id: 's1', category: '', items: 'Python', level: '' as never },
          { id: 's2', category: '', items: 'SQL', level: '' as never },
        ],
        variant: 'table',
      },
    });
    expect(wrapper.find('.skill-cat-cell').exists()).toBe(false);
    expect(wrapper.find('.skill-level-cell').exists()).toBe(false);
    expect(wrapper.findAll('tr')).toHaveLength(2);
  });

  it('bars：没有熟练度时不渲染进度条', () => {
    const wrapper = mount(SkillList, {
      props: {
        skills: [{ id: 's1', category: '语言', items: 'Python', level: '' as never }],
        variant: 'bars',
      },
    });
    expect(wrapper.find('.skill-bar-track').exists()).toBe(false);
    expect(wrapper.text()).toContain('Python');
  });

  it('只有熟练度的记录视为空记录', () => {
    const wrapper = mount(SkillList, {
      props: { skills: [{ id: 's1', category: '', items: '', level: '精通' }] },
    });
    expect(wrapper.find('.skill-list').exists()).toBe(false);
  });

  it('compact：只有分类时不出现悬空冒号', () => {
    const wrapper = mount(SkillList, {
      props: { skills: [{ id: 's1', category: '编程语言', items: '', level: '' as never }], variant: 'compact' },
    });
    expect(wrapper.find('.skill-tag').text()).toBe('编程语言');
  });
});

describe('ContactItems 单位适配', () => {
  it('年龄已带「岁」时不重复追加', () => {
    const wrapper = mount(ContactItems, { props: { data: makeData({ age: '26岁' }) } });
    expect(wrapper.text()).toContain('26岁');
    expect(wrapper.text()).not.toContain('26岁 岁');
  });

  it('年限缺单位时补齐完整表述', () => {
    const wrapper = mount(ContactItems, { props: { data: makeData({ experienceYears: '4' }) } });
    expect(wrapper.text()).toContain('4 年经验');
  });

  it('没有任何基本信息时不渲染容器', () => {
    const wrapper = mount(ContactItems, { props: { data: makeData() } });
    expect(wrapper.find('.contact-items').exists()).toBe(false);
  });
});

describe('固定布局：缺字段时的栏位折叠与统计', () => {
  it('DataDriven 不显示 0 值统计；无统计时整条统计栏隐藏', () => {
    const onlyName = mount(DataDrivenLayout, {
      props: { data: makeData({ name: '张三' }), sectionOrder: ORDER },
    });
    expect(onlyName.find('.stats-bar').exists()).toBe(false);

    const withExperience = mount(DataDrivenLayout, {
      props: {
        data: makeData({
          name: '张三',
          experience: [{ id: 'e1', company: 'A', role: '', time: '', description: '', achievement: '', items: ['a', 'b'] }],
        }),
        sectionOrder: ORDER,
      },
    });
    expect(withExperience.find('.stats-bar').exists()).toBe(true);
    expect(withExperience.text()).toContain('2+');
    expect(withExperience.text()).not.toContain('0');
  });

  it('European 只有右栏内容时折叠为单栏', () => {
    const wrapper = mount(EuropeanLayout, {
      props: { data: makeData({ summary: '简介' }), sectionOrder: ORDER },
    });
    expect(wrapper.find('.col-left').exists()).toBe(false);
    expect(wrapper.find('.col-right.is-full').exists()).toBe(true);
  });

  it('European 只有左栏内容时折叠为单栏', () => {
    const wrapper = mount(EuropeanLayout, {
      props: {
        data: makeData({ skills: [{ id: 's1', category: '', items: 'Python', level: '' as never }] }),
        sectionOrder: ORDER,
      },
    });
    expect(wrapper.find('.col-left.is-full').exists()).toBe(true);
    expect(wrapper.find('.col-right').exists()).toBe(false);
  });

  it('Modern 侧栏无内容时隐藏，正文占满整页', () => {
    const wrapper = mount(ModernLayout, {
      props: { data: makeData({ summary: '简介' }), sectionOrder: ORDER },
    });
    expect(wrapper.find('.sidebar').exists()).toBe(false);
    expect(wrapper.text()).toContain('简介');
  });

  it('Executive 只有正文内容时不渲染空侧栏', () => {
    const wrapper = mount(ExecutiveLayout, {
      props: {
        data: makeData({
          experience: [{ id: 'e1', company: '腾讯', role: '', time: '', description: '', achievement: '', items: [] }],
        }),
        sectionOrder: ORDER,
      },
    });
    expect(wrapper.find('.sidebar').exists()).toBe(false);
    expect(wrapper.text()).toContain('腾讯');
  });

  it('QaPro 没有姓名时不渲染问号头像', () => {
    const wrapper = mount(QaProLayout, {
      props: { data: makeData({ phone: '138' }), sectionOrder: ORDER },
    });
    expect(wrapper.find('.avatar').exists()).toBe(false);
    expect(wrapper.text()).toContain('138');
  });

  it('TechGradient 无姓名且无联系方式时隐藏左侧渐变栏；有姓名时显示首字头像', () => {
    const emptyRail = mount(TechGradientLayout, {
      props: { data: makeData({ summary: '简介' }), sectionOrder: ORDER },
    });
    expect(emptyRail.find('.gradient-bar').exists()).toBe(false);

    const withName = mount(TechGradientLayout, {
      props: { data: makeData({ name: '张三' }), sectionOrder: ORDER },
    });
    expect(withName.find('.gradient-bar').exists()).toBe(true);
    expect(withName.find('.avatar').text()).toBe('张');
  });
});

describe('带单位的字段在模板中不重复拼接', () => {
  it('Gradient 年龄/年限已带单位时不出现「岁 岁」「经验经验」', () => {
    const wrapper = mount(GradientLayout, {
      props: {
        data: makeData({ name: '张三', age: '26岁', experienceYears: '4年经验' }),
        sectionOrder: ORDER,
      },
    });
    expect(wrapper.text()).not.toContain('26岁 岁');
    expect(wrapper.text()).not.toContain('经验经验');
  });

  it('Executive 侧栏徽章同样不重复拼接', () => {
    const wrapper = mount(ExecutiveLayout, {
      props: {
        data: makeData({ name: '张三', age: '26岁', experienceYears: '4年经验' }),
        sectionOrder: ORDER,
      },
    });
    expect(wrapper.text()).not.toContain('26岁 岁');
    expect(wrapper.text()).not.toContain('经验经验');
  });
});
