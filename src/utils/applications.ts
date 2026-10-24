import type { ApplicationStatus, JobApplication } from '@/types/applications';
import { APPLICATION_STATUSES } from '@/types/applications';

/** 投递漏斗阶段：各状态按进度累计（不合适不计入漏斗） */
export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  /** 已投递及之后进度（不含意向） */
  applied: number;
  /** 已沟通及之后 */
  communicated: number;
  /** 约面 + 面试 */
  interviewing: number;
  offer: number;
  closed: number;
}

const STATUS_LEVEL: Record<ApplicationStatus, number> = {
  意向: 0,
  已投递: 1,
  已沟通: 2,
  约面: 3,
  面试: 4,
  offer: 5,
  不合适: -1,
};

/** 汇总统计：数字结论只来自本地计算，与 AI 无关 */
export function calcApplicationStats(list: JobApplication[]): ApplicationStats {
  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const app of list) byStatus[app.status] += 1;

  const levelAtLeast = (min: number) =>
    list.filter((a) => STATUS_LEVEL[a.status] >= min).length;

  return {
    total: list.length,
    byStatus,
    applied: levelAtLeast(1),
    communicated: levelAtLeast(2),
    interviewing: levelAtLeast(3),
    offer: byStatus.offer,
    closed: byStatus['不合适'],
  };
}

/** 状态流转是否为一次「推进」（用于时间线措辞，仅展示用途） */
export function isForwardTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return STATUS_LEVEL[to] > STATUS_LEVEL[from];
}
