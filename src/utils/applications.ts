import type { ApplicationStatus, JobApplication } from '@/types/applications';
import { APPLICATION_STATUSES } from '@/types/applications';

/** 投递漏斗阶段：各状态按进度累计；「不合适」不占进度位，历史进度由 progressLevel 保留 */
export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  /** 已投递及之后进度（含后来关闭的记录，历史口径） */
  applied: number;
  /** 已沟通及之后 */
  communicated: number;
  /** 约面 + 面试 */
  interviewing: number;
  offer: number;
  closed: number;
}

export const STATUS_LEVEL: Record<ApplicationStatus, number> = {
  意向: 0,
  已投递: 1,
  已沟通: 2,
  约面: 3,
  面试: 4,
  offer: 5,
  不合适: -1,
};

/** 一条记录的有效进度：优先历史最高值，「不合适」按已走过的最远阶段计 */
function effectiveLevel(app: JobApplication): number {
  if (app.progressLevel !== undefined) return app.progressLevel;
  return Math.max(0, STATUS_LEVEL[app.status]);
}

/** 汇总统计：数字结论只来自本地计算，与 AI 无关 */
export function calcApplicationStats(list: JobApplication[]): ApplicationStats {
  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((s) => [s, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const app of list) byStatus[app.status] += 1;

  const levelAtLeast = (min: number) =>
    list.filter((a) => effectiveLevel(a) >= min).length;

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
