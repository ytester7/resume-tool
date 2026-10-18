import type { ResumeData, SectionId } from '@/types/resume';
import { SECTION_KEYS } from '@/types/resume';

const SECTION_KEY_SET = new Set<string>(SECTION_KEYS);

/** 把任意输入收敛成合法的区块 id 列表：丢弃未知值、去重、去空 */
export function sanitizeHiddenSections(input: unknown): SectionId[] {
  if (!Array.isArray(input)) return [];
  const result: SectionId[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (!id) continue;
    const isBuiltin = SECTION_KEY_SET.has(id);
    const isCustom = id.startsWith('custom:') && id.length > 'custom:'.length;
    if (!isBuiltin && !isCustom) continue;
    if (!result.includes(id as SectionId)) result.push(id as SectionId);
  }
  return result;
}

/**
 * 把"可见模块的新顺序"合并回完整顺序：隐藏项留在原位，可见项按新顺序依次填入。
 *
 * 模块面板只渲染可见模块，拖拽后拿到的数组不含隐藏模块，
 * 直接覆盖会把隐藏模块从 sectionOrder 里弄丢（恢复时位置也没了）。
 */
export function mergeReorderedSections(
  order: SectionId[],
  hiddenSections: SectionId[],
  nextVisible: SectionId[],
): SectionId[] {
  const hidden = new Set<string>(hiddenSections);
  let cursor = 0;
  return order.map(id => (hidden.has(id) ? id : (nextVisible[cursor++] ?? id)));
}

/**
 * 返回"隐藏后的数据副本"：被隐藏的区块清空，自定义区块从数组里剔除。
 *
 * 13 套模板本来就用 `v-if="data.xxx.length"` / `sectionHasContent` 判断是否渲染，
 * 因此这里清空数据即可让模块整体消失，模板侧无需改动。
 */
export function applyHiddenSections(data: ResumeData, hidden: SectionId[]): ResumeData {
  if (hidden.length === 0) return data;
  const hiddenSet = new Set<string>(hidden);
  return {
    ...data,
    summary: hiddenSet.has('summary') ? '' : data.summary,
    skills: hiddenSet.has('skills') ? [] : data.skills,
    experience: hiddenSet.has('experience') ? [] : data.experience,
    projects: hiddenSet.has('projects') ? [] : data.projects,
    education: hiddenSet.has('education') ? [] : data.education,
    evaluation: hiddenSet.has('evaluation') ? [] : data.evaluation,
    customSections: data.customSections.filter(c => !hiddenSet.has(`custom:${c.id}`)),
  };
}
