import { defineStore } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import type {
  ResumeSession, ResumeData, TemplateName, SectionId,
  CustomSection, ThemeConfig, Skill, Experience, Project, Education,
} from '@/types/resume';
import { TEMPLATE_REGISTRY, defaultResumeData, generateId } from '@/types/resume';
import { sanitizeHiddenSections } from '@/utils/hiddenSections';

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<ResumeSession[]>([]);
  const activeId = ref<string | null>(null);

  const active = computed(() =>
    tabs.value.find(t => t.id === activeId.value) ?? null,
  );

  function open(opts: Partial<ResumeSession> = {}): ResumeSession {
    const data = opts.data ? structuredClone(toRaw(opts.data)) : defaultResumeData();
    const session: ResumeSession = {
      id: opts.id || generateId(),
      title: opts.title || data.name.trim() || '未命名',
      data,
      template: opts.template || 'classic',
      sectionOrder: opts.sectionOrder ?? null,
      fileHandle: opts.fileHandle ?? null,
      dirty: opts.dirty ?? false,
      theme: opts.theme ?? null,
      targetJd: opts.targetJd ?? '',
      hiddenSections: opts.hiddenSections ?? [],
    };
    tabs.value.push(session);
    activeId.value = session.id;
    return session;
  }

  function switchTo(id: string): void {
    if (tabs.value.find(t => t.id === id)) {
      activeId.value = id;
    }
  }

  function close(id: string): boolean {
    const idx = tabs.value.findIndex(t => t.id === id);
    if (idx === -1) return true;
    tabs.value.splice(idx, 1);
    if (activeId.value === id) {
      activeId.value = tabs.value[0]?.id ?? null;
    }
    localStorage.removeItem(`resume_tab_${id}`);
    return true;
  }

  function patchActive(patch: Partial<ResumeData>): void {
    if (!active.value) return;
    Object.assign(active.value.data, patch);
    // 姓名变化时同步 Tab 标题，避免所有 Tab 都叫"未命名"
    if (typeof patch.name === 'string') {
      active.value.title = patch.name.trim() || '未命名';
    }
    active.value.dirty = true;
  }

  /** 用快照整体替换当前 Tab 的数据（撤销/重做专用） */
  function replaceActive(snapshot: {
    data: ResumeData;
    template?: TemplateName;
    sectionOrder?: SectionId[] | null;
    theme?: ThemeConfig | null;
    hiddenSections?: SectionId[];
  }): void {
    if (!active.value) return;
    active.value.data = structuredClone(snapshot.data);
    if (snapshot.template) active.value.template = snapshot.template;
    if (snapshot.sectionOrder !== undefined) active.value.sectionOrder = snapshot.sectionOrder;
    if (snapshot.theme !== undefined) active.value.theme = snapshot.theme;
    if (snapshot.hiddenSections !== undefined) {
      active.value.hiddenSections = sanitizeHiddenSections(snapshot.hiddenSections);
    }
    active.value.dirty = true;
  }

  function setTargetJd(jd: string): void {
    if (!active.value) return;
    active.value.targetJd = jd;
    active.value.dirty = true;
  }

  function setTemplate(tpl: TemplateName): void {
    if (active.value) {
      active.value.template = tpl;
      active.value.dirty = true;
    }
  }

  function setSectionOrder(order: SectionId[] | null): void {
    if (active.value) {
      active.value.sectionOrder = order;
      active.value.dirty = true;
    }
  }

  function setTheme(theme: ThemeConfig | null): void {
    if (active.value) {
      active.value.theme = theme;
      active.value.dirty = true;
    }
  }

  /** 隐藏 / 显示某个区块：数据保留，仅影响预览与导出 */
  function setSectionHidden(id: SectionId, hidden: boolean): void {
    const tab = active.value;
    if (!tab) return;
    if (tab.hiddenSections.includes(id) === hidden) return;
    tab.hiddenSections = hidden
      ? [...tab.hiddenSections, id]
      : tab.hiddenSections.filter(x => x !== id);
    tab.dirty = true;
  }

  function toggleSectionHidden(id: SectionId): void {
    const tab = active.value;
    if (!tab) return;
    setSectionHidden(id, !tab.hiddenSections.includes(id));
  }

  /** 一次性恢复所有被隐藏的区块 */
  function showAllSections(): void {
    const tab = active.value;
    if (!tab || tab.hiddenSections.length === 0) return;
    tab.hiddenSections = [];
    tab.dirty = true;
  }

  function addCustomSection(): void {
    if (!active.value) return;
    const id = generateId();
    const sec: CustomSection = { id, title: '', content: '' };
    active.value.data.customSections.push(sec);
    const meta = TEMPLATE_REGISTRY[active.value.template];
    if (meta.sectionOrderMutable) {
      const order = active.value.sectionOrder ?? meta.defaultSectionOrder;
      active.value.sectionOrder = [...order, `custom:${id}`];
    }
    active.value.dirty = true;
  }

  function removeCustomSection(index: number): void {
    if (!active.value) return;
    const sec = active.value.data.customSections[index];
    if (!sec) return;
    active.value.data.customSections.splice(index, 1);
    if (active.value.sectionOrder) {
      active.value.sectionOrder = active.value.sectionOrder.filter(
        (k) => k !== `custom:${sec.id}`,
      );
    }
    active.value.hiddenSections = active.value.hiddenSections.filter(
      (k) => k !== `custom:${sec.id}`,
    );
    active.value.dirty = true;
  }

  function rename(id: string, title: string): void {
    const t = tabs.value.find(x => x.id === id);
    if (t) t.title = title;
  }

  function markClean(): void {
    if (active.value) active.value.dirty = false;
  }

  function markDirty(): void {
    if (active.value) active.value.dirty = true;
  }

  function addSkill(): void {
    if (!active.value) return;
    const s: Skill = { id: generateId(), category: '', items: '', level: '熟练' };
    active.value.data.skills.push(s);
    active.value.dirty = true;
  }

  function removeSkill(index: number): void {
    if (!active.value) return;
    active.value.data.skills.splice(index, 1);
    active.value.dirty = true;
  }

  function addExperience(): void {
    if (!active.value) return;
    const e: Experience = {
      id: generateId(),
      company: '', role: '', time: '', description: '', achievement: '', items: [],
    };
    active.value.data.experience.push(e);
    active.value.dirty = true;
  }

  function removeExperience(index: number): void {
    if (!active.value) return;
    active.value.data.experience.splice(index, 1);
    active.value.dirty = true;
  }

  function addProject(): void {
    if (!active.value) return;
    const p: Project = {
      id: generateId(),
      name: '', time: '', role: '', background: '', subtitle: '', achievement: '', items: [],
    };
    active.value.data.projects.push(p);
    active.value.dirty = true;
  }

  function removeProject(index: number): void {
    if (!active.value) return;
    active.value.data.projects.splice(index, 1);
    active.value.dirty = true;
  }

  function addEducation(): void {
    if (!active.value) return;
    const e: Education = { id: generateId(), school: '', major: '', degree: '', time: '' };
    active.value.data.education.push(e);
    active.value.dirty = true;
  }

  function removeEducation(index: number): void {
    if (!active.value) return;
    active.value.data.education.splice(index, 1);
    active.value.dirty = true;
  }

  function findExistingByTitle(title: string): ResumeSession | undefined {
    return tabs.value.find(t => t.title === title);
  }

  return {
    tabs, activeId, active,
    open, switchTo, close,
    patchActive, replaceActive, setTargetJd,
    setTemplate, setSectionOrder, setTheme, rename, markClean, markDirty,
    setSectionHidden, toggleSectionHidden, showAllSections,
    addSkill, removeSkill, addExperience, removeExperience,
    addProject, removeProject, addEducation, removeEducation,
    addCustomSection, removeCustomSection,
    findExistingByTitle,
  };
});
