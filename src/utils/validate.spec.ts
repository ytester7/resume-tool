import { describe, it, expect } from 'vitest';
import { validateResume } from './validate';
import { defaultResumeData } from '@/types/resume';

describe('validateResume', () => {
  it('合法数据返回 valid', () => {
    const r = validateResume(defaultResumeData());
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('skills 非数组报错', () => {
    const r = validateResume({ ...defaultResumeData(), skills: 'x' as any });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('skills 必须是数组');
  });

  it('experience 非数组报错', () => {
    const r = validateResume({ ...defaultResumeData(), experience: 123 as any });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('experience'))).toBe(true);
  });

  it('evaluation 字符串给出 warning', () => {
    const r = validateResume({ ...defaultResumeData(), evaluation: '旧版字符串' as any });
    expect(r.warnings.some(w => w.includes('evaluation'))).toBe(true);
  });

  it('name 非字符串报错', () => {
    const r = validateResume({ ...defaultResumeData(), name: 123 as any });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('null 输入报错', () => {
    const r = validateResume(null);
    expect(r.valid).toBe(false);
  });

  it('skills 项非对象报错', () => {
    const r = validateResume({ ...defaultResumeData(), skills: ['str', null] as any });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('skills[0]'))).toBe(true);
  });
});
