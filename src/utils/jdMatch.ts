import type { ResumeData } from '@/types/resume';

/**
 * 本地岗位匹配引擎（零网络请求）。
 *
 * 思路：
 * 1. 从 JD 里抽取「技能词典命中项 + 高频英文技术词」作为关键词；
 * 2. 把简历全文（概述/技能/经历/项目/自定义区块）拼成可搜索文本；
 * 3. 用关键词覆盖率给出匹配分，并列出缺失项。
 *
 * 词典是刻意保持小而精的：宁可少报，也不要给用户一堆噪音。
 */
export const SKILL_DICTIONARY: string[] = [
  // 语言 / 框架
  'Python', 'Java', 'JavaScript', 'TypeScript', 'Vue', 'React', 'Node.js', 'Go', 'Golang',
  'C++', 'C#', 'PHP', 'Ruby', 'Kotlin', 'Swift', 'Spring', 'Spring Boot', 'Spring Cloud',
  'MyBatis', 'Django', 'Flask', 'FastAPI', 'Express', 'NestJS', 'jQuery', 'Webpack', 'Vite',
  // 数据 / 中间件
  'SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'Redis', 'MongoDB', 'Elasticsearch', 'Kafka',
  'RocketMQ', 'RabbitMQ', 'ZooKeeper', 'HBase', 'ClickHouse', 'Hive', 'Spark', 'Flink',
  // 测试
  'pytest', 'Selenium', 'Appium', 'Cypress', 'Playwright', 'Jest', 'JUnit', 'TestNG',
  'Postman', 'JMeter', 'LoadRunner', 'Locust', 'Fiddler', 'Charles', 'Allure', 'ADB',
  'Monkey', 'UI 自动化', '接口自动化', '自动化测试', '接口测试', '性能测试', '压力测试',
  '稳定性测试', '兼容性测试', '回归测试', '冒烟测试', '单元测试', '安全测试', '渗透测试',
  '测试用例', '测试方案', '缺陷管理', '质量体系', '测试左移', '灰度发布',
  // 工程 / 架构
  'Docker', 'Kubernetes', 'K8s', 'Jenkins', 'Git', 'Linux', 'Nginx', 'CI/CD', 'DevOps',
  '微服务', '分布式', '高并发', '高可用', '消息队列', '缓存', '负载均衡', '限流', '降级',
  '监控', '告警', '链路追踪', '性能优化', '架构设计', '领域驱动', 'DDD', '重构', '单元化',
  'REST', 'API', 'HTTP', 'TCP', 'MQTT', 'WebSocket', 'gRPC', 'GraphQL',
  // 数据 / AI
  'AI', '大模型', 'LLM', 'Prompt', 'RAG', '机器学习', '深度学习', '数据分析', '数据埋点',
  '数据仓库', 'ETL', 'BI',
  // 产品 / 业务
  '需求分析', '产品设计', '原型', 'PRD', 'Axure', 'Figma', '用户研究', '竞品分析',
  '项目管理', '敏捷', 'Scrum', '增长', '转化率', '留存', 'A/B 测试', '商业化',
  '供应链', '采购', '结算', '对账', 'SaaS', 'B 端', 'CRM', 'ERP', '客户成功',
];

/** 英文停用词，避免把 JD 里的虚词当成技能 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'are', 'will', 'have', 'has', 'that',
  'this', 'from', 'not', 'but', 'all', 'can', 'who', 'what', 'when', 'where', 'how', 'why',
  'job', 'work', 'team', 'role', 'responsibility', 'requirement', 'plus', 'etc', 'and/or',
  'ability', 'experience', 'years', 'year', 'strong', 'good', 'must', 'should', 'able',
]);

/** 英文/数字词是否以完整单词形式出现（避免 java 命中 javascript） */
function hasLatinTerm(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

function hasTerm(text: string, term: string): boolean {
  if (/^[a-z0-9+#./ -]+$/i.test(term)) return hasLatinTerm(text, term);
  return text.includes(term);
}

export interface JdKeywords {
  keywords: string[];
  /** 每个关键词在 JD 中出现的次数，用于排序 */
  frequency: Record<string, number>;
}

/** 从 JD 抽取关键词（技能词典优先，其次高频英文技术词） */
export function extractJdKeywords(jd: string, limit = 30): JdKeywords {
  const text = jd.toLowerCase();
  if (!text.trim()) return { keywords: [], frequency: {} };

  const frequency: Record<string, number> = {};
  const keywords: string[] = [];

  for (const term of SKILL_DICTIONARY) {
    if (!hasTerm(text, term.toLowerCase())) continue;
    const lower = term.toLowerCase();
    const count = text.split(lower).length - 1;
    frequency[term] = Math.max(1, count);
    keywords.push(term);
  }

  // 词典没覆盖到的英文技术词：出现 2 次以上才纳入，降低噪音
  const tokens = text.match(/[a-z][a-z0-9+#./-]{2,24}/g) ?? [];
  const tokenCount = new Map<string, number>();
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    tokenCount.set(token, (tokenCount.get(token) ?? 0) + 1);
  }
  for (const [token, count] of tokenCount) {
    if (count < 2) continue;
    if (keywords.some(k => k.toLowerCase() === token)) continue;
    frequency[token] = count;
    keywords.push(token);
  }

  keywords.sort((a, b) => (frequency[b] ?? 0) - (frequency[a] ?? 0));
  return { keywords: keywords.slice(0, limit), frequency };
}

/** 把简历拼成一段可搜索文本 */
export function buildResumeText(data: ResumeData): string {
  const parts: string[] = [
    data.name, data.title, data.summary, data.jobIntention,
  ];
  for (const s of data.skills) parts.push(s.category, s.items);
  for (const e of data.experience) {
    parts.push(e.company, e.role, e.description, e.achievement, ...e.items);
  }
  for (const p of data.projects) {
    parts.push(p.name, p.role, p.background, p.subtitle, p.achievement, ...p.items);
  }
  for (const edu of data.education) parts.push(edu.school, edu.major, edu.degree);
  for (const ev of data.evaluation) parts.push(ev.text);
  for (const c of data.customSections) parts.push(c.title, c.content);
  return parts.filter(Boolean).join('\n');
}

export interface JdMatchResult {
  score: number;
  total: number;
  matched: string[];
  missing: string[];
}

/** 计算关键词覆盖率，返回 0–100 的匹配分 */
export function analyzeJdMatch(jd: string, data: ResumeData): JdMatchResult {
  const { keywords } = extractJdKeywords(jd);
  if (keywords.length === 0) {
    return { score: 0, total: 0, matched: [], missing: [] };
  }
  const resumeText = buildResumeText(data);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of keywords) {
    if (hasTerm(resumeText, keyword)) matched.push(keyword);
    else missing.push(keyword);
  }

  const score = Math.round((matched.length / keywords.length) * 100);
  return { score, total: keywords.length, matched, missing };
}
