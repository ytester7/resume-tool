import { describe, it, expect } from 'vitest';
import { applyHiddenSections, mergeReorderedSections, sanitizeHiddenSections } from './hiddenSections';
import { defaultResumeData } from '@/types/resume';
import type { ResumeData } from '@/types/resume';

function sample(): ResumeData {
  return {
    ...defaultResumeData(),
    summary: '概述',
    skills: [{ id: 's1', category: '语言', items: 'Python', level: '精通' }],
    experience: [{
      id: 'e1', company: 'A', role: 'r', time: '2020', description: 'd', achievement: 'a', items: ['i'],
    }],
    projects: [{
      id: 'p1', name: 'p', time: '2021', role: 'r', background: 'b', subtitle: 's', achievement: 'a', items: ['i'],
    }],
    education: [{ id: 'ed1', school: 'S', major: 'M', degree: '本科', time: '2019' }],
    evaluation: [{ text: '踏实' }],
    customSections: [
      { id: 'c1', title: '证书', content: 'PMP' },
      { id: 'c2', title: '语言', content: 'CET-6' },
    ],
  };
}

describe('sanitizeHiddenSections', () => {
  it('保留内置区块与 custom: 前缀的区块', () => {
    expect(sanitizeHiddenSections(['skills', 'custom:c1'])).toEqual(['skills', 'custom:c1']);
  });

  it('丢弃未知值、空串、非字符串', () => {
    expect(sanitizeHiddenSections(['skills', 'unknown', '', null, 42, {}])).toEqual(['skills']);
  });

  it('去重', () => {
    expect(sanitizeHiddenSections(['skills', 'skills', 'custom:c1', 'custom:c1']))
      .toEqual(['skills', 'custom:c1']);
  });

  it('非数组输入返回空数组', () => {
    expect(sanitizeHiddenSections(undefined)).toEqual([]);
    expect(sanitizeHiddenSections('skills')).toEqual([]);
    expect(sanitizeHiddenSections({ 0: 'skills' })).toEqual([]);
  });

  it('custom: 后为空时不认为是合法自定义区块', () => {
    expect(sanitizeHiddenSections(['custom:'])).toEqual([]);
  });
});

describe('applyHiddenSections', () => {
  it('没有隐藏项时原样返回同一个对象（避免无谓重渲染）', () => {
    const data = sample();
    expect(applyHiddenSections(data, [])).toBe(data);
  });

  it('清空被隐藏的内置区块，其余保持不变', () => {
    const data = sample();
    const result = applyHiddenSections(data, ['skills', 'projects']);

    expect(result.skills).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.experience).toHaveLength(1);
    expect(result.summary).toBe('概述');
    expect(result.education).toHaveLength(1);
  });

  it('支持隐藏专业概述与自我评价', () => {
    const result = applyHiddenSections(sample(), ['summary', 'evaluation']);
    expect(result.summary).toBe('');
    expect(result.evaluation).toEqual([]);
  });

  it('按 id 剔除被隐藏的自定义区块', () => {
    const result = applyHiddenSections(sample(), ['custom:c1']);
    expect(result.customSections.map(c => c.id)).toEqual(['c2']);
  });

  it('不修改原始数据（纯函数）', () => {
    const data = sample();
    applyHiddenSections(data, ['skills']);
    expect(data.skills).toHaveLength(1);
  });
});

describe('mergeReorderedSections', () => {
  const order = ['summary', 'skills', 'experience', 'projects', 'education'] as const;

  it('没有隐藏模块时直接采用新顺序', () => {
    expect(mergeReorderedSections(
      [...order], [], ['skills', 'summary', 'experience', 'projects', 'education'],
    )).toEqual(['skills', 'summary', 'experience', 'projects', 'education']);
  });

  it('隐藏模块留在原位置，可见模块依次填入', () => {
    expect(mergeReorderedSections(
      [...order],
      ['experience'],
      ['skills', 'summary', 'education', 'projects'],
    )).toEqual(['skills', 'summary', 'experience', 'education', 'projects']);
  });

  it('全部隐藏时顺序不变', () => {
    expect(mergeReorderedSections([...order], [...order], [])).toEqual([...order]);
  });

  it('可见列表比预期短时，多出来的位置保留原值', () => {
    expect(mergeReorderedSections(
      [...order], ['skills'], ['education'],
    )).toEqual(['education', 'skills', 'experience', 'projects', 'education']);
  });
});
