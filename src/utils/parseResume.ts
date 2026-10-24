import type {
  ResumeData, ResumeFile, TemplateName, SectionId, ThemeConfig, CustomSection,
  Skill, SkillLevel, Experience, Project, Education, EvaluationItem,
} from '@/types/resume';
import { TEMPLATE_REGISTRY, generateId } from '@/types/resume';
import { asText } from './resumeView';
import { ResumeParseError } from './errors';
import { sanitizeHiddenSections } from './hiddenSections';

export interface ParsedResume {
  data: ResumeData;
  template: TemplateName;
  sectionOrder: SectionId[] | null;
  theme: ThemeConfig | null;
  targetJd: string;
  hiddenSections: SectionId[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/** 逐条内容：数组保留空行（编辑器可继续输入），字符串按换行拆成多行 */
function normalizeLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asText);
  const raw = asText(value);
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function normalizeSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) return [];

  const skills: Skill[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') {
      const text = asText(entry);
      if (text) {
        skills.push({ id: generateId(), category: '', items: text, level: '' as SkillLevel });
      }
      continue;
    }
    if (!isRecord(entry)) continue;
    skills.push({
      id: asText(entry.id) || generateId(),
      category: asText(entry.category),
      // 部分数据源把具体技能给成数组，转成顿号分隔的文本
      items: Array.isArray(entry.items)
        ? entry.items.map(asText).filter(Boolean).join('、')
        : asText(entry.items),
      // 数据源可能使用自定义熟练度（如「高级」），保留原文展示；缺失时为空
      level: asText(entry.level) as SkillLevel,
    });
  }
  return skills;
}

function normalizeExperience(value: unknown): Experience[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map(entry => ({
    id: asText(entry.id) || generateId(),
    company: asText(entry.company),
    role: asText(entry.role),
    time: asText(entry.time),
    description: asText(entry.description),
    achievement: asText(entry.achievement),
    items: normalizeLines(entry.items),
  }));
}

function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map(entry => ({
    id: asText(entry.id) || generateId(),
    name: asText(entry.name),
    time: asText(entry.time),
    role: asText(entry.role),
    background: asText(entry.background),
    subtitle: asText(entry.subtitle),
    achievement: asText(entry.achievement),
    items: normalizeLines(entry.items),
  }));
}

function normalizeEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map(entry => ({
    id: asText(entry.id) || generateId(),
    school: asText(entry.school),
    major: asText(entry.major),
    degree: asText(entry.degree),
    time: asText(entry.time),
  }));
}

function normalizeEvaluation(value: unknown): EvaluationItem[] {
  if (typeof value === 'string') {
    return [{ text: '' }, { text: asText(value) }, { text: '' }];
  }
  if (!Array.isArray(value)) {
    return [{ text: '' }, { text: '' }, { text: '' }];
  }
  return value.map(entry => {
    if (typeof entry === 'string' || typeof entry === 'number') {
      return { text: asText(entry) };
    }
    if (isRecord(entry)) return { text: asText(entry.text) };
    return { text: '' };
  });
}

function normalizeCustomSections(value: unknown): CustomSection[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map(entry => ({
    id: asText(entry.id) || generateId(),
    title: asText(entry.title),
    content: asText(entry.content),
  }));
}

/**
 * 把任意来源的简历数据补全为完整结构。
 *
 * 只保证「形状」正确，不丢弃空记录 —— 空记录留给编辑器继续填写，
 * 预览层通过 resumeView 的 visible* 过滤器决定是否展示。
 */
export function normalizeResumeData(raw: unknown): ResumeData {
  const obj: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    name: asText(obj.name),
    title: asText(obj.title),
    phone: asText(obj.phone),
    email: asText(obj.email),
    age: asText(obj.age),
    experienceYears: asText(obj.experienceYears),
    jobIntention: asText(obj.jobIntention),
    salary: asText(obj.salary),
    github: asText(obj.github),
    website: asText(obj.website),
    summary: asText(obj.summary),
    photo: asText(obj.photo),
    skills: normalizeSkills(obj.skills),
    experience: normalizeExperience(obj.experience),
    projects: normalizeProjects(obj.projects),
    education: normalizeEducation(obj.education),
    evaluation: normalizeEvaluation(obj.evaluation),
    customSections: normalizeCustomSections(obj.customSections),
  };
}

export function parseResumeFile(raw: unknown): ParsedResume {
  if (!raw || typeof raw !== 'object') {
    throw new ResumeParseError('数据格式不是对象');
  }
  const obj = raw as Record<string, any>;

  const meta = obj._meta || {};
  const template: TemplateName = TEMPLATE_REGISTRY[meta.template as TemplateName]
    ? meta.template
    : 'classic';
  const sectionOrder: SectionId[] | null = Array.isArray(meta.sectionOrder)
    ? meta.sectionOrder as SectionId[]
    : null;

  const theme: ThemeConfig | null =
    meta.theme && typeof meta.theme === 'object'
      ? {
          primaryColor: String(meta.theme.primaryColor ?? ''),
          fontFamily: String(meta.theme.fontFamily ?? ''),
        }
      : null;

  const targetJd = typeof meta.targetJd === 'string' ? meta.targetJd : '';
  const hiddenSections = sanitizeHiddenSections(meta.hiddenSections);

  return {
    data: normalizeResumeData(obj),
    template,
    sectionOrder,
    theme,
    targetJd,
    hiddenSections,
  };
}

export function serializeResume(
  data: ResumeData,
  template: TemplateName,
  sectionOrder: SectionId[] | null,
  theme?: ThemeConfig | null,
  targetJd?: string,
  hiddenSections?: SectionId[],
): string {
  const file: ResumeFile = {
    ...data,
    _meta: {
      template,
      sectionOrder,
      savedAt: new Date().toISOString(),
      version: '2.0',
      ...(theme ? { theme } : {}),
      ...(targetJd?.trim() ? { targetJd } : {}),
      ...(hiddenSections?.length ? { hiddenSections } : {}),
    },
  };
  return JSON.stringify(file, null, 2);
}
