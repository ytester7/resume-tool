import type { ResumeData, ResumeFile, TemplateName, SectionKey } from '@/types/resume';
import { TEMPLATE_REGISTRY } from '@/types/resume';
import { ResumeParseError } from './errors';

export interface ParsedResume {
  data: ResumeData;
  template: TemplateName;
  sectionOrder: SectionKey[] | null;
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
  const sectionOrder: SectionKey[] | null = Array.isArray(meta.sectionOrder)
    ? meta.sectionOrder as SectionKey[]
    : null;

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
    skills: Array.isArray(obj.skills) ? obj.skills : [],
    experience: Array.isArray(obj.experience) ? obj.experience : [],
    projects: Array.isArray(obj.projects) ? obj.projects : [],
    education: Array.isArray(obj.education) ? obj.education : [],
    evaluation,
  };

  return { data, template, sectionOrder };
}

export function serializeResume(
  data: ResumeData,
  template: TemplateName,
  sectionOrder: SectionKey[] | null,
): string {
  const file: ResumeFile = {
    ...data,
    _meta: {
      template,
      sectionOrder,
      savedAt: new Date().toISOString(),
      version: '2.0',
    },
  };
  return JSON.stringify(file, null, 2);
}
