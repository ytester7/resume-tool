import { describe, it, expect, beforeEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import EditorPanel from './EditorPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import TemplateSection from './sections/TemplateSection.vue';
import SkillsSection from './sections/SkillsSection.vue';


describe('EditorPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('classic 模板显示区块顺序面板', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' }); // classic
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.section-order-panel').exists()).toBe(true);
  });

  it('modern 固定布局模板显示禁用提示', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', template: 'modern' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.section-order-disabled').exists()).toBe(true);
  });

  it('渲染所有编辑区块', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.findComponent(BasicInfoSection).exists()).toBe(true);
    expect(wrapper.findComponent(TemplateSection).exists()).toBe(true);
    expect(wrapper.findComponent(SkillsSection).exists()).toBe(true);
  });
});

describe('EditorPanel - 模块显隐', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  function switchOf(wrapper: VueWrapper, label: string) {
    return wrapper.findAll('.module-switch').find(i => i.attributes('aria-label') === label);
  }

  it('classic 模板按区块顺序列出 6 个内置模块开关', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.findAll('.module-switch')).toHaveLength(6);
    expect(wrapper.findAll('.order-name').map(n => n.text()))
      .toEqual(['专业概述', '专业技能', '工作经历', '项目经历', '教育背景', '自我评价']);
  });

  it('关闭开关后写入 hiddenSections 并给区块打上已隐藏标记', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);

    await switchOf(wrapper, '工作经历')!.trigger('click');

    expect(tabs.active?.hiddenSections).toEqual(['experience']);
    expect(wrapper.find('[data-health-target="experience"]').classes()).toContain('block-off');
  });

  it('隐藏的模块从主列表移出，进入「已隐藏」折叠区', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.hidden-modules').exists()).toBe(false);

    await switchOf(wrapper, '工作经历')!.trigger('click');

    expect(wrapper.find('.visible-modules').text()).not.toContain('工作经历');
    expect(wrapper.find('.hidden-modules').text()).toContain('工作经历');
    expect(wrapper.find('.hidden-summary').text()).toContain('已隐藏 1 个模块');
  });

  it('在「已隐藏」区打开开关后模块回到主列表', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);

    await switchOf(wrapper, '教育背景')!.trigger('click');
    expect(wrapper.find('.hidden-modules').exists()).toBe(true);

    await switchOf(wrapper, '教育背景')!.trigger('click');

    expect(tabs.active?.hiddenSections).toEqual([]);
    expect(wrapper.find('.hidden-modules').exists()).toBe(false);
    expect(wrapper.find('.visible-modules').text()).toContain('教育背景');
    expect(wrapper.find('[data-health-target="education"]').classes()).not.toContain('block-off');
  });



  it('有隐藏模块时出现「全部显示」按钮，点击后清空', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.findAll('.reset-btn').map(b => b.text())).not.toContain('全部显示');

    await switchOf(wrapper, '项目经历')!.trigger('click');
    const showAll = wrapper.findAll('.reset-btn').find(b => b.text() === '全部显示');
    expect(showAll).toBeTruthy();

    await showAll!.trigger('click');
    expect(tabs.active?.hiddenSections).toEqual([]);
  });

  it('固定布局模板也提供模块开关（无拖拽排序）', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', template: 'modern' });
    const wrapper = mount(EditorPanel);

    expect(wrapper.find('.order-list').exists()).toBe(true);
    expect(wrapper.find('.section-order-disabled').exists()).toBe(true);
    expect(wrapper.findAll('.module-switch')).toHaveLength(6);
  });

  it('自定义区块也会出现在模块列表并可隐藏', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addCustomSection();
    const wrapper = mount(EditorPanel);

    const items = wrapper.findAll('.order-item');
    expect(items).toHaveLength(7);

    await switchOf(wrapper, '自定义区块')!.trigger('click');
    expect(tabs.active?.hiddenSections).toEqual([`custom:${tabs.active!.data.customSections[0].id}`]);
  });
});

describe('EditorPanel - 简历健康度卡片', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('渲染健康度卡片并显示总分', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.health-card').exists()).toBe(true);
    expect(Number(wrapper.find('.score-num').text())).toBeGreaterThan(0);
  });

  it('空简历隐藏健康度卡片，填写后显示"待改进"等级', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const empty = mount(EditorPanel);
    expect(empty.find('.health-card').exists()).toBe(false);

    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.grade-badge').text()).toBe('待改进');
    expect(wrapper.find('.health-card.grade-待改进').exists()).toBe(true);
  });

  it('渲染 5 个维度条', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.findAll('.dim-row')).toHaveLength(5);
    // 维度名称齐全
    const names = wrapper.findAll('.dim-name').map(n => n.text());
    expect(names).toEqual(['完整性', '量化度', '充实度', '关键词', '规范性']);
  });

  it('低分简历生成改进建议列表', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    expect(wrapper.find('.suggestions').exists()).toBe(true);
    expect(wrapper.findAll('.suggestion-item').length).toBeGreaterThan(0);
  });

  it('完整简历显示"良好"或"优秀"等级', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    // 用多字符关键词，确保概述能命中技能关键词
    tabs.patchActive({
      name: '张三', title: '前端', email: 'a@b.com', phone: '13800138000',
      experienceYears: '5', jobIntention: '前端', github: 'gh',
      summary: '精通 Vue React TypeScript，5 年前端经验，主导多个项目落地，提升效率 30%。擅长工程化与性能优化。',
      skills: [
        { id: '1', category: '前端', items: 'Vue,React,Angular,Next.js,Nuxt.js', level: '精通' },
        { id: '2', category: '语言', items: 'TypeScript,JavaScript,HTML,CSS,Node.js', level: '精通' },
        { id: '3', category: '工程', items: 'Vite,Webpack,ESLint,Vitest,Turbo', level: '熟练' },
        { id: '4', category: '可视化', items: 'D3,Chart,ECharts,Canvas,WebGL', level: '熟练' },
        { id: '5', category: '后端', items: 'Express,Koa,NestJS,Redis,MySQL', level: '了解' },
      ],
      experience: [
        {
          id: 'e1', company: 'c', role: 'r', time: '2020.01-2024.01',
          description: '负责公司核心产品的前端架构设计与开发，带领团队完成多个版本迭代',
          achievement: '提升页面性能 30%，减少加载时间 2 秒',
          items: ['主导组件库建设，复用率达 80%', '优化构建流程，节省 50% 时间'],
        },
        {
          id: 'e2', company: 'c2', role: 'r', time: '2018.01-2020.01',
          description: '负责业务模块开发，参与架构升级与代码规范建设',
          achievement: '降低 Bug 率 40%，提升交付效率 25%',
          items: ['重构核心模块，减少 60% 代码', '引入自动化测试，覆盖率 90%'],
        },
      ],
      projects: [
        {
          id: 'p1', name: 'p', time: '2022.01-2023.01', role: 'r',
          background: 'b', subtitle: 's', achievement: '用户增长 100 万',
          items: ['设计架构，支持 10 万 QPS', '优化首屏加载，减少 3 秒'],
        },
        {
          id: 'p2', name: 'p2', time: '2021.01-2022.01', role: 'r',
          background: 'b', subtitle: 's', achievement: '节省成本 200 万',
          items: ['实现核心功能 5 个', '优化性能，提升 40%'],
        },
      ],
      education: [{ id: 'ed1', school: 's', major: 'm', degree: 'd', time: '2016.09-2020.06' }],
      evaluation: [{ text: '认真负责' }, { text: '学习能力强' }],
    });
    const wrapper = mount(EditorPanel);
    const grade = wrapper.find('.grade-badge').text();
    expect(['优秀', '良好']).toContain(grade);
  });

  it('点击折叠按钮切换展开状态', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    // 初始展开
    expect(wrapper.find('.health-toggle.collapsed').exists()).toBe(false);
    await wrapper.find('.health-header').trigger('click');
    // 收起后 toggle 添加 collapsed 类
    expect(wrapper.find('.health-toggle.collapsed').exists()).toBe(true);
  });

  it('建议项含 target 时可点击且有 clickable 类', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    const clickableItems = wrapper.findAll('.suggestion-item.clickable');
    expect(clickableItems.length).toBeGreaterThan(0);
  });

  it('点击带 target 的建议不抛异常', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '张三' });
    const wrapper = mount(EditorPanel);
    const item = wrapper.find('.suggestion-item.clickable');
    // querySelector 在 jsdom 中找不到元素也不应抛错
    await item.trigger('click');
    expect(true).toBe(true);
  });
});

