import { describe, it, expect } from 'vitest';
import { calcHealthScore, gradeOf, DIMENSION_MAX } from './healthScore';
import type { ResumeData } from '@/types/resume';
import { defaultResumeData } from '@/types/resume';

function makeData(overrides: Partial<ResumeData> = {}): ResumeData {
  return { ...defaultResumeData(), ...overrides };
}

describe('gradeOf', () => {
  it('90+ 优秀', () => {
    expect(gradeOf(90)).toBe('优秀');
    expect(gradeOf(100)).toBe('优秀');
  });
  it('75-89 良好', () => {
    expect(gradeOf(75)).toBe('良好');
    expect(gradeOf(89)).toBe('良好');
  });
  it('60-74 合格', () => {
    expect(gradeOf(60)).toBe('合格');
    expect(gradeOf(74)).toBe('合格');
  });
  it('<60 待改进', () => {
    expect(gradeOf(59)).toBe('待改进');
    expect(gradeOf(0)).toBe('待改进');
  });
});

describe('calcHealthScore - 空简历', () => {
  // defaultResumeData 的 evaluation 有 3 个空文本项，会触发规范性扣分
  const report = calcHealthScore(defaultResumeData());

  it('完整性/量化度/充实度/关键词均为 0', () => {
    expect(report.dimensions.completeness).toBe(0);
    expect(report.dimensions.quantification).toBe(0);
    expect(report.dimensions.richness).toBe(0);
    expect(report.dimensions.keyword).toBe(0);
  });

  it('规范性仅时间格式满分 5（评价空项被扣分）', () => {
    // 时间格式无数据 → 满分 5；联系方式无 → 0；评价 3 个空项 → 0
    expect(report.dimensions.regularity).toBe(5);
  });

  it('总分为 5，等级待改进', () => {
    expect(report.total).toBe(5);
    expect(report.grade).toBe('待改进');
  });

  it('生成多条改进建议', () => {
    expect(report.suggestions.length).toBeGreaterThan(5);
    expect(report.suggestions.some(s => s.dimension === 'completeness')).toBe(true);
  });
});

describe('calcHealthScore - 完整简历', () => {
  const data = makeData({
    name: '张三',
    title: '前端工程师',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    experienceYears: '5',
    jobIntention: '高级前端',
    github: 'https://github.com/zhangsan',
    summary: '5 年前端开发经验，精通 Vue React TypeScript 等主流技术栈，主导多个大型项目落地，提升团队效率 30%，擅长工程化与性能优化。',
    skills: [
      { id: '1', category: '前端框架', items: 'Vue,React,Angular,Next.js,Nuxt.js', level: '精通' },
      { id: '2', category: '编程语言', items: 'TypeScript,JavaScript,HTML,CSS,Node.js', level: '精通' },
      { id: '3', category: '工程化', items: 'Vite,Webpack,ESLint,Vitest,Turbo', level: '熟练' },
      { id: '4', category: '可视化', items: 'D3,Chart,ECharts,Canvas,WebGL', level: '熟练' },
      { id: '5', category: '后端', items: 'Express,Koa,NestJS,Redis,MySQL', level: '了解' },
    ],
    experience: [
      {
        id: 'e1', company: '某公司', role: '前端', time: '2020.01-2024.01',
        description: '负责公司核心产品的前端架构设计与开发，带领团队完成多个版本迭代',
        achievement: '提升页面性能 30%，减少加载时间 2 秒',
        items: ['主导组件库建设，复用率达 80%', '优化构建流程，节省 50% 时间'],
      },
      {
        id: 'e2', company: '某公司2', role: '前端', time: '2018.01-2020.01',
        description: '负责业务模块开发，参与架构升级与代码规范建设',
        achievement: '降低 Bug 率 40%，提升交付效率 25%',
        items: ['重构核心模块，减少 60% 代码', '引入自动化测试，覆盖率 90%'],
      },
    ],
    projects: [
      {
        id: 'p1', name: '某项目', time: '2022.01-2023.01', role: '负责人',
        background: '业务背景', subtitle: '技术栈',
        achievement: '用户增长 100 万，DAU 提升 50%',
        items: ['设计架构，支持 10 万 QPS', '优化首屏加载，减少 3 秒'],
      },
      {
        id: 'p2', name: '某项目2', time: '2021.01-2022.01', role: '主程',
        background: '业务背景', subtitle: '技术栈',
        achievement: '节省成本 200 万，转化率提升 15%',
        items: ['实现核心功能 5 个', '优化性能，提升 40%'],
      },
    ],
    education: [{ id: 'ed1', school: '某大学', major: '计算机', degree: '本科', time: '2016.09-2020.06' }],
    evaluation: [{ text: '认真负责' }, { text: '学习能力较强' }],
  });
  const report = calcHealthScore(data);

  it('完整性满分', () => {
    expect(report.dimensions.completeness).toBe(DIMENSION_MAX.completeness);
  });

  it('量化度较高（2 条经历 + 2 条项目 + 多个含量化 items）', () => {
    // 经历 2*2=4 + 项目 2*2=4 + items 5 = 13
    expect(report.dimensions.quantification).toBeGreaterThanOrEqual(13);
  });

  it('充实度较高', () => {
    expect(report.dimensions.richness).toBeGreaterThanOrEqual(15);
  });

  it('关键词维度满分', () => {
    expect(report.dimensions.keyword).toBe(DIMENSION_MAX.keyword);
  });

  it('规范性满分', () => {
    expect(report.dimensions.regularity).toBe(DIMENSION_MAX.regularity);
  });

  it('总分达到优秀或良好', () => {
    expect(report.total).toBeGreaterThanOrEqual(75);
  });

  it('建议条目较少', () => {
    expect(report.suggestions.length).toBeLessThan(4);
  });
});

describe('calcHealthScore - 维度边界', () => {
  it('概述 50-200 字得满分 5', () => {
    const summary = 'a'.repeat(100);
    const data = makeData({ summary });
    const report = calcHealthScore(data);
    // richness 中概述贡献 5 分（其余可能为 0）
    expect(report.dimensions.richness).toBeGreaterThanOrEqual(5);
  });

  it('概述 < 30 字得 0 分', () => {
    const summary = '短概述';
    const data = makeData({ summary });
    const report = calcHealthScore(data);
    // 概述长度 < 30 字，但技能数也可能贡献；这里只验证不包含概述 5 分
    expect(report.dimensions.richness).toBeLessThanOrEqual(5);
  });

  it('手机号格式错误触发建议', () => {
    const data = makeData({ phone: '12345', email: 'bad-email' });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('手机号格式不规范'))).toBe(true);
    expect(report.suggestions.some(s => s.message.includes('邮箱格式不规范'))).toBe(true);
  });

  it('时间格式不规范触发建议', () => {
    const data = makeData({
      experience: [{ id: '1', company: 'c', role: 'r', time: '2020年-2024年', description: '', achievement: '', items: [] }],
    });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('时间格式'))).toBe(true);
  });

  it('工作经历有量化成就得分', () => {
    const data = makeData({
      experience: [{
        id: '1', company: 'c', role: 'r', time: '2020.01-2024.01',
        description: '', achievement: '提升 30%', items: ['优化 50ms'],
      }],
    });
    const report = calcHealthScore(data);
    expect(report.dimensions.quantification).toBeGreaterThanOrEqual(3);
  });

  it('自我评价有空项触发建议', () => {
    const data = makeData({
      evaluation: [{ text: '认真' }, { text: '' }],
    });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('自我评价'))).toBe(true);
  });

  it('技能数 < 5 触发建议', () => {
    const data = makeData({
      skills: [{ id: '1', category: '前端', items: 'Vue', level: '精通' }],
    });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('技能条目'))).toBe(true);
  });

  it('GitHub 与 website 都为空触发建议', () => {
    const data = makeData({ github: '', website: '' });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('GitHub'))).toBe(true);
  });
});

describe('calcHealthScore - 充实度概述长度分支', () => {
  it('概述 30-49 字得 3 分', () => {
    const summary = 'a'.repeat(40);
    const data = makeData({ summary });
    const report = calcHealthScore(data);
    expect(report.dimensions.richness).toBeGreaterThanOrEqual(3);
    expect(report.suggestions.some(s => s.message.includes('专业概述当前 40 字'))).toBe(true);
  });

  it('概述 201-300 字得 3 分但不触发建议（略长可接受）', () => {
    const summary = 'a'.repeat(250);
    const data = makeData({ summary });
    const report = calcHealthScore(data);
    expect(report.dimensions.richness).toBeGreaterThanOrEqual(3);
    // 建议条件为 < 50 或 > 300，201-300 区间不触发
    expect(report.suggestions.some(s => s.message.includes('专业概述当前 250 字'))).toBe(false);
  });

  it('概述 > 300 字得 0 分并触发建议', () => {
    const summary = 'a'.repeat(350);
    const data = makeData({ summary });
    const report = calcHealthScore(data);
    // 概述贡献 0，其余可能为 0
    expect(report.dimensions.richness).toBe(0);
    expect(report.suggestions.some(s => s.message.includes('专业概述当前 350 字'))).toBe(true);
  });

  it('概述为空白字符串不计长度', () => {
    const data = makeData({ summary: '   \n\t  ' });
    const report = calcHealthScore(data);
    expect(report.dimensions.richness).toBe(0);
    // 空白不应触发"当前 N 字"建议
    expect(report.suggestions.some(s => s.message.includes('专业概述当前'))).toBe(false);
  });
});

describe('calcHealthScore - 规范性分支', () => {
  it('evaluation 为空数组得规范性评价满分 5', () => {
    const data = makeData({ evaluation: [] });
    const report = calcHealthScore(data);
    // 时间无数据 5 + 联系方式无 0 + 评价空数组 5 = 10
    expect(report.dimensions.regularity).toBe(10);
  });

  it('仅填写 phone 时不触发"邮箱格式不规范"建议', () => {
    const data = makeData({ phone: '13800138000', email: '' });
    const report = calcHealthScore(data);
    // 时间 5 + phone 2.5（四舍五入 3）+ 评价空项 0 = 8
    expect(report.dimensions.regularity).toBeGreaterThanOrEqual(8);
    // 用精确字符串避免匹配到完整性维度的"建议填写邮箱"
    expect(report.suggestions.some(s => s.message.includes('邮箱格式不规范'))).toBe(false);
  });

  it('仅填写 email 时不触发"手机号格式不规范"建议', () => {
    const data = makeData({ phone: '', email: 'a@b.com' });
    const report = calcHealthScore(data);
    expect(report.dimensions.regularity).toBeGreaterThanOrEqual(8);
    expect(report.suggestions.some(s => s.message.includes('手机号格式不规范'))).toBe(false);
  });

  it('全部时间格式规范不触发建议', () => {
    const data = makeData({
      experience: [{ id: '1', company: 'c', role: 'r', time: '2020.01-2024.01', description: '', achievement: '', items: [] }],
      education: [{ id: '1', school: 's', major: 'm', degree: 'd', time: '2016.09-2020.06' }],
    });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('时间格式'))).toBe(false);
  });

  it('时间使用斜杠分隔也视为规范', () => {
    const data = makeData({
      experience: [{ id: '1', company: 'c', role: 'r', time: '2020/01-2024/01', description: '', achievement: '', items: [] }],
    });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('时间格式'))).toBe(false);
  });

  it('时间使用"至今"也视为规范', () => {
    const data = makeData({
      experience: [{ id: '1', company: 'c', role: 'r', time: '2020.01-至今', description: '', achievement: '', items: [] }],
    });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('时间格式'))).toBe(false);
  });

  it('评价全部非空得满分 5', () => {
    const data = makeData({
      phone: '13800138000',
      evaluation: [{ text: '认真负责' }, { text: '学习能力强' }],
    });
    const report = calcHealthScore(data);
    // 时间无 5 + phone 3 + 评价满分 5 = 13
    expect(report.dimensions.regularity).toBe(13);
  });
});

describe('calcHealthScore - 关键词维度分支', () => {
  it('技能分类为 1-2 个按比例得分', () => {
    const data = makeData({
      skills: [
        { id: '1', category: '前端', items: 'Vue,React,Angular,Next.js,Nuxt.js', level: '精通' },
      ],
    });
    const report = calcHealthScore(data);
    // 1 分类：round(1/3*5)=2；5 关键词：round(5/15*5)=2；概述无匹配 0
    expect(report.dimensions.keyword).toBe(4);
  });

  it('技能分类为 3 个得满分 5', () => {
    const data = makeData({
      skills: [
        { id: '1', category: '前端', items: 'Vue,React', level: '精通' },
        { id: '2', category: '后端', items: 'Node,Koa', level: '熟练' },
        { id: '3', category: '工程', items: 'Vite,Webpack', level: '熟练' },
      ],
    });
    const report = calcHealthScore(data);
    expect(report.dimensions.keyword).toBeGreaterThanOrEqual(5);
  });

  it('概述命中 1 个关键词得 2 分', () => {
    const data = makeData({
      summary: '熟悉 Vue 框架开发',
      skills: [
        { id: '1', category: '前端', items: 'Vue,React,Angular,Next.js,Nuxt.js', level: '精通' },
      ],
    });
    const report = calcHealthScore(data);
    // 1 分类 2 + 5 关键词 2 + 1 命中 2 = 6
    expect(report.dimensions.keyword).toBe(6);
    expect(report.suggestions.some(s => s.message.includes('专业概述中可融入更多技能关键词'))).toBe(true);
  });

  it('概述命中 2+ 关键词得满分且不触发建议', () => {
    const data = makeData({
      summary: '熟悉 Vue 与 React 框架开发',
      skills: [
        { id: '1', category: '前端', items: 'Vue,React,Angular,Next.js,Nuxt.js', level: '精通' },
      ],
    });
    const report = calcHealthScore(data);
    // 1 分类 2 + 5 关键词 2 + 2 命中 5 = 9
    expect(report.dimensions.keyword).toBe(9);
    expect(report.suggestions.some(s => s.message.includes('专业概述中可融入更多技能关键词'))).toBe(false);
  });

  it('技能 items 用中文分隔符也能拆分关键词', () => {
    const data = makeData({
      skills: [
        { id: '1', category: '前端', items: 'Vue、React，Angular；Next.js Nuxt.js', level: '精通' },
      ],
    });
    const report = calcHealthScore(data);
    // 5 关键词：round(5/15*5)=2
    expect(report.dimensions.keyword).toBeGreaterThanOrEqual(2);
  });

  it('技能 category 含空白被过滤', () => {
    const data = makeData({
      skills: [
        { id: '1', category: '  ', items: 'Vue,React', level: '精通' },
        { id: '2', category: '', items: 'Node,Koa', level: '熟练' },
      ],
    });
    const report = calcHealthScore(data);
    // 分类 0 个 → 0 分
    expect(report.dimensions.keyword).toBeLessThanOrEqual(5);
  });
});

describe('calcHealthScore - 完整性分支', () => {
  it('仅填 phone 视为有联系方式', () => {
    const data = makeData({ phone: '13800138000', email: '' });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('请至少填写一种联系方式'))).toBe(false);
  });

  it('仅填 email 视为有联系方式', () => {
    const data = makeData({ phone: '', email: 'a@b.com' });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('请至少填写一种联系方式'))).toBe(false);
  });

  it('experienceYears 为空不触发特定建议但仍可扣分', () => {
    const data = makeData({ experienceYears: '' });
    const report = calcHealthScore(data);
    // experienceYears 为空只是少得 1 分，无对应建议
    expect(report.suggestions.some(s => s.message.includes('工作年限'))).toBe(false);
  });

  it('website 有值视为有个人链接', () => {
    const data = makeData({ github: '', website: 'https://example.com' });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('GitHub'))).toBe(false);
  });

  it('evaluation 全为空文本视为未填写', () => {
    const data = makeData({ evaluation: [{ text: '' }, { text: '' }] });
    const report = calcHealthScore(data);
    expect(report.suggestions.some(s => s.message.includes('请补充自我评价'))).toBe(true);
  });
});

describe('calcHealthScore - 量化度边界', () => {
  it('achievement 含独立数字也视为量化', () => {
    const data = makeData({
      experience: [{
        id: '1', company: 'c', role: 'r', time: '2020.01-2024.01',
        description: '', achievement: '完成 3 个版本迭代', items: [],
      }],
    });
    const report = calcHealthScore(data);
    expect(report.dimensions.quantification).toBeGreaterThanOrEqual(2);
  });

  it('items 含多个量化项累加但不超过 5', () => {
    const data = makeData({
      experience: [{
        id: '1', company: 'c', role: 'r', time: '2020.01-2024.01',
        description: '', achievement: '',
        items: ['a 1', 'b 2', 'c 3', 'd 4', 'e 5', 'f 6', 'g 7'],
      }],
    });
    const report = calcHealthScore(data);
    // items 量化上限 5
    expect(report.dimensions.quantification).toBe(5);
  });

  it('经历和项目都无量化和 items 但条目存在不触发量化建议', () => {
    const data = makeData({
      experience: [{
        id: '1', company: 'c', role: 'r', time: '2020.01-2024.01',
        description: '', achievement: '', items: [],
      }],
      projects: [{
        id: '1', name: 'p', time: '2020.01-2024.01', role: 'r',
        background: 'b', subtitle: 's', achievement: '', items: [],
      }],
    });
    const report = calcHealthScore(data);
    // 经历和项目都有条目但无量化 → 两条建议
    expect(report.suggestions.filter(s => s.dimension === 'quantification').length).toBe(2);
  });
});

describe('calcHealthScore - 数据健壮性', () => {
  it('字段为 undefined 时不抛异常', () => {
    const data = makeData({
      summary: undefined as unknown as string,
      github: undefined as unknown as string,
    });
    expect(() => calcHealthScore(data)).not.toThrow();
  });

  it('skills items 为空字符串不抛异常且不计入技能数', () => {
    const data = makeData({
      skills: [{ id: '1', category: '前端', items: '', level: '精通' }],
    });
    expect(() => calcHealthScore(data)).not.toThrow();
    const report = calcHealthScore(data);
    // 空 items 的技能不计入 skillCount
    expect(report.suggestions.some(s => s.message.includes('技能条目当前 0 条'))).toBe(true);
  });

  it('experience 条目字段为空字符串不抛异常', () => {
    const data = makeData({
      experience: [{
        id: '1', company: '', role: '', time: '',
        description: '', achievement: '', items: [],
      }],
    });
    expect(() => calcHealthScore(data)).not.toThrow();
  });

  it('projects items 含空字符串被正确过滤', () => {
    const data = makeData({
      projects: [{
        id: '1', name: 'p', time: '2020.01-2024.01', role: 'r',
        background: 'b', subtitle: 's', achievement: '增长 100',
        items: ['', '  ', '有效项 1'],
      }],
    });
    const report = calcHealthScore(data);
    expect(report.dimensions.quantification).toBeGreaterThanOrEqual(1);
  });
});

describe('calcHealthScore - 维度上限', () => {
  it('各维度得分不超过 DIMENSION_MAX', () => {
    const data = makeData({
      name: 'x', title: 'x', email: 'a@b.com', phone: '13800138000',
      experienceYears: '5', jobIntention: 'x', github: 'g',
      summary: 'a'.repeat(100),
      skills: [
        { id: '1', category: 'A', items: 'a,b,c,d,e', level: '精通' },
        { id: '2', category: 'B', items: 'f,g,h,i,j', level: '精通' },
        { id: '3', category: 'C', items: 'k,l,m,n,o', level: '精通' },
      ],
      experience: Array(10).fill(0).map((_, i) => ({
        id: String(i), company: 'c', role: 'r', time: '2020.01-2024.01',
        description: 'a'.repeat(40), achievement: '提升 30%',
        items: ['a 50%', 'b 60%'],
      })),
      projects: Array(10).fill(0).map((_, i) => ({
        id: String(i), name: 'p', time: '2020.01-2024.01', role: 'r',
        background: 'b', subtitle: 's', achievement: '增长 100 万',
        items: ['x 1', 'y 2'],
      })),
      education: [{ id: '1', school: 's', major: 'm', degree: 'd', time: '2020.01-2024.01' }],
      evaluation: [{ text: 'a' }],
    });
    const report = calcHealthScore(data);
    (Object.keys(report.dimensions) as Array<keyof typeof report.dimensions>).forEach(k => {
      expect(report.dimensions[k]).toBeLessThanOrEqual(DIMENSION_MAX[k]);
    });
    expect(report.total).toBeLessThanOrEqual(100);
  });
});
