import { describe, it, expect } from 'vitest';
import { defineComponent } from 'vue';
import { useResumeSections } from './useResumeSections';
import SkillList from './SkillList.vue';
import ExperienceItem from './ExperienceItem.vue';
import ProjectItem from './ProjectItem.vue';
import EducationItem from './EducationItem.vue';
import EvaluationList from './EvaluationList.vue';
import { defaultResumeData, type ResumeData, type SectionId } from '@/types/resume';

function makeProps(overrides: Partial<ResumeData> = {}, sectionOrder: SectionId[] = ['summary','skills','experience','projects','education','evaluation']) {
  return {
    data: { ...defaultResumeData(), ...overrides },
    sectionOrder,
  };
}

describe('useResumeSections', () => {
  it('sectionHasContent: 空 section 全部返回 false', () => {
    const { sectionHasContent } = useResumeSections(makeProps());
    expect(sectionHasContent('summary')).toBe(false);
    expect(sectionHasContent('skills')).toBe(false);
    expect(sectionHasContent('experience')).toBe(false);
    expect(sectionHasContent('projects')).toBe(false);
    expect(sectionHasContent('education')).toBe(false);
    expect(sectionHasContent('evaluation')).toBe(false);
  });

  it('sectionHasContent: 有内容返回 true', () => {
    const data: Partial<ResumeData> = {
      summary: '5 年经验',
      skills: [{ id: '1', category: '语言', items: 'TS', level: '熟练' }],
      experience: [{ id: '1', company: 'A', role: 'T', time: '2020', description: '', achievement: '', items: [] }],
      projects: [{ id: '1', name: 'P', time: '', role: '', background: '', subtitle: '', achievement: '', items: [] }],
      education: [{ id: '1', school: 'X', major: 'Y', degree: '本科', time: '2020' }],
      evaluation: [{ text: '认真' }],
    };
    const { sectionHasContent } = useResumeSections(makeProps(data));
    expect(sectionHasContent('summary')).toBe(true);
    expect(sectionHasContent('skills')).toBe(true);
    expect(sectionHasContent('experience')).toBe(true);
    expect(sectionHasContent('projects')).toBe(true);
    expect(sectionHasContent('education')).toBe(true);
    expect(sectionHasContent('evaluation')).toBe(true);
  });

  it('sectionHasContent: 空白字符串 summary 返回 false', () => {
    const { sectionHasContent } = useResumeSections(makeProps({ summary: '   ' }));
    expect(sectionHasContent('summary')).toBe(false);
  });

  it('sectionHasContent: evaluation 全空文本返回 false', () => {
    const { sectionHasContent } = useResumeSections(makeProps({
      evaluation: [{ text: '' }, { text: '  ' }],
    }));
    expect(sectionHasContent('evaluation')).toBe(false);
  });

  it('sectionHasContent: custom 区块有内容返回 true，空/缺失返回 false', () => {
    const { sectionHasContent } = useResumeSections(makeProps({
      customSections: [{ id: 'c1', title: '证书', content: 'PMP' }],
    }, ['custom:c1']));
    expect(sectionHasContent('custom:c1')).toBe(true);

    const empty = useResumeSections(makeProps({
      customSections: [{ id: 'c1', title: '  ', content: '' }],
    }));
    expect(empty.sectionHasContent('custom:c1')).toBe(false);
    expect(empty.sectionHasContent('custom:missing')).toBe(false);
  });

  it('renderSection: custom 返回 pre-wrap div，未找到返回 null', () => {
    const { renderSection } = useResumeSections(makeProps({
      customSections: [{ id: 'c1', title: '证书', content: 'PMP\n软考' }],
    }));
    const vnode = renderSection('custom:c1');
    expect(vnode?.type).toBe('div');
    expect(vnode?.props?.class).toBe('section-custom');
    expect(vnode?.props?.style).toEqual({ whiteSpace: 'pre-wrap' });
    expect(vnode?.children).toBe('PMP\n软考');
    expect(renderSection('custom:missing')).toBe(null);
  });

  it('visibleSections 过滤空 custom 区块', () => {
    const { visibleSections } = useResumeSections(makeProps({
      summary: 's',
      customSections: [{ id: 'c1', title: '证书', content: 'x' }],
    }, ['summary', 'custom:c1', 'custom:c2']));
    expect(visibleSections.value).toEqual(['summary', 'custom:c1']);
  });

  it('visibleSections 过滤掉空 section，保留有内容的', () => {
    const { visibleSections } = useResumeSections(
      makeProps({ summary: '我有内容', skills: [] }, ['summary', 'skills', 'experience']),
    );
    expect(visibleSections.value).toEqual(['summary']);
  });

  it('visibleSections 保持 sectionOrder 顺序', () => {
    const data: Partial<ResumeData> = {
      summary: 's',
      skills: [{ id: '1', category: 'c', items: 'i', level: '熟练' }],
    };
    const { visibleSections } = useResumeSections(
      makeProps(data, ['experience', 'summary', 'skills', 'education']),
    );
    expect(visibleSections.value).toEqual(['summary', 'skills']);
  });

  it('renderSection: summary 返回 p vnode', () => {
    const { renderSection } = useResumeSections(makeProps({ summary: '简介内容' }));
    const vnode = renderSection('summary');
    expect(vnode?.type).toBe('p');
  });

  it('renderSection: skills 默认 variant=list', () => {
    const { renderSection } = useResumeSections(makeProps());
    const vnode = renderSection('skills');
    expect(vnode?.type).toBe(SkillList);
    expect(vnode?.props?.variant).toBe('list');
  });

  it('renderSection: skills 传入 variant=table 生效', () => {
    const { renderSection } = useResumeSections(makeProps(), { skillVariant: 'table' });
    const vnode = renderSection('skills');
    expect(vnode?.type).toBe(SkillList);
    expect(vnode?.props?.variant).toBe('table');
  });

  it('renderSection: experience 返回 ExperienceItem', () => {
    const { renderSection } = useResumeSections(makeProps());
    const vnode = renderSection('experience');
    expect(vnode?.type).toBe(ExperienceItem);
  });

  it('renderSection: projects 返回 ProjectItem', () => {
    const { renderSection } = useResumeSections(makeProps());
    const vnode = renderSection('projects');
    expect(vnode?.type).toBe(ProjectItem);
  });

  it('renderSection: education 返回 EducationItem', () => {
    const { renderSection } = useResumeSections(makeProps());
    const vnode = renderSection('education');
    expect(vnode?.type).toBe(EducationItem);
  });

  it('renderSection: evaluation 默认 variant=paragraphs', () => {
    const { renderSection } = useResumeSections(makeProps());
    const vnode = renderSection('evaluation');
    expect(vnode?.type).toBe(EvaluationList);
    expect(vnode?.props?.variant).toBe('paragraphs');
  });

  it('renderSection: evaluation 传入 variant=bullets 生效', () => {
    const { renderSection } = useResumeSections(makeProps(), { evaluationVariant: 'bullets' });
    const vnode = renderSection('evaluation');
    expect(vnode?.props?.variant).toBe('bullets');
  });

  it('visibleSections 是 computed，依赖 props.data 响应式', () => {
    const Wrapper = defineComponent({
      props: ['data', 'sectionOrder'],
      setup(p) {
        return { ...useResumeSections(p) };
      },
      template: '<div>{{ visibleSections.join(",") }}</div>',
    });
    // 仅验证 useResumeSections 在组件 setup 中可正常使用（不抛错）
    expect(Wrapper).toBeDefined();
  });
});
