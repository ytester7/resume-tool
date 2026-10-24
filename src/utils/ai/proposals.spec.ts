import { describe, it, expect } from 'vitest';
import { collectPassages, formatPassageCatalog, resolveProposals, applyProposal } from './proposals';
import type { AiEdit } from './proposals';
import { defaultResumeData } from '@/types/resume';
import { SAMPLE_RESUMES } from '@/data/samples';

function makeData() {
  const data = defaultResumeData();
  data.name = '陈默';
  data.summary = '五年测试开发经验';
  data.experience = [{
    id: 'exp1', company: '云舟科技', role: '测试开发工程师', time: '2023.06-至今',
    description: '负责平台质量保障', achievement: '缺陷逃逸率降低 40%', items: ['搭建自动化框架', '建设 CI 门禁'],
  }];
  data.evaluation = [{ text: '学习能力强' }, { text: '' }];
  data.customSections = [{ id: 'cs1', title: '证书', content: 'ISTQB' }];
  return data;
}

describe('collectPassages', () => {
  it('覆盖概述/评价/经历/自定义，跳过基本信息与空条目行', () => {
    const passages = collectPassages(makeData());

    const locations = passages.map((p) => p.location);
    expect(locations).toContain('专业概述');
    expect(locations).toContain('工作经历 · 云舟科技 · 描述');
    expect(locations).toContain('工作经历 · 云舟科技 · 第 1 条');
    expect(locations).toContain('自定义区块 · 证书');
    // 空的评价槽位也列出（可填充），空 items 行不列
    expect(passages.filter((p) => p.location.startsWith('自我评价'))).toHaveLength(2);
    const itemPassageTexts = passages
      .filter((p) => (p.location.startsWith('工作经历 · ') || p.location.startsWith('项目经历 · '))
        && p.location.includes('第 '))
      .map((p) => p.text);
    expect(itemPassageTexts).toEqual(['搭建自动化框架', '建设 CI 门禁']);
    // 姓名不是段落
    expect(passages.map((p) => p.text)).not.toContain('陈默');
  });

  it('id 是内容哈希：文本变化后 id 失效（防补丁打偏的核心机制）', () => {
    const data = makeData();
    const before = collectPassages(data);
    const summaryId = before.find((p) => p.location === '专业概述')!.id;

    data.summary = '六年测试开发经验';
    const after = collectPassages(data);
    expect(after.find((p) => p.location === '专业概述')!.id).not.toBe(summaryId);
  });

  it('目录格式：每行 id | 位置 | 文本预览，超长文本截断', () => {
    const data = makeData();
    data.summary = '长'.repeat(200);
    const catalog = formatPassageCatalog(collectPassages(data));
    const lines = catalog.split('\n');
    expect(lines[0]).toMatch(/^p_\w+ \| 专业概述 \| 长{120}…$/);
  });

  it('真实示例简历可完整收集且不超过上限', () => {
    const passages = collectPassages(SAMPLE_RESUMES[0].data);
    expect(passages.length).toBeGreaterThan(5);
    expect(passages.length).toBeLessThanOrEqual(150);
  });
});

describe('resolveProposals', () => {
  const data = makeData();
  const passages = collectPassages(data);
  const summaryPassage = passages.find((p) => p.location === '专业概述')!;
  const item1 = passages.find((p) => p.location === '工作经历 · 云舟科技 · 第 1 条')!;

  it('合法编辑解析为 pending', () => {
    const edits: AiEdit[] = [{ passageId: summaryPassage.id, text: '五年测试开发与质量建设经验', why: '更聚焦' }];
    const [p] = resolveProposals(passages, edits);
    expect(p.status).toBe('pending');
    expect(p.after).toBe('五年测试开发与质量建设经验');
    expect(p.why).toBe('更聚焦');
  });

  it('未知 id（模型基于旧目录）落为 stale 且不抛错', () => {
    const [p] = resolveProposals(passages, [{ passageId: 'p_deadbeef', text: 'x' }]);
    expect(p.status).toBe('stale');
    expect(p.passage).toBeNull();
  });

  it('文本相同落为 no-change，同一目标重复提案落为 duplicate', () => {
    const edits: AiEdit[] = [
      { passageId: summaryPassage.id, text: data.summary },
      { passageId: summaryPassage.id, text: '换个说法' },
    ];
    const [a, b] = resolveProposals(passages, edits);
    expect(a.status).toBe('no-change');
    expect(b.status).toBe('duplicate');
  });

  it('add 只对条目类目标生效，对描述字段退化为替换', () => {
    const edits: AiEdit[] = [
      { passageId: item1.id, text: '新增的一条', add: true },
      { passageId: summaryPassage.id, text: '概述更新', add: true },
    ];
    const [a, b] = resolveProposals(passages, edits);
    expect(a.add).toBe(true);
    expect(b.add).toBe(false);
  });
});

describe('applyProposal', () => {
  it('替换概述并返回新数据，原对象不被修改', () => {
    const data = makeData();
    const [proposal] = resolveProposals(collectPassages(data), [
      { passageId: collectPassages(data).find((p) => p.location === '专业概述')!.id, text: '新概述' },
    ]);

    const result = applyProposal(data, proposal);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.summary).toBe('新概述');
      expect(data.summary).toBe('五年测试开发经验');
    }
  });

  it('替换条目与在条目后插入新条目', () => {
    const data = makeData();
    const passages = collectPassages(data);
    const item1 = passages.find((p) => p.location === '工作经历 · 云舟科技 · 第 1 条')!;

    const replace = resolveProposals(passages, [{ passageId: item1.id, text: '从零搭建自动化框架' }])[0];
    const ok = applyProposal(data, replace);
    expect(ok.ok && ok.data.experience[0].items[0]).toBe('从零搭建自动化框架');

    const fresh = makeData();
    const freshPassages = collectPassages(fresh);
    const first = freshPassages.find((p) => p.location === '工作经历 · 云舟科技 · 第 1 条')!;
    const insert = resolveProposals(freshPassages, [{ passageId: first.id, text: '建设质量看板', add: true }])[0];
    const ok2 = applyProposal(fresh, insert);
    expect(ok2.ok && ok2.data.experience[0].items).toEqual(['搭建自动化框架', '建设质量看板', '建设 CI 门禁']);
  });

  it('生成提案后原文被改 → 拒绝写入（stale 防线）', () => {
    const data = makeData();
    const passages = collectPassages(data);
    const item1 = passages.find((p) => p.location === '工作经历 · 云舟科技 · 第 1 条')!;
    const proposal = resolveProposals(passages, [{ passageId: item1.id, text: '改写' }])[0];

    // 模拟用户在 AI 生成提案后手改了这一行
    data.experience[0].items[0] = '用户手动改过的行';
    const result = applyProposal(data, proposal);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('stale');
  });

  it('非 pending 状态（stale/duplicate）不允许应用', () => {
    const data = makeData();
    const stale = resolveProposals(collectPassages(data), [{ passageId: 'p_x', text: 'y' }])[0];
    expect(applyProposal(data, stale)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('评价空槽位可被填充', () => {
    const data = makeData();
    const emptyEv = collectPassages(data).find((p) => p.location === '自我评价 · 第 2 条')!;
    const proposal = resolveProposals(collectPassages(data), [{ passageId: emptyEv.id, text: '责任心强' }])[0];
    const ok = applyProposal(data, proposal);
    expect(ok.ok && ok.data.evaluation[1].text).toBe('责任心强');
  });
});
