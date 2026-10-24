import { z } from 'zod';
import type { AiProviderConfig } from '@/types/settings';
import { chatCompletion, parseWithSchema } from './client';
import { JSON_ONLY_CONTRACT, SAFETY_SYSTEM, dataBlock } from './prompt';

/**
 * 单条润色：改写简历中的一行经历要点（移植自 RR improve 流程）。
 *
 * 契约 {text, why, addsFacts}：addsFacts=true 表示改写引入了原文没有的事实，
 * 调用方必须向用户展示核对提示；应用前需校验原文未变。
 */

export type ImproveMode = 'strong-verb' | 'add-result' | 'shorten' | 'custom';

export interface ImproveResult {
  text: string;
  why: string;
  addsFacts: boolean;
}

export interface ImproveContext {
  /** 该条所属的经历，如「字节跳动 · 后端工程师」 */
  owner: string;
  /** 同一经历下的相邻要点，供模型理解语境（不含被改行） */
  siblings?: string[];
  /** 自定义指令（mode=custom 时必填） */
  instruction?: string;
}

const resultSchema = z.object({
  text: z.string().min(1).max(600),
  why: z.string().min(1).max(300),
  addsFacts: z.boolean(),
});

const SYSTEM_PROMPT = `${SAFETY_SYSTEM}

你是一个简历要点改写器。用户给你一行经历要点（可能是中文或英文），你只改写这一行，输出改写结果。

改写要求：
- 输出单行文本：无换行、无列表符号、无 markdown 标记
- 保持原文的语言、时态、人称和术语
- 绝不编造数字、成果或事实；需要量化但原文没有时，用留白表达（如「效率提升 __%」）并把 addsFacts 设为 false
- 只有当你确实添加了原文没有的事实性内容时，才把 addsFacts 设为 true
- why 用一句话说明改了什么、为什么更好

${JSON_ONLY_CONTRACT}`;

const MODE_PROMPTS: Record<ImproveMode, string> = {
  'strong-verb': '改写重点：用更有力的动词开头，动作更具体，长度与原文相当。',
  'add-result': '改写重点：突出结果与影响，可用留白提示补充量化数据，不编造数字。',
  shorten: '改写重点：精简到一行内更短的表述，砍掉冗词但保留关键信息。',
  custom: '按用户指令改写。',
};

export async function improveLine(
  config: AiProviderConfig,
  line: string,
  mode: ImproveMode,
  context: ImproveContext,
): Promise<ImproveResult> {
  const text = line.trim();
  if (!text) throw new Error('内容为空，无需润色');
  if (mode === 'custom' && !context.instruction?.trim()) {
    throw new Error('请先填写自定义改写要求');
  }

  const siblings = (context.siblings ?? [])
    .map(s => s.trim())
    .filter(s => s && s !== text)
    .slice(0, 8);

  const userParts = [
    `所属经历：${context.owner || '（未提供）'}`,
    siblings.length ? `同一经历的其他要点（仅供理解语境，不要改写它们）：\n${dataBlock('SIBLINGS', siblings.join('\n'))}` : '',
    `改写要求：${MODE_PROMPTS[mode]}`,
    mode === 'custom' ? `用户指令：${context.instruction!.trim()}` : '',
    `待改写的这一行：\n${dataBlock('LINE', text)}`,
  ].filter(Boolean);

  const raw = await chatCompletion(config, [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userParts.join('\n\n') },
  ], { timeoutMs: 90_000 });

  const result = parseWithSchema(raw, resultSchema);
  // 单行纪律兜底：模型偶尔输出多行，压缩为单行
  return { ...result, text: result.text.replace(/\s*\n+\s*/g, ' ').trim() };
}
