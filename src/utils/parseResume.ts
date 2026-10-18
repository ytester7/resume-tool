import type {
  ResumeData, ResumeFile, TemplateName, SectionId, ThemeConfig, CustomSection,
} from '@/types/resume';
import { TEMPLATE_REGISTRY, generateId } from '@/types/resume';
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

export function parseResumeFile(raw: unknown): ParsedResume {
  if (!raw || typeof raw !== 'object') {
    throw new ResumeParseError('数据格式不是对象');
  }
  const obj = raw as Record<string, any>;

  let evaluation = obj.evaluation;
  if (typeof evaluation === 'string') {
    evaluation = [{ text: '' }, { text: evaluation || '' }, { text: '' }];
  } else if (!Array.isArray(evaluation)) {
    evaluation = [{ text: '' }, { text: '' }, { text: '' }];
  } else {
    evaluation = evaluation.map((e: any) => ({ text: typeof e?.text === 'string' ? e.text : String(e ?? '') }));
  }

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

  const customSections: CustomSection[] = Array.isArray(obj.customSections)
    ? obj.customSections
        .filter((c: unknown): c is Record<string, unknown> => c !== null && typeof c === 'object')
        .map((c) => ({
          id: typeof c.id === 'string' ? c.id : generateId(),
          title: String(c.title ?? ''),
          content: String(c.content ?? ''),
        }))
    : [];

  const data: ResumeData = {
    name: String(obj.name ?? ''),
    title: String(obj.title ?? ''),
    phone: String(obj.phone ?? ''),
    email: String(obj.email ?? ''),
    age: String(obj.age ?? ''),
    experienceYears: String(obj.experienceYears ?? ''),
    jobIntention: String(obj.jobIntention ?? ''),
    salary: String(obj.salary ?? ''),
    github: String(obj.github ?? ''),
    website: String(obj.website ?? ''),
    summary: String(obj.summary ?? ''),
    photo: typeof obj.photo === 'string' ? obj.photo : '',
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    experience: Array.isArray(obj.experience) ? obj.experience : [],
    projects: Array.isArray(obj.projects) ? obj.projects : [],
    education: Array.isArray(obj.education) ? obj.education : [],
    evaluation,
    customSections,
  };

  return { data, template, sectionOrder, theme, targetJd, hiddenSections };
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
