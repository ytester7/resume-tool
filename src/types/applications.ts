/** 投递记录：本地台账，跨简历全局，与任何平台无网络交互 */

export type ApplicationChannel = 'boss' | 'lagou' | 'zhilian' | 'liepin' | 'other';

export const CHANNEL_LABELS: Record<ApplicationChannel, string> = {
  boss: 'Boss直聘',
  lagou: '拉勾',
  zhilian: '智联',
  liepin: '猎聘',
  other: '其他',
};

/** 状态沿求职进度排列；「不合适」为终态（主动放弃或被拒） */
export const APPLICATION_STATUSES = [
  '意向', '已投递', '已沟通', '约面', '面试', 'offer', '不合适',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationNote {
  /** ISO 时间戳 */
  at: string;
  text: string;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  channel: ApplicationChannel;
  status: ApplicationStatus;
  /** JD 快照：粘贴保存时的原文，供岗位匹配与 AI 分析复用 */
  jd: string;
  /** 岗位链接（仅作备忘，工具不会访问它） */
  link: string;
  /** 关联的简历版本标题（按此岗位派生版本后回填） */
  resumeTitle: string;
  createdAt: string;
  updatedAt: string;
  notes: ApplicationNote[];
}

/** localStorage 持久化键 */
export const APPLICATIONS_STORAGE_KEY = 'resume_applications_v1';
