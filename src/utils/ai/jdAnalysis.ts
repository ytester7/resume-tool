import { z } from 'zod';
import type { AiProviderConfig } from '@/types/settings';
import type { ResumeData, SectionKey } from '@/types/resume';
import { buildResumeText } from '@/utils/jdMatch';
import { chatCompletion, parseWithSchema } from './client';
import { JSON_ONLY_CONTRACT, SAFETY_SYSTEM, dataBlock } from './prompt';

/**
 * JD 深度分析：在本地关键词覆盖率（jdMatch.ts，免费且唯一出分）之上的
 * AI 语义分析层 —— 找语义缺口、给定位到区块的修改建议。
 *
 * 移植 RR ats-review-system 的纪律：AI 不输出分数/评级/百分比，
 * 数字结论只属于确定性规则；建议只基于简历已有内容，缺事实就标注出来。
 */

export interface JdSuggestion {
  section: SectionKey;
  issue: string;
  rewrite?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface JdAiAnalysis {
  summary: string;
  missingConcepts: string[];
  strengths: string[];
  suggestions: JdSuggestion[];
}

const analysisSchema = z.object({
  summary: z.string().min(1).max(500),
  missingConcepts: z.array(z.string().min(1).max(60)).max(12),
  strengths: z.array(z.string().min(1).max(60)).max(8),
  suggestions: z.array(z.object({
    section: z.enum(['summary', 'skills', 'experience', 'projects', 'education', 'evaluation']),
    issue: z.string().min(1).max(300),
    rewrite: z.string().max(600).optional(),
    impact: z.enum(['high', 'medium', 'low']),
  })).max(10),
});

const SYSTEM_PROMPT = `${SAFETY_SYSTEM}

你是一位资深简历审阅人。用户会提供目标岗位 JD 和他的简历全文，你做语义层面的匹配分析。

规则：
- 绝不输出分数、评级或百分比（匹配度数字由本地规则计算，与你无关）
- suggestions 只针对简历已有内容如何更好地对齐 JD；简历完全没提到的经历不要建议编造
- rewrite 是改写建议示例：只重组已有信息，不添加新事实；无法给出示例就省略该字段
- missingConcepts 是 JD 要求但简历缺失的能力/经验点，具体到可执行的粒度
- section 只能是：summary / skills / experience / projects / education / evaluation
- 使用简历的语言（中文简历用中文回复）

${JSON_ONLY_CONTRACT}`;

const MAX_TEXT = 20_000;

export async function analyzeJdWithAi(
  config: AiProviderConfig,
  jd: string,
  data: ResumeData,
): Promise<JdAiAnalysis> {
  const jdText = jd.trim();
  if (jdText.length < 20) throw new Error('JD 内容过少，请补充职位描述');

  const resumeText = buildResumeText(data).slice(0, MAX_TEXT) || '（简历内容为空）';

  const raw = await chatCompletion(config, [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `目标岗位 JD：\n${dataBlock('JD_TEXT', jdText)}\n\n简历全文：\n${dataBlock('RESUME_TEXT', resumeText)}`,
    },
  ], { timeoutMs: 120_000 });

  return parseWithSchema(raw, analysisSchema);
}
