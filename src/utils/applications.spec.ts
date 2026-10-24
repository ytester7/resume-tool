import { describe, it, expect } from 'vitest';
import { calcApplicationStats, isForwardTransition } from './applications';
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
});

describe('isForwardTransition', () => {
  it('前进为 true，回退与终态为 false', () => {
    expect(isForwardTransition('已投递', '约面')).toBe(true);
    expect(isForwardTransition('面试', '已沟通')).toBe(false);
    expect(isForwardTransition('意向', '不合适')).toBe(false);
  });
});
