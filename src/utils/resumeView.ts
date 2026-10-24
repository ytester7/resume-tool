import type {
  ResumeData,
  Skill,
  Experience,
  Project,
  Education,
  EvaluationItem,
  SectionId,
} from '@/types/resume';

/**
 * 展示层数据适配。
 *
 * 简历数据可能来自不同的导入源，字段缺失、空字符串、只填了一半的记录都很常见。
 * 这里集中处理「哪些内容值得渲染」「缺失字段如何格式化」，模板只消费结果，
 * 避免每套模板各写一套 truthy 判断，出现空标题、空行、`26岁 岁` 这类问题。
 */

/** 统一转成可展示文本：字符串 trim，数字转字符串，对象/布尔等一律视为空 */
export function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export function hasText(value: unknown): boolean {
  return asText(value).length > 0;
}

/**
 * 年龄：数据源可能给 `26`、`26 岁`、`26岁`，统一成只带一个「岁」。
 */
export function formatAge(value: unknown): string {
  const raw = asText(value);
  if (!raw) return '';
  if (/岁$/.test(raw)) return raw;
  return `${raw} 岁`;
}

/**
 * 工作年限：数据源可能给 `4`、`4年`、`4 年经验`，统一成带「经验」的完整表述。
 */
export function formatExperience(value: unknown): string {
  const raw = asText(value);
  if (!raw) return '';
  if (/经验$/.test(raw)) return raw;
  if (/(年|个月|月)$/.test(raw)) return `${raw}经验`;
  return `${raw} 年经验`;
}

/**
 * 逐条内容（items）：既支持字符串数组，也支持数据源直接给一段多行文本。
 * 渲染前过滤空白行，避免出现空 li 撑高行距。
 */
export function visibleBullets(lines: unknown): string[] {
  if (Array.isArray(lines)) {
    return lines.map(asText).filter(Boolean);
  }
  const raw = asText(lines);
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* 单条记录：是否值得展示                                              */
/* ------------------------------------------------------------------ */

/** 技能只有熟练度、没有分类和内容时不构成有效信息 */
export function skillHasContent(skill: Skill | null | undefined): boolean {
  if (!skill) return false;
  return hasText(skill.category) || hasText(skill.items);
}

export function experienceHasContent(exp: Experience | null | undefined): boolean {
  if (!exp) return false;
  return (
    hasText(exp.company) ||
    hasText(exp.role) ||
    hasText(exp.time) ||
    hasText(exp.description) ||
    hasText(exp.achievement) ||
    visibleBullets(exp.items).length > 0
  );
}

export function projectHasContent(proj: Project | null | undefined): boolean {
  if (!proj) return false;
  return (
    hasText(proj.name) ||
    hasText(proj.time) ||
    hasText(proj.role) ||
    hasText(proj.background) ||
    hasText(proj.subtitle) ||
    hasText(proj.achievement) ||
    visibleBullets(proj.items).length > 0
  );
}

export function educationHasContent(edu: Education | null | undefined): boolean {
  if (!edu) return false;
  return hasText(edu.school) || hasText(edu.major) || hasText(edu.degree) || hasText(edu.time);
}

export function evaluationHasContent(item: EvaluationItem | null | undefined): boolean {
  return Boolean(item && hasText(item.text));
}

/* ------------------------------------------------------------------ */
/* 列表：过滤掉只占位、没有内容的记录                                  */
/* ------------------------------------------------------------------ */

export function visibleSkills(skills: Skill[] | null | undefined): Skill[] {
  return Array.isArray(skills) ? skills.filter(skillHasContent) : [];
}

export function visibleExperience(items: Experience[] | null | undefined): Experience[] {
  return Array.isArray(items) ? items.filter(experienceHasContent) : [];
}

export function visibleProjects(items: Project[] | null | undefined): Project[] {
  return Array.isArray(items) ? items.filter(projectHasContent) : [];
}

export function visibleEducation(items: Education[] | null | undefined): Education[] {
  return Array.isArray(items) ? items.filter(educationHasContent) : [];
}

export function visibleEvaluation(items: EvaluationItem[] | null | undefined): EvaluationItem[] {
  return Array.isArray(items) ? items.filter(evaluationHasContent) : [];
}

/** 有内容的条目里，所有非空 bullet 的总数（数据驱动模板统计用） */
export function countBullets(items: Experience[] | null | undefined): number {
  return visibleExperience(items).reduce(
    (sum, item) => sum + visibleBullets(item.items).length,
    0,
  );
}

/* ------------------------------------------------------------------ */
/* 头部信息：联系方式 / 求职意向 / 整体身份信息                        */
/* ------------------------------------------------------------------ */

export type ContactField =
  | 'phone'
  | 'email'
  | 'age'
  | 'experienceYears'
  | 'github'
  | 'website';

export type ContactIcon = 'phone' | 'email' | 'user' | 'clock' | 'github' | 'globe';

export interface ContactEntry {
  field: ContactField;
  icon: ContactIcon;
  text: string;
}

const CONTACT_DEFINITIONS: {
  field: ContactField;
  icon: ContactIcon;
  format: (value: unknown) => string;
}[] = [
  { field: 'phone', icon: 'phone', format: asText },
  { field: 'email', icon: 'email', format: asText },
  { field: 'age', icon: 'user', format: formatAge },
  { field: 'experienceYears', icon: 'clock', format: formatExperience },
  { field: 'github', icon: 'github', format: asText },
  { field: 'website', icon: 'globe', format: asText },
];

/** 按固定顺序返回真正有值的联系方式条目 */
export function contactEntries(data: ResumeData | null | undefined): ContactEntry[] {
  if (!data) return [];
  return CONTACT_DEFINITIONS
    .map(def => ({
      field: def.field,
      icon: def.icon,
      text: def.format(data[def.field]),
    }))
    .filter(entry => entry.text.length > 0);
}

export function hasContactInfo(data: ResumeData | null | undefined): boolean {
  return contactEntries(data).length > 0;
}

export function hasJobIntention(data: ResumeData | null | undefined): boolean {
  return Boolean(data && (hasText(data.jobIntention) || hasText(data.salary)));
}

/**
 * 头部是否有任何值得展示的信息。
 * 全为空时各模板直接隐藏 header，而不是留一条带边框/底色的空色块。
 */
export function hasIdentity(data: ResumeData | null | undefined): boolean {
  if (!data) return false;
  return (
    hasText(data.name) ||
    hasText(data.title) ||
    hasContactInfo(data) ||
    hasJobIntention(data)
  );
}

/* ------------------------------------------------------------------ */
/* 区块：是否有内容（单列模板的 section 过滤 + 固定布局的栏位折叠）    */
/* ------------------------------------------------------------------ */

export function sectionHasContent(data: ResumeData | null | undefined, key: SectionId): boolean {
  if (!data) return false;

  if (key.startsWith('custom:')) {
    const section = (data.customSections ?? []).find(item => `custom:${item.id}` === key);
    // 只有标题、没有正文的自定义区块会渲染成一个空壳，按无内容处理
    return Boolean(section && hasText(section.content));
  }

  switch (key) {
    case 'summary':
      return hasText(data.summary);
    case 'skills':
      return visibleSkills(data.skills).length > 0;
    case 'experience':
      return visibleExperience(data.experience).length > 0;
    case 'projects':
      return visibleProjects(data.projects).length > 0;
    case 'education':
      return visibleEducation(data.education).length > 0;
    case 'evaluation':
      return visibleEvaluation(data.evaluation).length > 0;
    default:
      return false;
  }
}
