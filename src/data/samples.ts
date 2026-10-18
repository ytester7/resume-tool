import type { ResumeData } from '@/types/resume';

export interface SampleResume {
  id: string;
  /** 卡片上的短标签 */
  label: string;
  /** 面向的岗位方向 */
  role: string;
  description: string;
  data: ResumeData;
}

const evaluation = (...lines: string[]) => lines.map(text => ({ text }));

/**
 * 首次启动的三套示例简历。
 * 全部为虚构人物，覆盖测试 / 后端 / 产品三个常见方向，
 * 用于让新用户在 30 秒内看到「填满之后长什么样」。
 */
export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'qa',
    label: '测试工程师',
    role: '自动化 / 质量体系',
    description: '4 年经验，框架从 0 到 1，量化成果完整',
    data: {
      name: '陈默',
      title: '软件测试工程师 | 4 年经验 | 自动化测试 + 质量体系',
      phone: '13800138000',
      email: 'chenmo@example.com',
      age: '26岁',
      experienceYears: '4年',
      jobIntention: '测试开发工程师 / 自动化测试工程师',
      salary: '20k-30k',
      github: 'github.com/chenmo-qa',
      website: '',
      summary:
        '4 年软件测试经验，覆盖 IoT 智能硬件、企业 SaaS、物流中台三条业务线。主导搭建 Python + pytest + Selenium 自动化体系（PO 模式 + 数据驱动 + Allure 报告），把核心回归从 2 天压缩到 4 小时，效率提升 75%。具备接口、移动端、数据库全栈测试能力，累计发现有效缺陷 1200+，推动 20+ 个版本稳定上线。',
      skills: [
        { id: 'qa-s1', category: '自动化测试', items: 'Python、pytest、Selenium、PO 模式、数据驱动、Allure', level: '精通' },
        { id: 'qa-s2', category: '接口测试', items: 'requests、Postman、Fiddler/Charles、HTTP 协议、鉴权与异常场景', level: '熟练' },
        { id: 'qa-s3', category: '移动端测试', items: 'ADB、Monkey 稳定性、Android/iOS 兼容性、弱网测试', level: '熟练' },
        { id: 'qa-s4', category: '数据库与工具', items: 'MySQL 复杂查询、Redis、Jenkins、Git、缺陷管理', level: '熟练' },
        { id: 'qa-s5', category: 'AI 提效', items: '用例生成、需求分析、Prompt Engineering', level: '熟练' },
      ],
      experience: [
        {
          id: 'qa-e2',
          company: '云舟科技',
          role: '测试开发工程师',
          time: '2023.06-至今',
          description: '负责物流中台 API 集成测试，从 0 到 1 建立测试体系并探索 AI 提效。',
          achievement: '回归周期从 2 天缩短到 4 小时，线上缺陷率下降 60%',
          items: [
            '搭建 pytest + requests 接口自动化框架，封装统一鉴权与断言，覆盖 50+ 核心 API',
            '设计缺陷分级标准（P0–P3）与收敛趋势看板，推动团队累计闭环 1000+ 缺陷',
            '引入 AI 辅助生成测试用例与需求分析文档，用例设计效率提升约 40%',
          ],
        },
        {
          id: 'qa-e1',
          company: '星链智能',
          role: '测试工程师',
          time: '2021.07-2023.05',
          description: '负责智能家居 App 与 IoT 设备全链路质量保障，覆盖 10+ 机型与 4 类网络环境。',
          achievement: '版本回归效率提升 50%，线上 Crash 率降至 0.3% 以下',
          items: [
            '主导 App 核心功能（设备绑定、实时预览、固件 OTA）测试设计与执行',
            '搭建移动端兼容性矩阵，发现并推动修复适配问题 200+',
            '使用 ADB + Monkey 完成 10 万+ 次稳定性压测，提前拦截 8 个崩溃问题',
          ],
        },
      ],
      projects: [
        {
          id: 'qa-p1',
          name: '物流中台接口自动化体系',
          time: '2024.02-2025.05',
          role: '核心测试成员',
          background: '业务增长后手工回归成本急剧上升，包裹追踪、状态回传等核心链路亟需自动化兜底。',
          subtitle: 'pytest + requests + Allure｜覆盖 50+ 核心 API',
          achievement: '回归效率提升 75%，核心链路实现每日自动巡检',
          items: [
            '设计分层框架（用例层 / 业务层 / 驱动层），支持多环境切换与数据隔离',
            '封装 BaseRequest 统一 Token 鉴权与响应断言，新增用例成本降低 60%',
            '接入 Jenkins 每日定时执行，失败用例自动推送企业微信',
          ],
        },
      ],
      education: [
        { id: 'qa-edu1', school: '杭州电子科技大学', major: '计算机科学与技术', degree: '本科', time: '2017.09-2021.06' },
      ],
      evaluation: evaluation(
        '4 年测试经验，具备从 0 到 1 搭建自动化体系的完整能力，能独立完成技术选型、框架设计与落地推广。',
        '擅长用数据说话：缺陷密度、收敛趋势、自动化覆盖率均有可复用的度量实践。',
        '持续关注 AI 在测试领域的应用，习惯把重复工作沉淀为工具。',
      ),
      customSections: [],
    },
  },
  {
    id: 'backend',
    label: '后端工程师',
    role: 'Java / 高并发',
    description: '5 年经验，交易履约与稳定性治理',
    data: {
      name: '林岸',
      title: 'Java 后端工程师 | 5 年经验 | 交易履约 + 高并发',
      phone: '13900139000',
      email: 'linan@example.com',
      age: '28岁',
      experienceYears: '5年',
      jobIntention: '高级 Java 工程师 / 后端开发',
      salary: '30k-45k',
      github: 'github.com/linan-dev',
      website: '',
      summary:
        '5 年 Java 后端经验，长期负责交易、履约、库存等核心链路。主导订单履约平台重构，将核心接口 P99 从 800ms 降到 180ms，支撑大促峰值 1.2 万 QPS。熟悉 Spring Cloud、MySQL、Redis、RocketMQ 与 Kubernetes，具备从领域建模到稳定性治理的完整落地经验。',
      skills: [
        { id: 'be-s1', category: '语言与框架', items: 'Java 17、Spring Boot、Spring Cloud、MyBatis、DDD 分层', level: '精通' },
        { id: 'be-s2', category: '存储与中间件', items: 'MySQL 索引优化、Redis 缓存、RocketMQ、Elasticsearch', level: '熟练' },
        { id: 'be-s3', category: '架构与性能', items: '分布式事务、幂等设计、限流降级、链路压测', level: '熟练' },
        { id: 'be-s4', category: '运维与可观测', items: 'Docker、Kubernetes、Prometheus、Grafana、SkyWalking', level: '熟练' },
      ],
      experience: [
        {
          id: 'be-e2',
          company: '潮汐网络',
          role: '高级后端工程师',
          time: '2022.03-至今',
          description: '负责交易履约域的服务设计与稳定性治理，主导订单履约平台重构。',
          achievement: '核心接口 P99 降低 78%，大促零 P0 故障',
          items: [
            '按领域边界拆分履约服务，引入状态机统一订单流转，异常单占比从 3.1% 降到 0.6%',
            '设计本地消息表 + RocketMQ 最终一致性方案，解决跨服务库存扣减不一致问题',
            '建立全链路压测与容量评估机制，支撑峰值 1.2 万 QPS',
          ],
        },
        {
          id: 'be-e1',
          company: '启明信息',
          role: 'Java 开发工程师',
          time: '2020.07-2022.02',
          description: '参与企业采购 SaaS 的订单与结算模块开发，负责接口性能优化。',
          achievement: '慢 SQL 数量下降 90%，结算任务耗时缩短 65%',
          items: [
            '重构结算批处理任务，引入分片与并行计算，单次耗时从 42 分钟降到 15 分钟',
            '梳理 60+ 条慢查询，通过索引与分页优化将平均响应压到 120ms 以内',
          ],
        },
      ],
      projects: [
        {
          id: 'be-p1',
          name: '订单履约平台重构',
          time: '2023.05-2024.11',
          role: '技术负责人',
          background: '原单体应用承载订单、库存、履约三域，发布耦合严重，大促期间故障定位困难。',
          subtitle: 'Spring Cloud + RocketMQ + Kubernetes',
          achievement: '发布频率从每月 2 次提升到每周 2 次，P0 故障归零',
          items: [
            '完成领域拆分与灰度迁移方案，设计双写校验保障数据一致',
            '建立服务级 SLO 与告警分级，平均故障恢复时间从 35 分钟降到 8 分钟',
            '沉淀《履约域接口规范》与压测基线，被 3 个兄弟团队复用',
          ],
        },
      ],
      education: [
        { id: 'be-edu1', school: '华中科技大学', major: '软件工程', degree: '本科', time: '2016.09-2020.06' },
      ],
      evaluation: evaluation(
        '5 年后端经验，熟悉交易履约域的业务复杂度，能独立完成领域建模、服务拆分与稳定性治理。',
        '习惯用数据定位问题：P99、错误率、慢 SQL、容量水位都有完整的度量与改进闭环。',
        '有跨团队协作与技术方案推动经验，能承担技术负责人角色。',
      ),
      customSections: [],
    },
  },
  {
    id: 'product',
    label: '产品经理',
    role: 'B 端 / SaaS',
    description: '5 年经验，供应链与增长闭环',
    data: {
      name: '苏晴',
      title: 'B 端产品经理 | 5 年经验 | 供应链 SaaS',
      phone: '13700137000',
      email: 'suqing@example.com',
      age: '29岁',
      experienceYears: '5年',
      jobIntention: '高级产品经理 / B 端 SaaS',
      salary: '30k-40k',
      github: '',
      website: 'suqing.product',
      summary:
        '5 年 B 端产品经验，深耕供应链与采购 SaaS。主导供应商协同平台从 0 到 1 落地，覆盖 300+ 家企业客户，续费率提升 18%。擅长把模糊业务诉求拆成可交付的版本计划，具备需求分析、数据验证、跨团队推进的完整闭环能力。',
      skills: [
        { id: 'pm-s1', category: '产品设计', items: '需求分析、PRD、流程建模、Axure、Figma', level: '精通' },
        { id: 'pm-s2', category: '数据分析', items: 'SQL、漏斗分析、留存分析、BI 看板', level: '熟练' },
        { id: 'pm-s3', category: '项目管理', items: 'Scrum、版本规划、跨团队协作、风险管理', level: '熟练' },
        { id: 'pm-s4', category: '行业认知', items: '供应链协同、采购寻源、对账结算', level: '熟练' },
      ],
      experience: [
        {
          id: 'pm-e2',
          company: '潮汐网络',
          role: '高级产品经理',
          time: '2022.04-至今',
          description: '负责供应商协同产品线，从需求洞察到商业化落地全流程负责。',
          achievement: '客户续费率提升 18%，核心模块渗透率从 32% 提升到 71%',
          items: [
            '重构供应商准入与分级流程，将平均审核时长从 3 天缩短到 6 小时',
            '设计对账结算模块的异常处理闭环，客诉量下降 45%',
            '建立版本复盘机制，用埋点与访谈数据验证每次迭代的实际收益',
          ],
        },
        {
          id: 'pm-e1',
          company: '启明信息',
          role: '产品经理',
          time: '2020.07-2022.03',
          description: '负责采购 SaaS 的需求分析与版本交付，服务 100+ 中小企业客户。',
          achievement: '完成 3 个核心模块 0-1 落地，NPS 从 31 提升到 48',
          items: [
            '主导询报价模块设计，支持多轮报价与比价，采购周期缩短 30%',
            '搭建需求优先级评估模型（价值 × 成本 × 风险），减少无效需求 40%',
          ],
        },
      ],
      projects: [
        {
          id: 'pm-p1',
          name: '供应商协同平台 0-1',
          time: '2023.02-2024.08',
          role: '产品负责人',
          background: '客户普遍用 Excel + 邮件管理供应商，准入、绩效、对账数据分散且不可追溯。',
          subtitle: 'Web SaaS｜300+ 企业客户',
          achievement: '上线一年覆盖 300+ 客户，成为续费主要驱动模块',
          items: [
            '完成 40+ 场客户访谈，抽象出准入、绩效、对账三条核心链路',
            '设计可配置的审批流与评分卡，实施周期从 15 天降到 5 天',
            '联动研发与客户成功，建立灰度发布与反馈闭环',
          ],
        },
      ],
      education: [
        { id: 'pm-edu1', school: '浙江大学', major: '信息管理与信息系统', degree: '本科', time: '2016.09-2020.06' },
      ],
      evaluation: evaluation(
        '5 年 B 端产品经验，能在业务语言和技术语言之间做翻译，推动复杂流程落地。',
        '习惯用数据验证判断：每个版本都定义成功指标，并跟踪到实际业务结果。',
        '对供应链行业有持续积累，能快速理解客户真实场景。',
      ),
      customSections: [],
    },
  },
];
