import { toRaw } from 'vue';
import type { ResumeData } from '@/types/resume';

/**
 * 段落提案协议（移植自 Reactive Resume proposals.ts，适配本项目的扁平纯字符串字段）。
 *
 * 核心防呆：
 * - passage id = 目标路径 + 当前文本的内容哈希 —— 文本一变 id 即失效，
 *   模型基于旧目录的编辑会自然落为 stale，不会打偏
 * - 采纳时用「当前文本 === 提案时文本」做最后一道校验
 * - AI 只产纯文本；写入永远经过用户点击采纳
 */

export type PassageTarget =
  | { section: 'summary' }
  | { section: 'evaluation'; index: number }
  | { section: 'experience'; itemId: string; field: 'description' | 'achievement' }
  | { section: 'experience'; itemId: string; field: 'items'; index: number }
  | { section: 'projects'; itemId: string; field: 'background' | 'subtitle' | 'achievement' }
  | { section: 'projects'; itemId: string; field: 'items'; index: number }
  | { section: 'custom'; itemId: string };

export interface Passage {
  id: string;
  /** 当前原文；显式字段槽位（概述/描述等）即使为空也列出，供 AI 填充 */
  text: string;
  /** 人类可读位置，如「工作经历 · A公司 · 第 2 条」 */
  location: string;
  target: PassageTarget;
}

export interface AiEdit {
  passageId: string;
  text: string;
  why?: string;
  /** true = 在该段落之后插入新条目（仅 items 类目标），false = 替换原文 */
  add?: boolean;
}

export type ProposalStatus = 'pending' | 'stale' | 'no-change' | 'duplicate';

export interface ResolvedProposal {
  passageId: string;
  /** stale（目录里找不到该 id）时为 null */
  passage: Passage | null;
  after: string;
  why: string;
  add: boolean;
  status: ProposalStatus;
}

/** 目录条目上限：超出时截断，防止超长简历撑爆上下文 */
const MAX_PASSAGES = 150;

/** FNV-1a 32 位哈希（与 RR 同款算法），输出短 id */
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function targetKey(t: PassageTarget): string {
  switch (t.section) {
    case 'summary':
      return 'summary';
    case 'evaluation':
      return `evaluation.${t.index}`;
    case 'custom':
      return `custom.${t.itemId}`;
    default:
      return `${t.section}.${t.itemId}.${t.field}${'index' in t ? `.${t.index}` : ''}`;
  }
}

function makePassage(text: string, location: string, target: PassageTarget): Passage {
  const key = targetKey(target);
  return {
    id: `p_${fnv1a(`${key}|${text}`)}`,
    text,
    location,
    target,
  };
}

/**
 * 把简历可编辑文本收集成段落目录。
 *
 * 收录：专业概述、自我评价各槽位、工作/项目经历的描述与关键成果字段、
 * 逐条工作/项目内容（仅非空行）、自定义区块正文。
 * 不收录：基本信息（姓名电话等不该交给 AI 改）、技能关键词表、教育时间线。
 */
export function collectPassages(data: ResumeData): Passage[] {
  const passages: Passage[] = [];
  passages.push(makePassage(data.summary, '专业概述', { section: 'summary' }));

  data.evaluation.forEach((ev, i) => {
    passages.push(makePassage(ev.text, `自我评价 · 第 ${i + 1} 条`, { section: 'evaluation', index: i }));
  });

  for (const exp of data.experience) {
    const owner = `工作经历 · ${exp.company || '未命名公司'}`;
    passages.push(makePassage(exp.description, `${owner} · 描述`, { section: 'experience', itemId: exp.id, field: 'description' }));
    passages.push(makePassage(exp.achievement, `${owner} · 关键成果`, { section: 'experience', itemId: exp.id, field: 'achievement' }));
    exp.items.forEach((line, i) => {
      if (!line.trim()) return;
      passages.push(makePassage(line, `${owner} · 第 ${i + 1} 条`, { section: 'experience', itemId: exp.id, field: 'items', index: i }));
    });
  }

  for (const proj of data.projects) {
    const owner = `项目经历 · ${proj.name || '未命名项目'}`;
    passages.push(makePassage(proj.background, `${owner} · 背景与目标`, { section: 'projects', itemId: proj.id, field: 'background' }));
    passages.push(makePassage(proj.subtitle, `${owner} · 成果标题`, { section: 'projects', itemId: proj.id, field: 'subtitle' }));
    passages.push(makePassage(proj.achievement, `${owner} · 关键成果`, { section: 'projects', itemId: proj.id, field: 'achievement' }));
    proj.items.forEach((line, i) => {
      if (!line.trim()) return;
      passages.push(makePassage(line, `${owner} · 第 ${i + 1} 条`, { section: 'projects', itemId: proj.id, field: 'items', index: i }));
    });
  }

  for (const cs of data.customSections) {
    passages.push(makePassage(cs.content, `自定义区块 · ${cs.title || '未命名'}`, { section: 'custom', itemId: cs.id }));
  }

  return passages.slice(0, MAX_PASSAGES);
}

/** 把目录编排成给模型的紧凑清单（每行：id | 位置 | 文本预览） */
export function formatPassageCatalog(passages: Passage[]): string {
  return passages
    .map((p) => {
      const preview = p.text.length > 120 ? `${p.text.slice(0, 120)}…` : p.text;
      return `${p.id} | ${p.location} | ${preview || '（空，可填写）'}`;
    })
    .join('\n');
}

/** 校验 AI 编辑清单：id 失效 / 无变化 / 重复目标就地标注，不抛错 */
export function resolveProposals(passages: Passage[], edits: AiEdit[]): ResolvedProposal[] {
  const byId = new Map(passages.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const out: ResolvedProposal[] = [];

  for (const edit of edits) {
    const passage = byId.get(edit.passageId) ?? null;
    const after = edit.text.trim();
    const why = (edit.why ?? '').trim();
    const add = edit.add === true && passage !== null && 'index' in passage.target;

    if (!passage) {
      out.push({ passageId: edit.passageId, passage: null, after, why, add: false, status: 'stale' });
      continue;
    }
    if (seen.has(edit.passageId)) {
      out.push({ passageId: edit.passageId, passage, after, why, add, status: 'duplicate' });
      continue;
    }
    seen.add(edit.passageId);
    if (!add && after === passage.text.trim()) {
      out.push({ passageId: edit.passageId, passage, after, why, add, status: 'no-change' });
      continue;
    }
    out.push({ passageId: edit.passageId, passage, after, why, add, status: 'pending' });
  }
  return out;
}

export type ApplyResult = { ok: true; data: ResumeData } | { ok: false; reason: 'stale' | 'invalid' };

/**
 * 把一条 pending 提案应用到简历数据，返回新数据（不改原对象）。
 * 写入前用「当前文本 === 段落文本」校验，防用户在提案生成后又改过原文。
 */
export function applyProposal(data: ResumeData, proposal: ResolvedProposal): ApplyResult {
  if (!proposal.passage || proposal.status !== 'pending') return { ok: false, reason: 'invalid' };
  const clone = structuredClone(toRaw(data)) as ResumeData;
  const target = proposal.passage.target;

  const currentItemText = (): string | null => {
    switch (target.section) {
      case 'summary':
        return clone.summary;
      case 'evaluation':
        return clone.evaluation[target.index]?.text ?? null;
      case 'custom': {
        const cs = clone.customSections.find((c) => c.id === target.itemId);
        return cs ? cs.content : null;
      }
      case 'experience': {
        const item = clone.experience.find((e) => e.id === target.itemId);
        if (!item) return null;
        if (target.field === 'items') return item.items[target.index] ?? null;
        return item[target.field];
      }
      case 'projects': {
        const item = clone.projects.find((e) => e.id === target.itemId);
        if (!item) return null;
        if (target.field === 'items') return item.items[target.index] ?? null;
        return item[target.field];
      }
    }
  };

  const write = (): boolean => {
    switch (target.section) {
      case 'summary':
        clone.summary = proposal.after;
        return true;
      case 'evaluation': {
        const ev = clone.evaluation[target.index];
        if (!ev) return false;
        ev.text = proposal.after;
        return true;
      }
      case 'custom': {
        const cs = clone.customSections.find((c) => c.id === target.itemId);
        if (!cs) return false;
        cs.content = proposal.after;
        return true;
      }
      case 'experience': {
        const item = clone.experience.find((e) => e.id === target.itemId);
        if (!item) return false;
        if (target.field === 'items') {
          if (proposal.add) item.items.splice(target.index + 1, 0, proposal.after);
          else if (item.items[target.index] !== undefined) item.items[target.index] = proposal.after;
          else return false;
          return true;
        }
        item[target.field] = proposal.after;
        return true;
      }
      case 'projects': {
        const item = clone.projects.find((e) => e.id === target.itemId);
        if (!item) return false;
        if (target.field === 'items') {
          if (proposal.add) item.items.splice(target.index + 1, 0, proposal.after);
          else if (item.items[target.index] !== undefined) item.items[target.index] = proposal.after;
          else return false;
          return true;
        }
        item[target.field] = proposal.after;
        return true;
      }
    }
  };

  const current = currentItemText();
  if (current === null) return { ok: false, reason: 'stale' };
  // 生成提案后原文被改过：拒绝盲写（add 插入不占位，也校验锚点行未变）
  if (current.trim() !== proposal.passage.text.trim()) return { ok: false, reason: 'stale' };
  if (!write()) return { ok: false, reason: 'stale' };
  return { ok: true, data: clone };
}
