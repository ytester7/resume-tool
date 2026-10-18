import { describe, it, expect } from 'vitest';
import { analyzeJdMatch, buildResumeText, extractJdKeywords } from './jdMatch';
import { defaultResumeData } from '@/types/resume';
import type { ResumeData } from '@/types/resume';

function qaResume(): ResumeData {
  const data = defaultResumeData();
  data.name = '陈默';
  data.summary = '4 年测试经验，主导 pytest + Selenium 自动化体系落地。';
  data.skills = [
    { id: 's1', category: '自动化测试', items: 'Python、pytest、Selenium、Allure', level: '精通' },
    { id: 's2', category: '接口测试', items: 'Postman、requests', level: '熟练' },
  ];
  data.experience = [
    {
      id: 'e1', company: '云舟科技', role: '测试开发', time: '2023.06-至今',
      description: '负责接口自动化建设', achievement: '回归效率提升 75%',
      items: ['搭建 pytest 框架，覆盖 50+ 核心 API'],
    },
  ];
  return data;
}

describe('extractJdKeywords', () => {
  it('识别英文与中文技能词', () => {
    const { keywords } = extractJdKeywords('熟悉 Python、pytest 和 Kubernetes，有自动化测试经验');
    expect(keywords).toContain('Python');
    expect(keywords).toContain('pytest');
    expect(keywords).toContain('Kubernetes');
    expect(keywords).toContain('自动化测试');
  });

  it('不会把 JavaScript 误判成 Java', () => {
    const { keywords } = extractJdKeywords('前端开发，熟悉 JavaScript 与 Vue');
    expect(keywords).toContain('JavaScript');
    expect(keywords).not.toContain('Java');
  });

  it('空 JD 返回空关键词', () => {
    expect(extractJdKeywords('   ').keywords).toEqual([]);
  });

  it('高频英文词即使不在词典里也能被识别', () => {
    const { keywords } = extractJdKeywords('熟悉 Snowflake，Snowflake 是必须的');
    expect(keywords.map(k => k.toLowerCase())).toContain('snowflake');
  });
});

describe('buildResumeText', () => {
  it('汇总概述、技能、经历、项目与自定义区块', () => {
    const data = qaResume();
    data.projects = [{
      id: 'p1', name: '物流中台自动化', time: '2024', role: '核心成员',
      background: '手工回归成本高', subtitle: 'pytest', achievement: '效率提升 75%',
      items: ['封装 BaseRequest'],
    }];
    data.customSections = [{ id: 'c1', title: '证书', content: 'PMP' }];
    const text = buildResumeText(data);
    expect(text).toContain('Python');
    expect(text).toContain('物流中台自动化');
    expect(text).toContain('PMP');
  });
});

describe('analyzeJdMatch', () => {
  it('按关键词覆盖率计算匹配分并列出缺失项', () => {
    const result = analyzeJdMatch('岗位要求：Python、pytest、Kubernetes、Docker', qaResume());
    expect(result.total).toBe(4);
    expect(result.matched).toEqual(expect.arrayContaining(['Python', 'pytest']));
    expect(result.missing).toEqual(expect.arrayContaining(['Kubernetes', 'Docker']));
    expect(result.score).toBe(50);
  });

  it('JD 没有可识别关键词时返回 0 分', () => {
    const result = analyzeJdMatch('我们希望你认真负责、有良好的沟通能力', qaResume());
    expect(result.total).toBe(0);
    expect(result.score).toBe(0);
  });

  it('大小写不敏感', () => {
    const result = analyzeJdMatch('PYTHON PYTEST', qaResume());
    expect(result.matched).toEqual(expect.arrayContaining(['Python', 'pytest']));
  });
});
