import { z } from 'zod';
import type { AiProviderConfig } from '@/types/settings';
import type { ResumeData } from '@/types/resume';
import { chatCompletion, parseWithSchema } from './client';
import { JSON_ONLY_CONTRACT, SAFETY_SYSTEM, dataBlock } from './prompt';
import { collectPassages, formatPassageCatalog, resolveProposals } from './proposals';
import type { ResolvedProposal } from './proposals';

/**
 * AI 聊天助手（单轮提案式，无 tool-loop）：
 * 每轮把「最新段落目录 + 对话历史 + 用户请求」发给模型，
 * 模型返回 {reply, proposals}；提案走段落协议逐条人工采纳。
 *
 * 相比 RR 的 Agent 工具循环，这个设计少一层协议、完全可测，
 * 交互上等价：读简历靠目录、改简历靠提案、缺事实靠 reply 反问。
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantTurn {
  reply: string;
  proposals: ResolvedProposal[];
}

const turnSchema = z.object({
  reply: z.string().min(1).max(800),
  proposals: z.array(z.object({
    passageId: z.string().min(1).max(64),
    text: z.string().min(1).max(600),
    why: z.string().max(200).optional(),
    add: z.boolean().optional(),
  })).max(12),
});

const SYSTEM_PROMPT = `${SAFETY_SYSTEM}

你是简历编辑器里的 AI 助手。用户正在编辑一份简历，你可以通过「提案」帮他修改。

工作方式：
- 用户消息后附带简历段落目录（每行：id | 位置 | 文本）。你只能修改目录里列出的段落，用 passageId 引用
- 需要修改时：proposals 数组给出编辑（passageId + 改后的完整文本 text + 一句 why）；新增一条工作内容用 add: true（紧跟在参考段落之后插入）
- reply 只用一两句话说明你改了什么、为什么，不要在 reply 里重复改写全文；没有修改时 reply 正常回答或反问
- 缺少事实（数字、成果、时间）就直接在 reply 里问用户，绝不编造；需要量化但用户给不出时用「__%」留白
- 一次请求的编辑尽量打包在同一次返回里；每次最多 12 条
- 语言跟随简历语言（中文简历用中文）

${JSON_ONLY_CONTRACT}`;

const MAX_HISTORY_TURNS = 6;

export async function chatWithAssistant(
  config: AiProviderConfig,
  opts: { request: string; history: ChatTurn[]; data: ResumeData; jd?: string; materials?: { topic: string; material: string }[] },
): Promise<AssistantTurn> {
  const request = opts.request.trim();
  if (!request) throw new Error('请输入你的要求');

  const passages = collectPassages(opts.data);
  const catalog = formatPassageCatalog(passages);
  const jdBlock = opts.jd?.trim()
    ? `\n\n目标岗位 JD（用户已保存，供参考）：\n${dataBlock('JD_TEXT', opts.jd.trim().slice(0, 4000))}`
    : '';
  // 个人素材库：用户访谈沉淀的真实经历，最近的少量附带（总量限幅）
  const materialsText = (opts.materials ?? [])
    .slice(0, 10)
    .map((m) => `【${m.topic}】${m.material}`)
    .join('\n')
    .slice(0, 4000);
  const materialBlock = materialsText
    ? `\n\n用户素材库（用户真实经历，引用其中的内容不算编造，但不得添加其中没有的事实）：\n${dataBlock('MATERIALS', materialsText)}`
    : '';

  const history = opts.history.slice(-MAX_HISTORY_TURNS).map((t) => ({
    role: t.role,
    content: t.content,
  }));

  const raw = await chatCompletion(config, [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    {
      role: 'user',
      content: `${dataBlock('REQUEST', request)}\n\n简历段落目录：\n${dataBlock('CATALOG', catalog)}${jdBlock}${materialBlock}`,
    },
  ], { timeoutMs: 120_000 });

  const parsed = parseWithSchema(raw, turnSchema);
  return {
    reply: parsed.reply,
    proposals: resolveProposals(passages, parsed.proposals),
  };
}
