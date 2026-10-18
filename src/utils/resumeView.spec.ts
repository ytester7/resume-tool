import { describe, it, expect } from 'vitest';
import {
  asText,
  hasText,
  formatAge,
  formatExperience,
  visibleBullets,
  skillHasContent,
  experienceHasContent,
  projectHasContent,
  educationHasContent,
  evaluationHasContent,
  visibleSkills,
  visibleExperience,
  visibleProjects,
  visibleEducation,
  visibleEvaluation,
  countBullets,
  contactEntries,
  hasContactInfo,
  hasJobIntention,
  hasIdentity,
  sectionHasContent,
} from './resumeView';
import { defaultResumeData, type ResumeData, type SkillLevel } from '@/types/resume';

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return { ...defaultResumeData(), ...overrides };
}

describe('文本归一化', () => {
  it('asText: 字符串 trim、数字转字符串、空值/对象视为空', () => {
    expect(asText('  张三  ')).toBe('张三');
    expect(asText(26)).toBe('26');
    expect(asText(null)).toBe('');
    expect(asText(undefined)).toBe('');
    expect(asText({})).toBe('');
    expect(asText(true)).toBe('');
  });

  it('hasText: 纯空白为 false', () => {
    expect(hasText('  ')).toBe(false);
    expect(hasText('x')).toBe(true);
  });

  it('formatAge: 不重复「岁」', () => {
    expect(formatAge('26')).toBe('26 岁');
    expect(formatAge('26岁')).toBe('26岁');
    expect(formatAge(' 26 岁 ')).toBe('26 岁');
    expect(formatAge('')).toBe('');
  });

  it('formatExperience: 补齐「年经验」且不重复', () => {
    expect(formatExperience('4')).toBe('4 年经验');
    expect(formatExperience('4年')).toBe('4年经验');
    expect(formatExperience('4 年经验')).toBe('4 年经验');
    expect(formatExperience('6个月')).toBe('6个月经验');
    expect(formatExperience('')).toBe('');
  });

  it('visibleBullets: 支持数组与多行字符串，过滤空行', () => {
    expect(visibleBullets(['a', ' ', '', 'b'])).toEqual(['a', 'b']);
    expect(visibleBullets('a\r\n\r\n b ')).toEqual(['a', 'b']);
    expect(visibleBullets(undefined)).toEqual([]);
  });
});

describe('单条记录内容判断', () => {
  it('skillHasContent: 只有熟练度不算有效内容', () => {
    expect(skillHasContent({ id: '1', category: '', items: '', level: '精通' })).toBe(false);
    expect(skillHasContent({ id: '1', category: '', items: 'Python', level: '' as SkillLevel })).toBe(true);
  });

  it('experienceHasContent: 任一字段或 items 有值即可', () => {
    expect(experienceHasContent({ id: '1', company: '', role: '', time: '', description: '', achievement: '', items: [] })).toBe(false);
    expect(experienceHasContent({ id: '1', company: '', role: '', time: '', description: '负责测试', achievement: '', items: [] })).toBe(true);
    expect(experienceHasContent({ id: '1', company: '', role: '', time: '', description: '', achievement: '', items: ['', ' '] })).toBe(false);
    expect(experienceHasContent({ id: '1', company: '', role: '', time: '', description: '', achievement: '', items: ['搭建框架'] })).toBe(true);
  });

  it('projectHasContent / educationHasContent / evaluationHasContent', () => {
    expect(projectHasContent({ id: '1', name: '', time: '', role: '', background: '', subtitle: '', achievement: '', items: [] })).toBe(false);
    expect(projectHasContent({ id: '1', name: '项目', time: '', role: '', background: '', subtitle: '', achievement: '', items: [] })).toBe(true);
    expect(educationHasContent({ id: '1', school: '', major: '', degree: '', time: '' })).toBe(false);
    expect(educationHasContent({ id: '1', school: '', major: '', degree: '本科', time: '' })).toBe(true);
    expect(evaluationHasContent({ text: '  ' })).toBe(false);
    expect(evaluationHasContent({ text: '认真' })).toBe(true);
  });
});

describe('列表过滤', () => {
  it('visible* 过滤空记录并保留顺序', () => {
    const skills = visibleSkills([
      { id: '1', category: '', items: '', level: '精通' },
      { id: '2', category: '语言', items: 'TS', level: '熟练' },
    ]);
    expect(skills.map(s => s.id)).toEqual(['2']);

    const experience = visibleExperience([
      { id: '1', company: '', role: '', time: '', description: '', achievement: '', items: [] },
      { id: '2', company: 'A', role: '', time: '', description: '', achievement: '', items: [] },
    ]);
    expect(experience.map(e => e.id)).toEqual(['2']);

    expect(visibleProjects([{ id: '1', name: '', time: '', role: '', background: '', subtitle: '', achievement: '', items: [' '] }])).toEqual([]);
    expect(visibleEducation([{ id: '1', school: '', major: '', degree: '', time: '2020' }]).map(e => e.id)).toEqual(['1']);
    expect(visibleEvaluation([{ text: '' }, { text: 'ok' }])).toEqual([{ text: 'ok' }]);
  });

  it('visible* 对 undefined/null 返回空数组', () => {
    expect(visibleSkills(undefined)).toEqual([]);
    expect(visibleExperience(null)).toEqual([]);
    expect(visibleProjects(undefined)).toEqual([]);
    expect(visibleEducation(undefined)).toEqual([]);
    expect(visibleEvaluation(undefined)).toEqual([]);
  });

  it('countBullets 只统计有效条目里的非空 bullet', () => {
    expect(countBullets([
      { id: '1', company: 'A', role: '', time: '', description: '', achievement: '', items: ['a', '', 'b'] },
      { id: '2', company: '', role: '', time: '', description: '', achievement: '', items: [] },
    ])).toBe(2);
  });
});

describe('联系方式与头部信息', () => {
  it('contactEntries 按固定顺序返回有值项，并统一单位', () => {
    const data = makeData({
      phone: '138', email: '', age: '26岁', experienceYears: '4年经验',
      github: '', website: 'https://x.dev',
    });
    expect(contactEntries(data)).toEqual([
      { field: 'phone', icon: 'phone', text: '138' },
      { field: 'age', icon: 'user', text: '26岁' },
      { field: 'experienceYears', icon: 'clock', text: '4年经验' },
      { field: 'website', icon: 'globe', text: 'https://x.dev' },
    ]);
  });

  it('hasContactInfo: 只有年龄/年限也算有联系方式', () => {
    expect(hasContactInfo(makeData())).toBe(false);
    expect(hasContactInfo(makeData({ age: '26' }))).toBe(true);
    expect(hasContactInfo(makeData({ experienceYears: '4' }))).toBe(true);
  });

  it('hasIdentity: 姓名/职位/联系方式/求职意向任一存在即可', () => {
    expect(hasIdentity(makeData())).toBe(false);
    expect(hasIdentity(makeData({ name: '张三' }))).toBe(true);
    expect(hasIdentity(makeData({ title: '测试' }))).toBe(true);
    expect(hasIdentity(makeData({ phone: '138' }))).toBe(true);
    expect(hasIdentity(makeData({ salary: '20k' }))).toBe(true);
  });

  it('hasJobIntention: 只认求职意向与薪资', () => {
    expect(hasJobIntention(makeData({ name: '张三' }))).toBe(false);
    expect(hasJobIntention(makeData({ jobIntention: '测试' }))).toBe(true);
    expect(hasJobIntention(makeData({ salary: '20k' }))).toBe(true);
  });
});

describe('sectionHasContent', () => {
  it('空数据下所有区块都无内容', () => {
    const data = makeData();
    const keys = ['summary', 'skills', 'experience', 'projects', 'education', 'evaluation'] as const;
    for (const key of keys) expect(sectionHasContent(data, key)).toBe(false);
  });

  it('只有空记录时区块仍视为无内容', () => {
    const data = makeData({
      experience: [{ id: '1', company: '', role: '', time: '', description: '', achievement: '', items: [] }],
      projects: [{ id: '1', name: '', time: '', role: '', background: '', subtitle: '', achievement: '', items: [] }],
      skills: [{ id: '1', category: '', items: '', level: '精通' }],
      education: [{ id: '1', school: '', major: '', degree: '', time: '' }],
      evaluation: [{ text: ' ' }],
    });
    expect(sectionHasContent(data, 'experience')).toBe(false);
    expect(sectionHasContent(data, 'projects')).toBe(false);
    expect(sectionHasContent(data, 'skills')).toBe(false);
    expect(sectionHasContent(data, 'education')).toBe(false);
    expect(sectionHasContent(data, 'evaluation')).toBe(false);
  });

  it('有内容时对应区块为 true', () => {
    const data = makeData({
      summary: '简介',
      skills: [{ id: '1', category: '', items: 'Python', level: '' as SkillLevel }],
      experience: [{ id: '1', company: 'A', role: '', time: '', description: '', achievement: '', items: [] }],
      projects: [{ id: '1', name: '', time: '', role: '', background: '背景', subtitle: '', achievement: '', items: [] }],
      education: [{ id: '1', school: 'X', major: '', degree: '', time: '' }],
      evaluation: [{ text: '认真' }],
    });
    const keys = ['summary', 'skills', 'experience', 'projects', 'education', 'evaluation'] as const;
    for (const key of keys) expect(sectionHasContent(data, key)).toBe(true);
  });

  it('自定义区块：有正文才算有内容，仅标题不算', () => {
    const titleOnly = makeData({ customSections: [{ id: 'c1', title: '证书', content: '  ' }] });
    expect(sectionHasContent(titleOnly, 'custom:c1')).toBe(false);
    const withContent = makeData({ customSections: [{ id: 'c1', title: '证书', content: 'PMP' }] });
    expect(sectionHasContent(withContent, 'custom:c1')).toBe(true);
    expect(sectionHasContent(withContent, 'custom:missing')).toBe(false);
  });

  it('未知区块与空数据安全返回 false', () => {
    expect(sectionHasContent(makeData(), 'unknown' as never)).toBe(false);
    expect(sectionHasContent(null, 'summary')).toBe(false);
  });
});
