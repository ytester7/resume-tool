export type SkillLevel = '精通' | '熟练' | '了解';

export type TemplateName =
  | 'classic' | 'modern' | 'creative' | 'tech' | 'data-driven'
  | 'qa-pro' | 'minimal' | 'gradient' | 'executive'
  | 'european' | 'tech-gradient' | 'card-style' | 'chinese-elegant';

export type SectionKey =
  | 'summary' | 'skills' | 'experience' | 'projects'
  | 'education' | 'evaluation';

/** 内置区块的规范顺序（用于固定布局模板的模块面板、Word 导出兜底） */
export const SECTION_KEYS: SectionKey[] = [
  'summary', 'skills', 'experience', 'projects', 'education', 'evaluation',
];

/** 区块标识：内置区块用 SectionKey，自定义区块用 `custom:${id}` */
export type SectionId = SectionKey | `custom:${string}`;

export interface Skill { id: string; category: string; items: string; level: SkillLevel; }
export interface Experience {
  id: string; company: string; role: string; time: string;
  description: string; achievement: string; items: string[];
}
export interface Project {
  id: string; name: string; time: string; role: string;
  background: string; subtitle: string; achievement: string; items: string[];
}
export interface Education { id: string; school: string; major: string; degree: string; time: string; }
export interface EvaluationItem { text: string; }
export interface CustomSection { id: string; title: string; content: string; }

export interface ResumeData {
  name: string; title: string; phone: string; email: string;
  age: string; experienceYears: string; jobIntention: string; salary: string;
  github: string; website: string; summary: string;
  /** 证件照（data URL，前端已压缩为宽 480px 的 JPEG） */
  photo?: string;
  skills: Skill[]; experience: Experience[]; projects: Project[];
  education: Education[]; evaluation: EvaluationItem[];
  customSections: CustomSection[];
}

/** 主题配置：主色 + 字体，作用于预览画布 */
export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
}

export interface ResumeFileMeta {
  template: TemplateName;
  sectionOrder: SectionId[] | null;
  savedAt: string;
  version: '2.0';
  theme?: ThemeConfig;
  /** 目标岗位 JD 原文（仅本地保存，用于岗位匹配分析） */
  targetJd?: string;
  /** 被隐藏的区块（数据仍保留，只是不渲染） */
  hiddenSections?: SectionId[];
}

export type ResumeFile = ResumeData & { _meta?: ResumeFileMeta };

export interface ResumeSession {
  id: string;
  title: string;
  data: ResumeData;
  template: TemplateName;
  sectionOrder: SectionId[] | null;
  fileHandle: FileSystemFileHandle | null;
  dirty: boolean;
  theme: ThemeConfig | null;
  /** 目标岗位 JD（本地分析用，随文件 _meta 保存） */
  targetJd: string;
  /** 隐藏的区块（数据保留，仅预览/导出时不渲染） */
  hiddenSections: SectionId[];
}

export interface TemplateMeta {
  name: TemplateName;
  displayName: string;
  category: 'classic' | 'modern' | 'tech' | 'creative';
  sectionOrderMutable: boolean;
  defaultSectionOrder: SectionKey[];
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: '专业概述',
  skills: '专业技能',
  experience: '工作经历',
  projects: '项目经历',
  education: '教育背景',
  evaluation: '自我评价',
};

/**
 * 区块显示名：内置区块取固定标签，自定义区块取用户标题（未找到时兜底）。
 */
export function getSectionLabel(id: SectionId, customSections?: CustomSection[]): string {
  if (id.startsWith('custom:')) {
    const found = customSections?.find(c => `custom:${c.id}` === id);
    return found?.title.trim() || '自定义区块';
  }
  return SECTION_LABELS[id as SectionKey];
}

const SINGLE_COLUMN_DEFAULT: SectionKey[] = ['summary','skills','experience','projects','education','evaluation'];

export const TEMPLATE_REGISTRY: Record<TemplateName, TemplateMeta> = {
  classic:           { name: 'classic',           displayName: '经典专业', category: 'classic',  sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  minimal:           { name: 'minimal',           displayName: '极简风格', category: 'classic',  sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  gradient:          { name: 'gradient',          displayName: '渐变时尚', category: 'modern',   sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  creative:          { name: 'creative',          displayName: '创意设计', category: 'modern',   sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  'data-driven':     { name: 'data-driven',       displayName: '数据驱动', category: 'tech',     sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  'qa-pro':          { name: 'qa-pro',            displayName: 'QA专业',   category: 'tech',     sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  'card-style':      { name: 'card-style',        displayName: '卡片式',   category: 'creative', sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  'chinese-elegant': { name: 'chinese-elegant',   displayName: '国风雅韵', category: 'classic',  sectionOrderMutable: true,  defaultSectionOrder: SINGLE_COLUMN_DEFAULT },
  modern:            { name: 'modern',            displayName: '现代简约', category: 'modern',   sectionOrderMutable: false, defaultSectionOrder: [] },
  executive:         { name: 'executive',         displayName: '商务行政', category: 'classic',  sectionOrderMutable: false, defaultSectionOrder: [] },
  european:          { name: 'european',          displayName: '欧洲简约', category: 'modern',   sectionOrderMutable: false, defaultSectionOrder: [] },
  tech:              { name: 'tech',              displayName: '技术极客', category: 'tech',     sectionOrderMutable: false, defaultSectionOrder: [] },
  'tech-gradient':   { name: 'tech-gradient',     displayName: '科技渐变', category: 'tech',     sectionOrderMutable: false, defaultSectionOrder: [] },
};

export const TEMPLATE_LIST: TemplateMeta[] = Object.values(TEMPLATE_REGISTRY);

export function defaultResumeData(): ResumeData {
  return {
    name: '', title: '', phone: '', email: '', age: '',
    experienceYears: '', jobIntention: '', salary: '',
    github: '', website: '', summary: '', photo: '',
    skills: [], experience: [], projects: [], education: [],
    evaluation: [{ text: '' }, { text: '' }, { text: '' }],
    customSections: [],
  };
}

/** 简历是否完全空白（用于欢迎页引导判断） */
export function isEmptyResume(data: ResumeData): boolean {
  return !data.name.trim()
    && !data.summary.trim()
    && !data.phone.trim()
    && !data.email.trim()
    && data.skills.length === 0
    && data.experience.length === 0
    && data.projects.length === 0
    && data.education.length === 0
    && !data.customSections.length;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
