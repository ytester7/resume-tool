import { z } from 'zod';
import type { AiProviderConfig } from '@/types/settings';
import type { ResumeImportDraft } from '@/types/import';
import { normalizeResumeData } from '@/utils/parseResume';
import { chatCompletion, parseWithSchema } from './client';
import { JSON_ONLY_CONTRACT, SAFETY_SYSTEM, dataBlock } from './prompt';

/**
 * AI 解析导入：把旧简历的原始文本结构化为 ResumeData。
 *
 * 严格抽取引擎（移植自 RR parser-system 的纪律）：
 * 只取显式信息、绝不推断、不确定就留空 —— 宁可少填，不可编造。
 * 返回同一个 ResumeImportDraft 契约，导入确认弹窗无差别复用。
 */

/** AI 输出契约：全部字段可选、全部字符串宽容处理，缺什么由 normalizeResumeData 兜底 */
const aiResumeSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  age: z.string().optional(),
  experienceYears: z.string().optional(),
  jobIntention: z.string().optional(),
  salary: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.object({
    category: z.string().optional(),
    items: z.string().optional(),
    level: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    time: z.string().optional(),
    description: z.string().optional(),
    achievement: z.string().optional(),
    items: z.array(z.string()).optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string().optional(),
    time: z.string().optional(),
    role: z.string().optional(),
    background: z.string().optional(),
    subtitle: z.string().optional(),
    achievement: z.string().optional(),
    items: z.array(z.string()).optional(),
  })).optional(),
  education: z.array(z.object({
    school: z.string().optional(),
    major: z.string().optional(),
    degree: z.string().optional(),
    time: z.string().optional(),
  })).optional(),
  evaluation: z.array(z.string()).optional(),
});

const SYSTEM_PROMPT = `${SAFETY_SYSTEM}

你是一个严格的简历信息抽取引擎。用户会提供一份简历的原始文本（可能来自 PDF/Word 抽取，含噪声），你把它抽取成结构化 JSON。

抽取纪律：
- 只抽取文本中明确出现的信息，绝不推断、补全或改写事实
- 某字段不确定或文本中没有：留空字符串 / 空数组，不要猜
- 日期保持原文格式（如 2020.03-2023.06 / 2020.03-至今）
- 工作内容的每条要点对应 items 数组的一个字符串，去掉条目符号本身
- evaluation 是自我评价句子的数组
- skills.level 只能是：精通 / 熟练 / 了解，原文没有等级信息就留空
- 输出语言与原文一致

${JSON_ONLY_CONTRACT}`;

const MAX_TEXT_LENGTH = 12_000;

/** 基于非空字段占比给出诚实的完整度（AI 解析不做规则打分，仅反映覆盖面） */
function coverageConfidence(data: ReturnType<typeof normalizeResumeData>): number {
  const scalars = ['name', 'title', 'phone', 'email', 'summary', 'jobIntention'] as const;
  const lists = ['skills', 'experience', 'projects', 'education'] as const;
  const filled = scalars.filter(k => data[k].trim()).length + lists.filter(k => data[k].length > 0).length;
  return Math.round((filled / (scalars.length + lists.length)) * 100);
}

export async function aiParseResumeText(
  config: AiProviderConfig,
  draft: ResumeImportDraft,
): Promise<ResumeImportDraft> {
  const text = draft.rawText.trim().slice(0, MAX_TEXT_LENGTH);
  if (text.length < 20) {
    throw new Error('原文内容过少，无法解析');
  }

  const raw = await chatCompletion(config, [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `请抽取这份简历：\n\n${dataBlock('RESUME_TEXT', text)}` },
  ], { timeoutMs: 120_000 });

  const parsed = parseWithSchema(raw, aiResumeSchema);
  const data = normalizeResumeData(parsed);

  return {
    ...draft,
    data,
    warnings: ['以上为 AI 解析结果，请逐条核对后再导入'],
    confidence: coverageConfidence(data),
    structured: false,
    aiAssisted: true,
  };
}
