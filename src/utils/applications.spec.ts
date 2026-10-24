import { describe, it, expect } from 'vitest';
import { calcApplicationStats } from './applications';
import type { JobApplication } from '@/types/applications';

function makeApp(status: JobApplication['status'], overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: `id-${Math.random().toString(36).slice(2)}`,
    company: 'A公司', position: '测试开发', channel: 'boss',
    status, jd: '', link: '', resumeTitle: '',
    createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
    notes: [],
    ...overrides,
  };
}

describe('calcApplicationStats', () => {
  it('空列表：全零', () => {
    const stats = calcApplicationStats([]);
    expect(stats.total).toBe(0);
    expect(stats.applied).toBe(0);
    expect(stats.offer).toBe(0);
  });

  it('各状态计数正确', () => {
    const stats = calcApplicationStats([
      makeApp('意向'), makeApp('意向'),
      makeApp('已投递'),
      makeApp('约面'),
      makeApp('offer'),
      makeApp('不合适'),
    ]);
    expect(stats.byStatus['意向']).toBe(2);
    expect(stats.byStatus['已投递']).toBe(1);
    expect(stats.byStatus['offer']).toBe(1);
    expect(stats.byStatus['不合适']).toBe(1);
    expect(stats.total).toBe(6);
  });

  it('漏斗按进度累计：面试含约面，不合适不计入', () => {
    const stats = calcApplicationStats([
      makeApp('意向'),      // 不计入 applied
      makeApp('已投递'),    // applied
      makeApp('已沟通'),    // applied + communicated
      makeApp('约面'),      // applied + communicated + interviewing
      makeApp('面试'),      // 同上
      makeApp('offer'),     // 全部
      makeApp('不合适'),    // 只进 closed
    ]);
    expect(stats.applied).toBe(5);
    expect(stats.communicated).toBe(4);
    expect(stats.interviewing).toBe(3);
    expect(stats.offer).toBe(1);
    expect(stats.closed).toBe(1);
  });

  it('历史口径：走到面试后关闭的记录仍计入 applied/communicated/interviewing', () => {
    const closedAfterInterview = makeApp('不合适');
    closedAfterInterview.progressLevel = 4; // 曾到「面试」
    const closedAtIntention = makeApp('不合适'); // 意向阶段就放弃
    closedAtIntention.progressLevel = 0;

    const stats = calcApplicationStats([closedAfterInterview, closedAtIntention]);
    expect(stats.applied).toBe(1);
    expect(stats.communicated).toBe(1);
    expect(stats.interviewing).toBe(1);
    expect(stats.closed).toBe(2);
  });

  it('缺 progressLevel 的旧数据按当前状态回填口径（不合适视为 0）', () => {
    const stats = calcApplicationStats([makeApp('已沟通'), makeApp('不合适')]);
    expect(stats.applied).toBe(1);
    expect(stats.communicated).toBe(1);
  });
});
