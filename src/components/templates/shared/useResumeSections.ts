import { h, computed } from 'vue';
import type { ResumeData, SectionId } from '@/types/resume';
import SkillList from './SkillList.vue';
import ExperienceItem from './ExperienceItem.vue';
import ProjectItem from './ProjectItem.vue';
import EducationItem from './EducationItem.vue';
import EvaluationList from './EvaluationList.vue';

/**
 * 单列可变序模板共用的 section 渲染逻辑。
 *
 * 抽离自 8 套单列模板（Classic/Minimal/Gradient/Creative/DataDriven/QaPro/CardStyle/ChineseElegant）
 * 中逐字重复的 `sectionHasContent` / `renderSection` / `visibleSections`。
 *
 * 放在 shared/ 目录与组件同源，属于 components 层内部，不违反
 * AGENTS.md 中 "composables 不依赖 components" 的分层约束。
 */
export interface UseResumeSectionsProps {
  data: ResumeData;
  sectionOrder: SectionId[];
}

export interface UseResumeSectionsOptions {
  /** SkillList 渲染样式，默认 'list' */
  skillVariant?: 'compact' | 'list' | 'table' | 'bars';
  /** EvaluationList 渲染样式，默认 'paragraphs' */
  evaluationVariant?: 'paragraphs' | 'bullets';
}

export function useResumeSections(
  props: UseResumeSectionsProps,
  options: UseResumeSectionsOptions = {},
) {
  const { skillVariant = 'list', evaluationVariant = 'paragraphs' } = options;

  function sectionHasContent(key: SectionId): boolean {
    if (key.startsWith('custom:')) {
      const sec = props.data.customSections.find(c => `custom:${c.id}` === key);
      return Boolean(sec && (sec.title.trim() || sec.content.trim()));
    }
    const d = props.data;
    switch (key) {
      case 'summary': return !!d.summary.trim();
      case 'skills': return d.skills.length > 0;
      case 'experience': return d.experience.length > 0;
      case 'projects': return d.projects.length > 0;
      case 'education': return d.education.length > 0;
      case 'evaluation': return d.evaluation.some(e => e.text.trim());
    }
    return false;
  }

  function renderSection(key: SectionId) {
    if (key.startsWith('custom:')) {
      const sec = props.data.customSections.find(c => `custom:${c.id}` === key);
      if (!sec) return null;
      return h('div', { class: 'section-custom', style: { whiteSpace: 'pre-wrap' } }, sec.content);
    }
    switch (key) {
      case 'summary':
        return h('p', { class: 'section-summary' }, props.data.summary);
      case 'skills':
        return h(SkillList, { skills: props.data.skills, variant: skillVariant });
      case 'experience':
        return h(ExperienceItem, { items: props.data.experience });
      case 'projects':
        return h(ProjectItem, { items: props.data.projects });
      case 'education':
        return h(EducationItem, { items: props.data.education });
      case 'evaluation':
        return h(EvaluationList, { items: props.data.evaluation, variant: evaluationVariant });
    }
  }

  const visibleSections = computed(() =>
    props.sectionOrder.filter(sectionHasContent),
  );

  return { sectionHasContent, renderSection, visibleSections };
}
