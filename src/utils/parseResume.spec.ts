import { describe, it, expect } from 'vitest';
import { parseResumeFile, serializeResume } from './parseResume';
import type { ResumeData } from '@/types/resume';

const baseValid: ResumeData = {
  name: '张三', title: '测试', phone: '138', email: 'a@b.com',
  age: '30', experienceYears: '5', jobIntention: '测试', salary: '20k',
  github: '', website: '', summary: '',
  skills: [], experience: [], projects: [], education: [],
  evaluation: [{ text: 'x' }],
  customSections: [],
};

describe('parseResumeFile', () => {
  it('新版格式含 _meta 正常解析', () => {
    const raw = { ...baseValid, _meta: { template: 'modern', sectionOrder: ['skills','summary'], savedAt: '2026-07-18', version: '2.0' } };
    const result = parseResumeFile(raw);
    expect(result.data.name).toBe('张三');
    expect(result.template).toBe('modern');
    expect(result.sectionOrder).toEqual(['skills','summary']);
  });

  it('旧版无 _meta 默认 classic + null sectionOrder', () => {
    const raw = { ...baseValid };
    const result = parseResumeFile(raw);
    expect(result.template).toBe('classic');
    expect(result.sectionOrder).toBe(null);
  });

  it('旧版 evaluation 字符串自动转数组', () => {
    const raw = { ...baseValid, evaluation: '我是测试工程师' };
    delete (raw as any)._meta;
    const result = parseResumeFile(raw);
    expect(result.data.evaluation).toEqual([
      { text: '' },
      { text: '我是测试工程师' },
      { text: '' },
    ]);
  });

  it('非法模板名回退到 classic', () => {
    const raw = { ...baseValid, _meta: { template: 'not-exist', sectionOrder: null, savedAt: '', version: '2.0' } };
    const result = parseResumeFile(raw);
    expect(result.template).toBe('classic');
  });

  it('sectionOrder 非数组时为 null', () => {
    const raw = { ...baseValid, _meta: { template: 'classic', sectionOrder: 'invalid', savedAt: '', version: '2.0' } };
    const result = parseResumeFile(raw);
    expect(result.sectionOrder).toBe(null);
  });

  it('skills 非数组时为空数组', () => {
    const raw = { ...baseValid, skills: 'invalid' };
    const result = parseResumeFile(raw);
    expect(result.data.skills).toEqual([]);
  });

  it('null 输入抛 ResumeParseError', () => {
    expect(() => parseResumeFile(null)).toThrow(/不是对象/);
  });

  it('非对象输入抛 ResumeParseError', () => {
    expect(() => parseResumeFile('string')).toThrow(/不是对象/);
  });

  it('字段缺失用默认空值填充', () => {
    const raw = { name: '李四' };
    const result = parseResumeFile(raw);
    expect(result.data.name).toBe('李四');
    expect(result.data.title).toBe('');
    expect(result.data.skills).toEqual([]);
    expect(result.data.evaluation).toEqual([{ text: '' }, { text: '' }, { text: '' }]);
  });

  it('customSections 正常解析', () => {
    const raw = {
      ...baseValid,
      customSections: [
        { id: 'c1', title: '证书资质', content: 'PMP\n软考高级' },
      ],
    };
    const result = parseResumeFile(raw);
    expect(result.data.customSections).toEqual([
      { id: 'c1', title: '证书资质', content: 'PMP\n软考高级' },
    ]);
  });

  it('customSections 过滤非法项并宽容处理字段', () => {
    const raw = {
      ...baseValid,
      customSections: [
        'invalid',
        { id: 123, title: 42, content: null },
        { title: '无 id', content: 'ok' },
      ],
    };
    const result = parseResumeFile(raw);
    expect(result.data.customSections.length).toBe(2);
    expect(typeof result.data.customSections[0].id).toBe('string');
    expect(result.data.customSections[0].title).toBe('42');
    expect(result.data.customSections[0].content).toBe('');
    expect(result.data.customSections[1].id).not.toBe('');
  });

  it('customSections 非数组时为空数组', () => {
    const raw = { ...baseValid, customSections: 'invalid' };
    const result = parseResumeFile(raw);
    expect(result.data.customSections).toEqual([]);
  });

  it('theme 随 _meta 解析', () => {
    const raw = {
      ...baseValid,
      _meta: {
        template: 'classic', sectionOrder: null, savedAt: '', version: '2.0',
        theme: { primaryColor: '#ff0000', fontFamily: 'serif' },
      },
    };
    const result = parseResumeFile(raw);
    expect(result.theme).toEqual({ primaryColor: '#ff0000', fontFamily: 'serif' });
  });

  it('_meta 无 theme 时返回 null', () => {
    const result = parseResumeFile({ ...baseValid });
    expect(result.theme).toBe(null);
  });

  it('theme 非法类型时返回 null', () => {
    const raw = {
      ...baseValid,
      _meta: { template: 'classic', sectionOrder: null, savedAt: '', version: '2.0', theme: 'bad' },
    };
    const result = parseResumeFile(raw);
    expect(result.theme).toBe(null);
  });
});

describe('serializeResume', () => {
  it('序列化包含 _meta 字段', () => {
    const json = serializeResume(baseValid, 'modern', ['skills', 'summary']);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('张三');
    expect(parsed._meta.template).toBe('modern');
    expect(parsed._meta.sectionOrder).toEqual(['skills', 'summary']);
    expect(parsed._meta.version).toBe('2.0');
    expect(typeof parsed._meta.savedAt).toBe('string');
  });

  it('sectionOrder 为 null 时正常序列化', () => {
    const json = serializeResume(baseValid, 'classic', null);
    const parsed = JSON.parse(json);
    expect(parsed._meta.sectionOrder).toBe(null);
  });

  it('可被 parseResumeFile 往返解析', () => {
    const json = serializeResume(baseValid, 'qa-pro', ['education', 'skills']);
    const result = parseResumeFile(JSON.parse(json));
    expect(result.data.name).toBe('张三');
    expect(result.template).toBe('qa-pro');
    expect(result.sectionOrder).toEqual(['education', 'skills']);
  });

  it('customSections 随序列化往返不丢', () => {
    const data: ResumeData = {
      ...baseValid,
      customSections: [{ id: 'c1', title: '证书', content: 'PMP' }],
    };
    const json = serializeResume(data, 'classic', ['summary', 'custom:c1']);
    const result = parseResumeFile(JSON.parse(json));
    expect(result.data.customSections).toEqual([{ id: 'c1', title: '证书', content: 'PMP' }]);
    expect(result.sectionOrder).toEqual(['summary', 'custom:c1']);
  });

  it('theme 随 serializeResume 往返', () => {
    const json = serializeResume(baseValid, 'classic', null, { primaryColor: '#123456', fontFamily: 'serif' });
    const parsed = JSON.parse(json);
    expect(parsed._meta.theme).toEqual({ primaryColor: '#123456', fontFamily: 'serif' });
    const result = parseResumeFile(parsed);
    expect(result.theme).toEqual({ primaryColor: '#123456', fontFamily: 'serif' });
  });

  it('serializeResume 未传 theme 时 _meta 不含 theme', () => {
    const json = serializeResume(baseValid, 'classic', null);
    const parsed = JSON.parse(json);
    expect(parsed._meta.theme).toBeUndefined();
  });
});
