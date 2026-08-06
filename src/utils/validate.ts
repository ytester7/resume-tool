import type { ResumeData } from '@/types/resume';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const STRING_FIELDS: (keyof ResumeData)[] = [
  'name', 'title', 'phone', 'email', 'age', 'experienceYears',
  'jobIntention', 'salary', 'github', 'website', 'summary',
];

const ARRAY_FIELDS: (keyof ResumeData)[] = [
  'skills', 'experience', 'projects', 'education', 'customSections',
];

export function validateResume(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据格式不是对象'], warnings: [] };
  }
  const r = data as Record<string, any>;

  for (const f of STRING_FIELDS) {
    if (r[f] !== undefined && typeof r[f] !== 'string') {
      errors.push(`${f} 必须是字符串`);
    }
  }

  for (const f of ARRAY_FIELDS) {
    if (r[f] !== undefined && !Array.isArray(r[f])) {
      errors.push(`${f} 必须是数组`);
    }
  }

  if (typeof r.evaluation === 'string') {
    warnings.push('检测到旧版 evaluation 格式，已自动转换');
  } else if (r.evaluation !== undefined && !Array.isArray(r.evaluation)) {
    warnings.push('evaluation 字段格式异常，已使用默认值');
  }

  if (Array.isArray(r.skills)) {
    r.skills.forEach((s: any, i: number) => {
      if (typeof s !== 'object' || s === null) {
        errors.push(`skills[${i}] 不是对象`);
      }
    });
  }
  if (Array.isArray(r.experience)) {
    r.experience.forEach((e: any, i: number) => {
      if (typeof e !== 'object' || e === null) {
        errors.push(`experience[${i}] 不是对象`);
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}
