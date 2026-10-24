import { z } from 'zod';
import type { AiProviderConfig } from '@/types/settings';
import type { ResumeData } from '@/types/resume';
import { buildResumeText } from '@/utils/jdMatch';
import { chatCompletion, parseWithSchema } from './client';
import { JSON_ONLY_CONTRACT, SAFETY_SYSTEM, dataBlock } from './prompt';
import { collectPassages, formatPassageCatalog, resolveProposals } from './proposals';
import type { AiEdit, ResolvedProposal } from './proposals';

/**
 * 简历优化工程师：结构化的岗位定制工作流。
 *
 * 三步走（每步都是一次显式点击触发，遵守隐私红线）：
 * 1. 差距分析 —— JD vs 简历，产出优势与差距（差距分「可直接强化」与「需补充真实素材」）
 * 2. 素材访谈 —— 对缺素材的差距向用户提问真实工作情况，浓缩为事实性素材
 *    （反编造核心：AI 只整理用户说过的话，不添加任何用户未提供的内容）
 * 3. 提案生成 —— 基于简历原文 + 访谈素材产出段落提案，走既有人工采纳机制
 */

export type GapKind = 'polish' | 'needs-material';

export interface OptimizerGap {
  /** 客户端分配的稳定 id（g1、g2…），不用模型输出的序号 */
  id: string;
  topic: string;
  kind: GapKind;
  question?: string;
}

export interface OptimizerAnalysis {
  summary: string;
  strengths: string[];
  gaps: OptimizerGap[];
}

export interface GapMaterial {
  enough: boolean;
  followUp?: string;
  material: string;
}

export interface OptimizerTurn {
  reply: string;
  proposals: ResolvedProposal[];
}

// —— 第一步：差距分析 ——

const analysisSchema = z.object({
  summary: z.string().min(1).max(400),
  strengths: z.array(z.string().min(1).max(40)).max(6),
  gaps: z.array(z.object({
    topic: z.string().min(1).max(40),
    kind: z.enum(['polish', 'needs-material']),
    question: z.string().max(200).optional(),
  })).max(6),
});

const ANALYSIS_SYSTEM = `${SAFETY_SYSTEM}

你是简历优化工程师。用户给你目标岗位 JD 和他的简历全文，你做差距分析。

输出规则：
- strengths：简历已对齐 JD 的能力点（简洁词条，最多 6 条）
- gaps：JD 要求但简历薄弱的点，按重要度排序，最多 6 条，分两类：
  - kind 为 "polish"：相关素材简历里已有，只是表达、位置或量化不足，不需要向用户提问
  - kind 为 "needs-material"：简历完全没有相关内容，必须给出 question——一句面向用户真实工作经历的提问（如「你在实际工作中是否用过 X？具体做过什么？」），绝不假设用户具备该经验
- 不输出分数、评级或百分比
- 使用简历的语言

${JSON_ONLY_CONTRACT}`;

export async function analyzeGaps(
  config: AiProviderConfig,
  opts: { jd: string; data: ResumeData },
): Promise<OptimizerAnalysis> {
  const jd = opts.jd.trim();
  if (jd.length < 20) throw new Error('JD 内容过少，请先补充岗位描述');

  const raw = await chatCompletion(config, [
    { role: 'system', content: ANALYSIS_SYSTEM },
    {
      role: 'user',
      content: `目标岗位 JD：\n${dataBlock('JD_TEXT', jd)}\n\n简历全文：\n${dataBlock('RESUME_TEXT', buildResumeText(opts.data).slice(0, 20_000) || '（简历内容为空）')}`,
    },
  ], { timeoutMs: 120_000 });

  const parsed = parseWithSchema(raw, analysisSchema);
  return {
    summary: parsed.summary,
    strengths: parsed.strengths,
    gaps: parsed.gaps.map((g, i) => ({
      id: `g${i + 1}`,
      topic: g.topic,
      kind: g.kind,
      // polish 类不需要问题；needs-material 缺问题就降级为 polish（不阻塞流程）
      question: g.kind === 'needs-material' ? g.question : undefined,
    })),
  };
}

// —— 第二步：素材访谈 ——

const materialSchema = z.object({
  enough: z.boolean(),
  followUp: z.string().max(200).optional(),
  material: z.string().max(600),
});

const MATERIAL_SYSTEM = `${SAFETY_SYSTEM}

你是简历优化工程师的访谈助手。针对一个差距点，用户刚回答了你的提问。判断素材是否足够写进简历：

- 素材足够 → enough=true，material 用第三人称浓缩用户真实经历的事实（保留具体技术、数据、场景，剔除寒暄），不添加用户没有说过的任何内容
- 素材太笼统或答非所问 → enough=false，给 followUp 一个更具体的追问；material 留空字符串
- 用户明确表示没有相关经验 → enough=true，material 填「（用户无相关经验）」，后续不会为它生成内容

${JSON_ONLY_CONTRACT}`;

export async function collectMaterial(
  config: AiProviderConfig,
  opts: { jd: string; topic: string; question: string; answer: string; allowFollowUp: boolean },
): Promise<GapMaterial> {
  const answer = opts.answer.trim();
  if (!answer) throw new Error('请先填写你的实际情况');

  const raw = await chatCompletion(config, [
    { role: 'system', content: MATERIAL_SYSTEM },
    {
      role: 'user',
      content: `目标岗位 JD：\n${dataBlock('JD_TEXT', opts.jd.trim().slice(0, 4000))}\n\n差距点：${opts.topic}\n你的提问：${opts.question}\n用户回答：\n${dataBlock('ANSWER', answer.slice(0, 4000))}\n\n${opts.allowFollowUp ? '素材不足时可以追问一次。' : '已无追问机会，请基于现有回答判断；确实不够就 enough=false 且不给 followUp。'}`,
    },
  ], { timeoutMs: 90_000 });

  const parsed = parseWithSchema(raw, materialSchema);
  // 追问额度用尽时强制收敛，不让流程卡死
  if (!parsed.enough && !opts.allowFollowUp) {
    return { enough: true, material: parsed.material || answer.slice(0, 300) };
  }
  return parsed;
}

// —— 第三步：提案生成 ——

export interface OptimizerMaterial {
  topic: string;
  material: string;
}

const proposalsSchema = z.object({
  reply: z.string().min(1).max(500),
  proposals: z.array(z.object({
    passageId: z.string().min(1).max(64),
    text: z.string().min(1).max(600),
    why: z.string().max(200).optional(),
    add: z.boolean().optional(),
  })).max(10),
});

const PROPOSALS_SYSTEM = `${SAFETY_SYSTEM}

你是简历优化工程师。基于目标 JD、简历段落目录和用户访谈提供的真实素材，产出优化提案。

铁律——每条提案里的每个事实必须来自以下两者之一：
- 简历原文（段落目录中可见）
- 某条访谈素材（下方 MATERIALS 块）
两者都没有的细节一律用留白（如「__%」）或直接省略，绝不编造。

提案规则：
- 素材支持的新经历用 add:true 紧跟在最贴近的段落之后插入，why 注明「基于你的真实素材：<差距点>」
- 优先强化与 JD 差距最大的段落；一次最多 10 条
- reply 用一两句话说明优化策略，不要复述提案全文
- 语言跟随简历

${JSON_ONLY_CONTRACT}`;

export async function generateOptimizerProposals(
  config: AiProviderConfig,
  opts: { jd: string; data: ResumeData; materials: OptimizerMaterial[] },
): Promise<OptimizerTurn> {
  const passages = collectPassages(opts.data);
  const catalog = formatPassageCatalog(passages);
  const materials = opts.materials.filter((m) => m.material.trim() && !m.material.includes('（用户无相关经验）'));
  const materialBlock = materials.length
    ? `\n\n访谈素材（用户真实经历，提案事实只能来自这里或简历原文）：\n${dataBlock('MATERIALS', materials.map((m) => `【${m.topic}】${m.material}`).join('\n'))}`
    : '';

  const raw = await chatCompletion(config, [
    { role: 'system', content: PROPOSALS_SYSTEM },
    {
      role: 'user',
      content: `目标岗位 JD：\n${dataBlock('JD_TEXT', opts.jd.trim().slice(0, 6000))}\n\n简历段落目录：\n${dataBlock('CATALOG', catalog)}${materialBlock}`,
    },
  ], { timeoutMs: 120_000 });

  const parsed = parseWithSchema(raw, proposalsSchema);
  const edits: AiEdit[] = parsed.proposals;
  return { reply: parsed.reply, proposals: resolveProposals(passages, edits) };
}
