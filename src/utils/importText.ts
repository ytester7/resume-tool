import type {
  CustomSection, Education, Experience, Project, ResumeData, SectionKey, Skill,
} from '@/types/resume';
import { defaultResumeData, generateId } from '@/types/resume';

/**
 * 纯文本简历解析器（本地规则，不依赖模型）。
 *
 * 目标不是“完美还原”，而是把 PDF / Word 里已经存在的文字，
 * 变成一个用户可以在编辑器里继续修改的初稿：
 * - 标题识别走别名表，覆盖中英文常见写法；
 * - 经历按日期区间切段，识别公司 / 职位 / 条目 / 关键成果；
 * - 识别不到的字段不猜，交给导入确认页提示用户补充。
 */

export interface TextImportResult {
  data: ResumeData;
  warnings: string[];
  /** 识别到的区块（用于导入确认页展示） */
  sections: string[];
  /** 0–100 的识别完整度，仅用于提示，不代表简历质量 */
  confidence: number;
}

type BucketKey = SectionKey | 'custom';

interface SectionDef {
  key: BucketKey;
  labels: string[];
}

const SECTION_DEFS: SectionDef[] = [
  { key: 'summary', labels: ['个人优势', '个人总结', '职业概述', '专业概述', '个人简介', '关于我', 'SUMMARY', 'PROFILE'] },
  { key: 'skills', labels: ['专业技能', '技能特长', '技能清单', '技术栈', '核心技能', 'SKILLS'] },
  { key: 'experience', labels: ['工作经历', '工作经验', '职业经历', '实习经历', 'WORK EXPERIENCE', 'EXPERIENCE'] },
  { key: 'projects', labels: ['项目经历', '项目经验', '代表项目', 'PROJECTS', 'PROJECT EXPERIENCE'] },
  { key: 'education', labels: ['教育背景', '教育经历', '学历背景', 'EDUCATION'] },
  { key: 'evaluation', labels: ['自我评价', '个人评价', '自我介绍', 'SELF EVALUATION'] },
];

const CUSTOM_LABELS = ['证书资质', '证书', '资质', '荣誉奖项', '荣誉', '获奖经历', '获奖', '语言能力', '语言', '兴趣爱好', '兴趣', '校园经历', '培训经历'];

const DATE_RANGE = /((?:19|20)\d{2}\s*[.\-/年]?\s*\d{0,2}\s*月?)\s*(?:--|[-–—~至到])\s*((?:19|20)\d{2}\s*[.\-/年]?\s*\d{0,2}\s*月?|至今|现在|今)/;

const ROLE_KEYWORDS = /(工程师|经理|开发|测试|设计师|主管|专员|实习生|总监|架构师|负责人|顾问|分析师|运营|产品)/;

function cleanHeading(line: string): string {
  return line
    .replace(/^[\s#>*•·▪◦\-—=~_|]+/, '')
    .replace(/[\s:：\-—=~_|]+$/, '')
    .replace(/[（(][^）)]{0,20}[）)]/g, '')
    .trim();
}

function matchHeading(line: string): SectionDef | null {
  if (line.length > 40) return null;
  const cleaned = cleanHeading(line);
  if (!cleaned) return null;
  const short = cleaned.split(/\s{2,}/)[0].trim();
  for (const def of SECTION_DEFS) {
    for (const label of def.labels) {
      if (short.toUpperCase() === label.toUpperCase()) return def;
      if (label.length >= 2 && short.length <= label.length + 4 && short.toUpperCase().startsWith(label.toUpperCase())) {
        return def;
      }
    }
  }
  return null;
}

function matchCustomHeading(line: string): string | null {
  if (line.length > 20) return null;
  const cleaned = cleanHeading(line).replace(/[：:]$/, '').trim();
  for (const label of CUSTOM_LABELS) {
    if (cleaned === label) return label;
  }
  return null;
}

function normalizeTime(raw: string): string {
  return raw
    .replace(/\s+/g, '')
    .replace(/至今/g, '§')
    .replace(/[–—~至到]/g, '-')
    .replace(/年/g, '.')
    .replace(/月/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '')
    .replace(/§/g, '至今');
}

function stripBullet(line: string): string {
  return line
    .replace(/^[\s•·▪◦*-]+/, '')
    // 只去掉 1. / 1、 这类列表序号，避免把 2017.09 的年份当成序号
    .replace(/^(?!\d{4})\d{1,2}[.、)]\s*/, '')
    .trim();
}

function nonEmpty(lines: string[]): string[] {
  return lines.map(l => l.trim()).filter(Boolean);
}

function parseHeader(lines: string[]): Partial<ResumeData> & { experienceYears?: string } {
  const text = lines.join('\n');
  const result: Partial<ResumeData> = {};

  const phone = text.match(/(?:\+?86[-\s]?)?(1[3-9]\d{9})/);
  if (phone) result.phone = phone[1];

  const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (email) result.email = email[0];

  const gh = text.match(/(?:https?:\/\/)?(?:github|gitee)\.com\/[A-Za-z0-9._-]+/i);
  if (gh) {
    result.github = gh[0];
  } else {
    const url = text.match(/(?:https?:\/\/)?[a-z0-9-]+\.(?:com|cn|io|dev|me)(?:\/[^\s，,；;]*)?/i);
    // 排除邮箱域名（前面紧邻 @）
    if (url && url.index !== undefined && !text.slice(Math.max(0, url.index - 1), url.index).includes('@')) {
      result.website = url[0];
    }
  }

  const years = text.match(/(\d+)\s*年(?:工作)?经验/);
  if (years) result.experienceYears = `${years[1]}年`;

  const intention = text.match(/(?:求职意向|意向岗位|目标岗位|应聘职位)[:：]\s*([^\n]{2,40})/);
  if (intention) result.jobIntention = intention[1].trim();

  const nameMatch = text.match(/(?:姓\s*名|Name)[:：]\s*([\u4e00-\u9fa5·]{2,8}|[A-Za-z][A-Za-z .]{1,30})/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  } else {
    const candidate = lines
      .slice(0, 6)
      .map(l => l.trim())
      .find(l => /^[\u4e00-\u9fa5·]{2,4}$/.test(l));
    if (candidate) result.name = candidate;
  }

  const titleLine = lines
    .slice(0, 8)
    .map(l => l.trim())
    .find(l => l.length >= 4 && l.length <= 60 && ROLE_KEYWORDS.test(l) && !/@|https?:|求职意向|期望薪资/.test(l));
  if (titleLine) {
    result.title = titleLine
      .replace(/^[\s|｜]+/, '')
      .split(/[|｜]/)[0]
      .trim()
      .slice(0, 60);
  }

  return result;
}

function parseSkills(lines: string[]): Skill[] {
  const skills: Skill[] = [];
  for (const raw of nonEmpty(lines)) {
    const line = stripBullet(raw);
    if (!line) continue;
    const colon = line.match(/^([^:：]{1,16})[:：]\s*(.+)$/);
    let category = '技能';
    let items = line;
    if (colon) {
      category = colon[1].trim();
      items = colon[2].trim();
    }
    let level: Skill['level'] = '熟练';
    if (/精通|专家/.test(items)) level = '精通';
    else if (/了解|熟悉$/.test(items)) level = '了解';
    items = items
      .replace(/[（(](精通|熟练|掌握|了解|专家)[）)]/g, '')
      .replace(/[|｜]\s*(精通|熟练|掌握|了解|专家)\s*$/, '')
      .trim();
    if (!items) continue;
    skills.push({ id: generateId(), category: category.slice(0, 20), items, level });
  }
  return skills;
}

interface TimelineEntry {
  header: string;
  time: string;
  lines: string[];
}

function splitTimeline(lines: string[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  let current: TimelineEntry | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const range = line.match(DATE_RANGE);
    if (range) {
      const rest = line.replace(range[0], '').replace(/[|｜]/g, ' ').trim();
      if (current && !current.time) {
        // 常见写法：公司名单独一行，下一行才是“时间 + 职位”
        current.header = [current.header, ...current.lines, rest].filter(Boolean).join(' ');
        current.lines = [];
        current.time = normalizeTime(range[0]);
        continue;
      }
      if (current) entries.push(current);
      current = {
        header: rest,
        time: normalizeTime(range[0]),
        lines: [],
      };
      continue;
    }
    if (!current) {
      current = { header: '', time: '', lines: [] };
    }
    current.lines.push(line);
  }
  if (current) entries.push(current);

  // 整段没有日期时，把首行当作标题，避免所有内容都塞进条目里
  if (entries.length === 1 && !entries[0].time && entries[0].lines.length > 1) {
    entries[0].header = stripBullet(entries[0].lines[0]);
    entries[0].lines = entries[0].lines.slice(1);
  }
  return entries.filter(e => e.header || e.lines.length);
}

function splitCompanyRole(header: string): { company: string; role: string } {
  const parts = header.split(/\s{2,}|[|｜]/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { company: parts[0], role: parts.slice(1).join(' ') };
  const match = header.match(new RegExp(`^(.*?)\\s+([^\\s]*${ROLE_KEYWORDS.source}.*)$`));
  if (match) return { company: match[1].trim(), role: match[2].trim() };
  return { company: header.trim(), role: '' };
}

function extractAchievement(lines: string[]): { items: string[]; achievement: string; description: string } {
  const items: string[] = [];
  const achievements: string[] = [];
  let description = '';
  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;
    const achievement = line.match(/^(?:关键成果|主要成果|核心成果|成果|业绩|亮点)[:：]\s*(.+)$/);
    if (achievement) {
      achievements.push(achievement[1].trim());
      continue;
    }
    if (!description && !/^[•·▪◦*-]/.test(raw.trim()) && items.length === 0 && /。$/.test(line)) {
      description = line;
      continue;
    }
    items.push(line);
  }
  return { items, achievement: achievements.join('；'), description };
}

function parseExperience(lines: string[]): Experience[] {
  return splitTimeline(lines).map((entry) => {
    const { company, role } = splitCompanyRole(entry.header);
    const { items, achievement, description } = extractAchievement(entry.lines);
    return {
      id: generateId(),
      company,
      role,
      time: entry.time,
      description,
      achievement,
      items,
    };
  });
}

function parseProjects(lines: string[]): Project[] {
  return splitTimeline(lines).map((entry) => {
    const { company, role } = splitCompanyRole(entry.header);
    const { items, achievement } = extractAchievement(entry.lines);
    const background = entry.lines
      .map(stripBullet)
      .find(line => line && !/^[•·▪◦*-]/.test(line) && !/^(?:关键成果|主要成果|成果|业绩)[:：]/.test(line) && !items.includes(line)) ?? '';
    return {
      id: generateId(),
      name: company,
      time: entry.time,
      role,
      background,
      subtitle: '',
      achievement,
      items,
    };
  });
}

function parseEducation(lines: string[]): Education[] {
  const entries: Education[] = [];
  let current: Education | null = null;

  for (const raw of nonEmpty(lines)) {
    const line = stripBullet(raw);
    if (!line) continue;
    const range = line.match(DATE_RANGE);
    const isSchool = /大学|学院|学校|中学|University|College/i.test(line);
    if (range || isSchool) {
      if (current && (current.school || current.major)) entries.push(current);
      const rest = (range ? line.replace(range[0], '') : line).replace(/[|｜]/g, ' ').trim();
      let parts = rest.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
      if (parts.length === 1) parts = rest.split(/\s+/).map(s => s.trim()).filter(Boolean);
      const school = parts.find(p => /大学|学院|学校|中学|University|College/i.test(p)) ?? parts[0] ?? '';
      const degree = parts.find(p => /本科|硕士|博士|大专|专科|高中|MBA/i.test(p)) ?? '';
      const major = parts.find(p => p !== school && p !== degree && /专业|工程|科学|管理|技术|学/.test(p)) ?? '';
      current = {
        id: generateId(),
        school,
        major,
        degree,
        time: range ? normalizeTime(range[0]) : '',
      };
      continue;
    }
    if (current) {
      if (!current.major) current.major = line;
      else if (!current.degree) current.degree = line;
    }
  }
  if (current) entries.push(current);
  return entries;
}

function parseEvaluation(lines: string[]): { text: string }[] {
  return nonEmpty(lines)
    .map(stripBullet)
    .filter(Boolean)
    .map(text => ({ text }));
}

/**
 * 把纯文本解析成简历草稿。
 * 解析失败的字段会留空，并在 warnings 里提示，而不是编造内容。
 */
export function parseResumeText(rawText: string): TextImportResult {
  const normalized = rawText
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '');
  const lines = normalized.split('\n').map(l => l.replace(/\s+$/g, ''));

  const header: string[] = [];
  const buckets = new Map<BucketKey, string[]>();
  const customSections: CustomSection[] = [];
  let currentKey: BucketKey | null = null;
  let currentCustom: CustomSection | null = null;
  let seenAnyHeading = false;

  for (const line of lines) {
    if (!line.trim()) continue;
    const heading = matchHeading(line);
    if (heading) {
      currentKey = heading.key;
      currentCustom = null;
      seenAnyHeading = true;
      if (!buckets.has(heading.key)) buckets.set(heading.key, []);
      continue;
    }
    const customTitle = matchCustomHeading(line);
    if (customTitle) {
      currentCustom = { id: generateId(), title: customTitle, content: '' };
      customSections.push(currentCustom);
      currentKey = null;
      seenAnyHeading = true;
      continue;
    }
    if (currentCustom) {
      currentCustom.content += (currentCustom.content ? '\n' : '') + stripBullet(line);
      continue;
    }
    if (currentKey) {
      buckets.get(currentKey)!.push(line);
    } else {
      header.push(line);
    }
  }

  const headerData = parseHeader(header);
  const data = defaultResumeData();
  Object.assign(data, headerData);
  data.summary = (buckets.get('summary') ?? []).map(stripBullet).filter(Boolean).join('\n');
  data.skills = parseSkills(buckets.get('skills') ?? []);
  data.experience = parseExperience(buckets.get('experience') ?? []);
  data.projects = parseProjects(buckets.get('projects') ?? []);
  data.education = parseEducation(buckets.get('education') ?? []);
  data.evaluation = parseEvaluation(buckets.get('evaluation') ?? []);
  data.customSections = customSections;

  const warnings: string[] = [];
  if (!seenAnyHeading) warnings.push('没有识别到常见区块标题（如“工作经历”“教育背景”），内容已尽量按段落归入草稿');
  if (!data.name) warnings.push('未识别到姓名，请在导入后补充');
  if (!data.phone && !data.email) warnings.push('未识别到手机号或邮箱，请在导入后补充');
  if (data.experience.length === 0) warnings.push('未识别到工作经历，建议检查原文是否包含日期区间（如 2020.07-2023.05）');
  if (data.education.length === 0) warnings.push('未识别到教育背景，请在导入后补充');
  if (data.skills.length === 0) warnings.push('未识别到专业技能，可手动添加');
  if (normalized.trim().length < 50) warnings.push('文本内容过少，可能不是完整简历或 PDF 为扫描件');

  const sections: string[] = [];
  if (data.summary) sections.push('概述');
  if (data.skills.length) sections.push('技能');
  if (data.experience.length) sections.push('工作经历');
  if (data.projects.length) sections.push('项目');
  if (data.education.length) sections.push('教育');
  if (data.evaluation.length) sections.push('自我评价');
  if (data.customSections.length) sections.push(...data.customSections.map(c => c.title));

  let confidence = 0;
  if (data.name) confidence += 20;
  if (data.phone || data.email) confidence += 20;
  if (data.experience.length) confidence += 25;
  if (data.education.length) confidence += 10;
  if (data.skills.length) confidence += 10;
  if (data.summary) confidence += 5;
  if (data.projects.length) confidence += 10;

  return { data, warnings, sections, confidence };
}
