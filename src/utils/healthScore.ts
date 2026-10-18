import type { ResumeData, SectionKey } from '@/types/resume';

/** 评分维度键 */
export type DimensionKey =
  | 'completeness' | 'quantification' | 'richness'
  | 'keyword' | 'regularity';

/** 健康度等级 */
export type Grade = '优秀' | '良好' | '合格' | '待改进';

export interface Suggestion {
  dimension: DimensionKey;
  message: string;
  /** 点击建议可定位到的编辑区块；undefined 表示整体性建议 */
  target?: SectionKey;
}

export interface HealthReport {
  total: number;
  grade: Grade;
  dimensions: Record<DimensionKey, number>;
  suggestions: Suggestion[];
}

/** 各维度满分 */
export const DIMENSION_MAX: Record<DimensionKey, number> = {
  completeness: 25,
  quantification: 25,
  richness: 20,
  keyword: 15,
  regularity: 15,
};

/** 量化数字识别：含单位或独立数字均可 */
const NUMBER_RE = /\d+(\.\d+)?\s*(%|万|千|k|K|百万|亿|次|个|人|天|小时|分钟|秒|年|月|倍)?/;
/** 时间格式：YYYY.MM-YYYY.MM / YYYY/MM-YYYY/MM / YYYY.MM-至今 等 */
const TIME_RE = /^\d{4}[./]\d{1,2}\s*[-–~]\s*(\d{4}[./]\d{1,2}|至今|现在)$/;
/** 邮箱格式 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 中国大陆手机号 */
const PHONE_RE = /^1[3-9]\d{9}$/;

function nonEmpty(s: string | undefined | null): boolean {
  return !!s && s.trim().length > 0;
}

function hasNumber(s: string | undefined | null): boolean {
  return !!s && NUMBER_RE.test(s);
}

/** 完整性维度（25 分） */
function scoreCompleteness(data: ResumeData): { score: number; suggestions: Suggestion[] } {
  let score = 0;
  const suggestions: Suggestion[] = [];

  if (nonEmpty(data.name)) score += 2;
  else suggestions.push({ dimension: 'completeness', message: '请填写姓名', target: undefined });

  if (nonEmpty(data.title)) score += 2;
  else suggestions.push({ dimension: 'completeness', message: '请填写求职岗位', target: undefined });

  if (nonEmpty(data.email)) score += 2;
  else suggestions.push({ dimension: 'completeness', message: '建议填写邮箱以便 HR 联系', target: undefined });

  // 联系方式：phone 或 email 至少一项
  if (nonEmpty(data.phone) || nonEmpty(data.email)) score += 2;
  else suggestions.push({ dimension: 'completeness', message: '请至少填写一种联系方式（手机/邮箱）' });

  if (nonEmpty(data.experienceYears)) score += 1;
  if (nonEmpty(data.jobIntention)) score += 1;
  else suggestions.push({ dimension: 'completeness', message: '建议填写求职意向', target: undefined });

  if (nonEmpty(data.github) || nonEmpty(data.website)) score += 2;
  else suggestions.push({ dimension: 'completeness', message: '可补充 GitHub 或个人网站链接' });

  if (data.experience.length >= 1) score += 4;
  else suggestions.push({ dimension: 'completeness', message: '请至少添加一段工作经历', target: 'experience' });

  if (data.education.length >= 1) score += 3;
  else suggestions.push({ dimension: 'completeness', message: '请至少添加一段教育背景', target: 'education' });

  if (data.projects.length >= 1) score += 3;
  else suggestions.push({ dimension: 'completeness', message: '建议添加项目经历以展示实战能力', target: 'projects' });

  if (nonEmpty(data.summary)) score += 3;
  else suggestions.push({ dimension: 'completeness', message: '请填写专业概述', target: 'summary' });

  const validEval = data.evaluation.filter(e => nonEmpty(e.text));
  if (validEval.length >= 1) score += 2;
  else suggestions.push({ dimension: 'completeness', message: '请补充自我评价', target: 'evaluation' });

  return { score: Math.min(score, DIMENSION_MAX.completeness), suggestions };
}

/** 量化度维度（25 分） */
function scoreQuantification(data: ResumeData): { score: number; suggestions: Suggestion[] } {
  let score = 0;
  const suggestions: Suggestion[] = [];

  // 工作成就量化：每条 +2，上限 10
  const expQuantified = data.experience.filter(e => hasNumber(e.achievement)).length;
  score += Math.min(expQuantified * 2, 10);
  if (expQuantified === 0 && data.experience.length > 0) {
    suggestions.push({
      dimension: 'quantification',
      message: '工作经历缺少量化成果，建议补充如"提升 30%""节省 50 万"等数字',
      target: 'experience',
    });
  }

  // 项目成就量化：每条 +2，上限 10
  const projQuantified = data.projects.filter(p => hasNumber(p.achievement)).length;
  score += Math.min(projQuantified * 2, 10);
  if (projQuantified === 0 && data.projects.length > 0) {
    suggestions.push({
      dimension: 'quantification',
      message: '项目经历缺少量化成果，建议补充可衡量的产出',
      target: 'projects',
    });
  }

  // 任务项量化：含数字的 items 项数（上限 5）
  const itemQuantified =
    data.experience.reduce((acc, e) => acc + e.items.filter(hasNumber).length, 0) +
    data.projects.reduce((acc, p) => acc + p.items.filter(hasNumber).length, 0);
  score += Math.min(itemQuantified, 5);

  return { score: Math.min(score, DIMENSION_MAX.quantification), suggestions };
}

/** 充实度维度（20 分） */
function scoreRichness(data: ResumeData): { score: number; suggestions: Suggestion[] } {
  let score = 0;
  const suggestions: Suggestion[] = [];

  // 概述长度：50–200 字满分，<30 或 >300 得 0，中间线性
  const summaryLen = (data.summary || '').trim().length;
  if (summaryLen >= 50 && summaryLen <= 200) {
    score += 5;
  } else if (summaryLen >= 30 && summaryLen < 50) {
    score += 3;
  } else if (summaryLen > 200 && summaryLen <= 300) {
    score += 3;
  }
  if (summaryLen > 0 && (summaryLen < 50 || summaryLen > 300)) {
    suggestions.push({
      dimension: 'richness',
      message: `专业概述当前 ${summaryLen} 字，建议 50–200 字之间`,
      target: 'summary',
    });
  }

  // 工作描述：每条 ≥ 30 字 +1，上限 5
  const descAdequate = data.experience.filter(e => nonEmpty(e.description) && e.description.length >= 30).length;
  score += Math.min(descAdequate, 5);

  // 任务项数量：experience/projects 每条 items ≥ 2 加 1，上限 5
  const itemAdequate =
    data.experience.filter(e => e.items.filter(nonEmpty).length >= 2).length +
    data.projects.filter(p => p.items.filter(nonEmpty).length >= 2).length;
  score += Math.min(itemAdequate, 5);

  // 技能数量：≥ 5 满分，按比例
  const skillCount = data.skills.filter(s => nonEmpty(s.items)).length;
  score += Math.min(Math.round((skillCount / 5) * 5), 5);
  if (skillCount < 5) {
    suggestions.push({
      dimension: 'richness',
      message: `技能条目当前 ${skillCount} 条，建议补充至 5 条以上`,
      target: 'skills',
    });
  }

  return { score: Math.min(score, DIMENSION_MAX.richness), suggestions };
}

/** 关键词丰富度维度（15 分） */
function scoreKeyword(data: ResumeData): { score: number; suggestions: Suggestion[] } {
  let score = 0;
  const suggestions: Suggestion[] = [];

  // 技能分类：不同 category ≥ 3 满分，按比例
  const categories = new Set(data.skills.map(s => s.category.trim()).filter(Boolean));
  const catCount = categories.size;
  score += Math.min(Math.round((catCount / 3) * 5), 5);

  // 技能关键词数：items 中关键词总数 ≥ 15 满分
  const keywordList = data.skills
    .flatMap(s => s.items.split(/[,，、;；\s]+/).map(k => k.trim()).filter(Boolean));
  const kwCount = keywordList.length;
  score += Math.min(Math.round((kwCount / 15) * 5), 5);

  // 概述含关键词：≥ 2 个技能关键词出现
  const summaryText = data.summary || '';
  const matchedKw = keywordList.filter(k => k.length >= 2 && summaryText.includes(k)).length;
  if (matchedKw >= 2) score += 5;
  else if (matchedKw === 1) score += 2;

  if (nonEmpty(data.summary) && matchedKw < 2 && kwCount > 0) {
    suggestions.push({
      dimension: 'keyword',
      message: '专业概述中可融入更多技能关键词，提升与岗位的匹配度',
      target: 'summary',
    });
  }

  return { score: Math.min(score, DIMENSION_MAX.keyword), suggestions };
}

/** 规范性维度（15 分） */
function scoreRegularity(data: ResumeData): { score: number; suggestions: Suggestion[] } {
  let score = 0;
  const suggestions: Suggestion[] = [];

  // 时间格式：experience/education/projects 的 time 字段
  const times: string[] = [];
  data.experience.forEach(e => times.push(e.time));
  data.education.forEach(e => times.push(e.time));
  data.projects.forEach(p => times.push(p.time));
  const validTimes = times.filter(t => nonEmpty(t) && TIME_RE.test(t)).length;
  if (times.length > 0) {
    score += Math.round((validTimes / times.length) * 5);
    if (validTimes < times.length) {
      suggestions.push({
        dimension: 'regularity',
        message: '时间格式建议统一为 YYYY.MM-YYYY.MM 或 YYYY.MM-至今',
      });
    }
  } else {
    score += 5;
  }

  // 联系方式格式
  let contactScore = 0;
  if (nonEmpty(data.phone)) {
    if (PHONE_RE.test(data.phone)) contactScore += 2.5;
    else suggestions.push({ dimension: 'regularity', message: '手机号格式不规范' });
  }
  if (nonEmpty(data.email)) {
    if (EMAIL_RE.test(data.email)) contactScore += 2.5;
    else suggestions.push({ dimension: 'regularity', message: '邮箱格式不规范' });
  }
  score += Math.round(contactScore);

  // 评价非空：无空文本项满分
  const emptyEval = data.evaluation.filter(e => !nonEmpty(e.text)).length;
  if (data.evaluation.length > 0) {
    if (emptyEval === 0) score += 5;
    else {
      score += Math.round(((data.evaluation.length - emptyEval) / data.evaluation.length) * 5);
      suggestions.push({
        dimension: 'regularity',
        message: '自我评价存在空项，请删除或补充内容',
        target: 'evaluation',
      });
    }
  } else {
    score += 5;
  }

  return { score: Math.min(score, DIMENSION_MAX.regularity), suggestions };
}

/** 根据总分计算等级 */
export function gradeOf(total: number): Grade {
  if (total >= 90) return '优秀';
  if (total >= 75) return '良好';
  if (total >= 60) return '合格';
  return '待改进';
}

/**
 * 计算简历健康度报告。
 * 纯函数，无副作用，便于单元测试与跨组件复用。
 */
export function calcHealthScore(data: ResumeData): HealthReport {
  const c = scoreCompleteness(data);
  const q = scoreQuantification(data);
  const r = scoreRichness(data);
  const k = scoreKeyword(data);
  const g = scoreRegularity(data);

  const dimensions: Record<DimensionKey, number> = {
    completeness: c.score,
    quantification: q.score,
    richness: r.score,
    keyword: k.score,
    regularity: g.score,
  };

  const total = c.score + q.score + r.score + k.score + g.score;
  const suggestions = [...c.suggestions, ...q.suggestions, ...r.suggestions, ...k.suggestions, ...g.suggestions];

  return {
    total,
    grade: gradeOf(total),
    dimensions,
    suggestions,
  };
}
