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

  it('photo 字段保留，缺失时为空字符串', () => {
    const withPhoto = parseResumeFile({ ...baseValid, photo: 'data:image/jpeg;base64,AAAA' });
    expect(withPhoto.data.photo).toBe('data:image/jpeg;base64,AAAA');
    expect(parseResumeFile({ ...baseValid }).data.photo).toBe('');
  });

  it('targetJd 随 _meta 解析', () => {
    const raw = {
      ...baseValid,
      _meta: { template: 'classic', sectionOrder: null, savedAt: '', version: '2.0', targetJd: ' 熟悉 pytest ' },
    };
    expect(parseResumeFile(raw).targetJd).toBe(' 熟悉 pytest ');
  });
});

describe('parseResumeFile 深层字段补全', () => {
  it('顶层字符串字段 trim，数字转字符串', () => {
    const raw = { name: '  李四  ', title: 42, age: 26 };
    const result = parseResumeFile(raw);
    expect(result.data.name).toBe('李四');
    expect(result.data.title).toBe('42');
    expect(result.data.age).toBe('26');
  });

  it('缺少 items 的 experience/project 自动补空数组', () => {
    const result = parseResumeFile({
      experience: [{ company: '腾讯' }],
      projects: [{ name: '项目' }],
    });
    expect(result.data.experience[0]).toMatchObject({
      company: '腾讯', role: '', time: '', description: '', achievement: '', items: [],
    });
    expect(result.data.projects[0]).toMatchObject({
      name: '项目', time: '', role: '', background: '', subtitle: '', achievement: '', items: [],
    });
    expect(result.data.experience[0].id).not.toBe('');
    expect(result.data.projects[0].id).not.toBe('');
  });

  it('items 为多行字符串时按行拆成数组', () => {
    const result = parseResumeFile({
      experience: [{ company: 'A', items: '搭建框架\n\n优化流程\r\n' }],
      projects: [{ name: 'P', items: '一条内容' }],
    });
    expect(result.data.experience[0].items).toEqual(['搭建框架', '优化流程']);
    expect(result.data.projects[0].items).toEqual(['一条内容']);
  });

  it('items 数组中的空白项保留（编辑器可继续填写），非字符串转空串', () => {
    const result = parseResumeFile({
      experience: [{ company: 'A', items: ['a', '', null, 3] }],
    });
    expect(result.data.experience[0].items).toEqual(['a', '', '', '3']);
  });

  it('skills 支持字符串数组与缺字段对象，并补齐 id', () => {
    const result = parseResumeFile({
      skills: ['Python', { category: '接口测试' }, null, 42],
    });
    expect(result.data.skills).toHaveLength(2);
    expect(result.data.skills[0]).toMatchObject({ category: '', items: 'Python', level: '' });
    expect(result.data.skills[1]).toMatchObject({ category: '接口测试', items: '', level: '' });
    expect(result.data.skills[0].id).not.toBe('');
    expect(result.data.skills[1].id).not.toBe('');
  });

  it('skills.items 为数组时转成顿号分隔文本', () => {
    const result = parseResumeFile({
      skills: [{ category: '语言', items: ['Python', 'SQL', '', 3] }],
    });
    expect(result.data.skills[0].items).toBe('Python、SQL、3');
  });

  it('experience/projects/education 过滤非对象项，保留空对象用于编辑', () => {
    const result = parseResumeFile({
      experience: [null, 'invalid', {}],
      projects: [null, {}],
      education: ['invalid', {}],
    });
    expect(result.data.experience).toHaveLength(1);
    expect(result.data.projects).toHaveLength(1);
    expect(result.data.education).toHaveLength(1);
    expect(result.data.experience[0].items).toEqual([]);
  });

  it('evaluation 数组中的数字/对象字段宽容解析', () => {
    const result = parseResumeFile({
      evaluation: [{ text: 42 }, { text: null }, '  ok  ', 7, null],
    });
    expect(result.data.evaluation).toEqual([
      { text: '42' }, { text: '' }, { text: 'ok' }, { text: '7' }, { text: '' },
    ]);
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

  it('hiddenSections 随序列化往返', () => {
    const json = serializeResume(baseValid, 'classic', null, null, '', ['projects', 'custom:c1']);
    const parsed = JSON.parse(json);
    expect(parsed._meta.hiddenSections).toEqual(['projects', 'custom:c1']);

    const result = parseResumeFile(parsed);
    expect(result.hiddenSections).toEqual(['projects', 'custom:c1']);
  });

  it('未传 hiddenSections 时 _meta 不含该字段', () => {
    const json = serializeResume(baseValid, 'classic', null);
    expect(JSON.parse(json)._meta.hiddenSections).toBeUndefined();
  });
});

describe('parseResumeFile - hiddenSections', () => {
  it('无 _meta.hiddenSections 时为空数组', () => {
    const result = parseResumeFile({ ...baseValid });
    expect(result.hiddenSections).toEqual([]);
  });

  it('过滤非法值只保留合法区块 id', () => {
    const raw = {
      ...baseValid,
      _meta: {
        template: 'classic', sectionOrder: null, savedAt: '', version: '2.0',
        hiddenSections: ['skills', 'bogus', 42, 'custom:'],
      },
    };
    expect(parseResumeFile(raw).hiddenSections).toEqual(['skills']);
  });

  it('hiddenSections 不是数组时为空数组', () => {
    const raw = {
      ...baseValid,
      _meta: { template: 'classic', sectionOrder: null, savedAt: '', version: '2.0', hiddenSections: 'skills' },
    };
    expect(parseResumeFile(raw).hiddenSections).toEqual([]);
  });
});
