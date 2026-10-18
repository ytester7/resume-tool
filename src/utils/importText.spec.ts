import { describe, it, expect } from 'vitest';
import { parseResumeText } from './importText';

const RESUME_TEXT = `陈默
软件测试工程师 | 4年经验
13800138000 | chenmo@example.com | github.com/chenmo-qa
求职意向：测试开发工程师

个人优势
4 年软件测试经验，主导自动化体系建设，回归效率提升 75%。

专业技能
自动化测试：Python、pytest、Selenium、Allure
接口测试：Postman、requests、HTTP 协议
数据库：MySQL、Redis

工作经历
2023.06-至今  云舟科技  测试开发工程师
• 搭建接口自动化框架，覆盖 50+ 核心 API
• 设计缺陷分级标准，闭环 1000+ 缺陷
关键成果：回归周期从 2 天缩短到 4 小时

2021.07-2023.05  星链智能  测试工程师
• 负责智能家居 App 全链路测试
• 搭建兼容性矩阵，修复 200+ 适配问题

项目经历
2024.02-2025.05  物流中台接口自动化体系
• 设计分层框架，支持多环境切换
关键成果：回归效率提升 75%

教育背景
2017.09-2021.06  杭州电子科技大学  计算机科学与技术  本科

自我评价
• 具备从 0 到 1 搭建自动化体系的能力
• 习惯用数据衡量测试质量
`;

/** 单空格、无 2 空格对齐的版本 */
const COMPACT_TEXT = `张三
Java 后端工程师
zhangsan@example.com

工作经历
2020.07-2023.05 启明信息 Java开发工程师
负责订单模块开发
• 优化慢 SQL，响应时间下降 90%

教育背景
2016.09-2020.06 华中科技大学 软件工程 本科
`;

describe('parseResumeText - 标准中文简历', () => {
  const result = parseResumeText(RESUME_TEXT);

  it('识别基本信息', () => {
    expect(result.data.name).toBe('陈默');
    expect(result.data.phone).toBe('13800138000');
    expect(result.data.email).toBe('chenmo@example.com');
    expect(result.data.github).toBe('github.com/chenmo-qa');
    expect(result.data.jobIntention).toBe('测试开发工程师');
    expect(result.data.experienceYears).toBe('4年');
    expect(result.data.title).toContain('软件测试工程师');
  });

  it('识别概述、技能、评价', () => {
    expect(result.data.summary).toContain('自动化体系');
    expect(result.data.skills).toHaveLength(3);
    expect(result.data.skills[0].category).toBe('自动化测试');
    expect(result.data.skills[0].level).toBe('熟练');
    expect(result.data.evaluation).toHaveLength(2);
  });

  it('按日期切分工作经历并保留成果', () => {
    expect(result.data.experience).toHaveLength(2);
    const first = result.data.experience[0];
    expect(first.company).toBe('云舟科技');
    expect(first.role).toBe('测试开发工程师');
    expect(first.time).toBe('2023.06-至今');
    expect(first.items.length).toBeGreaterThanOrEqual(2);
    expect(first.achievement).toContain('回归周期');

    const second = result.data.experience[1];
    expect(second.company).toBe('星链智能');
    expect(second.time).toBe('2021.07-2023.05');
  });

  it('识别项目与教育背景', () => {
    expect(result.data.projects).toHaveLength(1);
    expect(result.data.projects[0].name).toBe('物流中台接口自动化体系');
    expect(result.data.projects[0].achievement).toContain('75%');

    expect(result.data.education).toHaveLength(1);
    expect(result.data.education[0].school).toBe('杭州电子科技大学');
    expect(result.data.education[0].major).toContain('计算机');
    expect(result.data.education[0].degree).toBe('本科');
    expect(result.data.education[0].time).toBe('2017.09-2021.06');
  });

  it('完整度与区块列表', () => {
    expect(result.confidence).toBe(100);
    expect(result.sections).toContain('工作经历');
    expect(result.sections).toContain('教育');
    expect(result.warnings).toHaveLength(0);
  });
});

describe('parseResumeText - 紧凑格式', () => {
  it('单空格也能拆出公司、职位、学校、专业', () => {
    const result = parseResumeText(COMPACT_TEXT);
    expect(result.data.name).toBe('张三');
    expect(result.data.email).toBe('zhangsan@example.com');
    expect(result.data.experience).toHaveLength(1);
    expect(result.data.experience[0].company).toBe('启明信息');
    expect(result.data.experience[0].role).toContain('Java');
    expect(result.data.education[0].school).toBe('华中科技大学');
    expect(result.data.education[0].major).toBe('软件工程');
  });
});

describe('parseResumeText - 异常输入', () => {
  it('空文本给出警告且不崩溃', () => {
    const result = parseResumeText('');
    expect(result.data.name).toBe('');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.confidence).toBe(0);
  });

  it('没有区块标题时按段落兜底并提示', () => {
    const result = parseResumeText('李四\n13800000000\n随便写的一些内容，没有区块标题。');
    expect(result.warnings.some(w => w.includes('区块标题'))).toBe(true);
    expect(result.data.phone).toBe('13800000000');
  });

  it('识别未知标题为自定义区块', () => {
    const result = parseResumeText(`王五\n\n证书资质\nPMP\n软考高级\n`);
    expect(result.data.customSections).toHaveLength(1);
    expect(result.data.customSections[0].title).toBe('证书资质');
    expect(result.data.customSections[0].content).toContain('PMP');
  });
});
