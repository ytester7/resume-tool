import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from './tabs';

describe('useTabsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('初始状态 tabs 为空，active 为 null', () => {
    const tabs = useTabsStore();
    expect(tabs.tabs).toEqual([]);
    expect(tabs.active).toBe(null);
    expect(tabs.activeId).toBe(null);
  });

  it('open 新建空白 Tab', () => {
    const tabs = useTabsStore();
    const session = tabs.open({ title: '测试' });
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.activeId).toBe(session.id);
    expect(tabs.active?.title).toBe('测试');
    expect(tabs.active?.template).toBe('classic');
    expect(tabs.active?.dirty).toBe(false);
  });

  it('open 复制当前 Tab 数据', () => {
    const tabs = useTabsStore();
    tabs.open({ title: '原版' });
    tabs.patchActive({ name: '张三' });
    const s2 = tabs.open({ title: '副本', data: JSON.parse(JSON.stringify(tabs.active!.data)) });
    expect(tabs.tabs.length).toBe(2);
    expect(tabs.active?.id).toBe(s2.id);
    expect(tabs.active?.data.name).toBe('张三');
  });

  it('switchTo 切换激活 Tab', () => {
    const tabs = useTabsStore();
    const s1 = tabs.open({ title: 'A' });
    const s2 = tabs.open({ title: 'B' });
    expect(tabs.activeId).toBe(s2.id);
    tabs.switchTo(s1.id);
    expect(tabs.activeId).toBe(s1.id);
  });

  it('switchTo 不存在的 id 不变', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.switchTo('non-exist');
    expect(tabs.tabs.length).toBe(1);
  });

  it('patchActive 更新当前 Tab 数据并标记 dirty', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: '李四' });
    expect(tabs.active?.data.name).toBe('李四');
    expect(tabs.active?.dirty).toBe(true);
  });

  it('patchActive 无 active 时不报错', () => {
    const tabs = useTabsStore();
    expect(() => tabs.patchActive({ name: 'x' })).not.toThrow();
  });

  it('setTemplate 更新当前 Tab 模板并标记 dirty', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setTemplate('modern');
    expect(tabs.active?.template).toBe('modern');
    expect(tabs.active?.dirty).toBe(true);
  });

  it('setSectionOrder 设置为 null 表示用模板默认', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setSectionOrder(['skills', 'summary']);
    expect(tabs.active?.sectionOrder).toEqual(['skills', 'summary']);
    tabs.setSectionOrder(null);
    expect(tabs.active?.sectionOrder).toBe(null);
  });

  it('rename 修改 Tab 标题', () => {
    const tabs = useTabsStore();
    const s = tabs.open({ title: 'A' });
    tabs.rename(s.id, '新名字');
    expect(tabs.active?.title).toBe('新名字');
  });

  it('markClean 清除 dirty 标志', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.patchActive({ name: 'x' });
    expect(tabs.active?.dirty).toBe(true);
    tabs.markClean();
    expect(tabs.active?.dirty).toBe(false);
  });

  it('close 非 dirty Tab 直接关闭', () => {
    const tabs = useTabsStore();
    const s1 = tabs.open({ title: 'A' });
    const s2 = tabs.open({ title: 'B' });
    const result = tabs.close(s1.id);
    expect(result).toBe(true);
    expect(tabs.tabs.length).toBe(1);
    expect(tabs.activeId).toBe(s2.id);
  });

  it('close 不存在的 id 返回 true', () => {
    const tabs = useTabsStore();
    expect(tabs.close('non-exist')).toBe(true);
  });

  it('close 最后一个 Tab 后 active 为 null', () => {
    const tabs = useTabsStore();
    const s = tabs.open({ title: 'A' });
    tabs.close(s.id);
    expect(tabs.tabs.length).toBe(0);
    expect(tabs.active).toBe(null);
  });

  it('addSkill/removeSkill 操作技能列表', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    expect(tabs.active?.data.skills.length).toBe(0);
    tabs.addSkill();
    expect(tabs.active?.data.skills.length).toBe(1);
    expect(tabs.active?.dirty).toBe(true);
    tabs.removeSkill(0);
    expect(tabs.active?.data.skills.length).toBe(0);
  });

  it('addExperience/removeExperience 操作工作经历', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addExperience();
    expect(tabs.active?.data.experience.length).toBe(1);
    tabs.removeExperience(0);
    expect(tabs.active?.data.experience.length).toBe(0);
  });

  it('addProject/removeProject 操作项目经历', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addProject();
    expect(tabs.active?.data.projects.length).toBe(1);
    tabs.removeProject(0);
    expect(tabs.active?.data.projects.length).toBe(0);
  });

  it('addEducation/removeEducation 操作教育背景', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addEducation();
    expect(tabs.active?.data.education.length).toBe(1);
    tabs.removeEducation(0);
    expect(tabs.active?.data.education.length).toBe(0);
  });

  it('addCustomSection 在可变序模板自动 append 到 sectionOrder', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' }); // 默认 classic，sectionOrderMutable
    tabs.addCustomSection();
    expect(tabs.active?.data.customSections.length).toBe(1);
    const id = tabs.active!.data.customSections[0].id;
    expect(tabs.active?.sectionOrder).toEqual([
      'summary', 'skills', 'experience', 'projects', 'education', 'evaluation',
      `custom:${id}`,
    ]);
    expect(tabs.active?.dirty).toBe(true);
  });

  it('addCustomSection 在固定布局模板不 append sectionOrder', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', template: 'modern' });
    tabs.addCustomSection();
    expect(tabs.active?.data.customSections.length).toBe(1);
    expect(tabs.active?.sectionOrder).toBe(null);
  });

  it('removeCustomSection 清理数据与 sectionOrder', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addCustomSection();
    tabs.addCustomSection();
    const firstId = tabs.active!.data.customSections[0].id;
    tabs.removeCustomSection(0);
    expect(tabs.active?.data.customSections.length).toBe(1);
    expect(tabs.active?.sectionOrder?.filter(k => k === `custom:${firstId}`)).toEqual([]);
    expect(tabs.active?.sectionOrder).toHaveLength(7); // 6 内置 + 1 剩余 custom
  });

  it('setTheme 更新当前 Tab 主题并标记 dirty', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.setTheme({ primaryColor: '#ff0000', fontFamily: '' });
    expect(tabs.active?.theme).toEqual({ primaryColor: '#ff0000', fontFamily: '' });
    expect(tabs.active?.dirty).toBe(true);
    tabs.setTheme(null);
    expect(tabs.active?.theme).toBe(null);
  });

  it('open 透传 theme', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', theme: { primaryColor: '#123456', fontFamily: 'serif' } });
    expect(tabs.active?.theme).toEqual({ primaryColor: '#123456', fontFamily: 'serif' });
  });

  it('findExistingByTitle 按标题找已存在 Tab', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const found = tabs.findExistingByTitle('A');
    expect(found?.title).toBe('A');
    expect(tabs.findExistingByTitle('B')).toBe(undefined);
  });

  it('close 时清理 localStorage 兜底数据', () => {
    const tabs = useTabsStore();
    const s = tabs.open({ title: 'A' });
    localStorage.setItem(`resume_tab_${s.id}`, 'dummy');
    tabs.close(s.id);
    expect(localStorage.getItem(`resume_tab_${s.id}`)).toBe(null);
  });
});
