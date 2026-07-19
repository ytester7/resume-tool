import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ResumeSession, ResumeData, TemplateName, SectionKey, Skill, Experience, Project, Education } from '@/types/resume';
import { defaultResumeData, generateId } from '@/types/resume';

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<ResumeSession[]>([]);
  const activeId = ref<string | null>(null);

  const active = computed(() =>
    tabs.value.find(t => t.id === activeId.value) ?? null,
  );

  function open(opts: Partial<ResumeSession> = {}): ResumeSession {
    const session: ResumeSession = {
      id: opts.id || generateId(),
      title: opts.title || '未命名',
      data: opts.data ? structuredClone(opts.data) : defaultResumeData(),
      template: opts.template || 'classic',
      sectionOrder: opts.sectionOrder ?? null,
      fileHandle: opts.fileHandle ?? null,
      dirty: opts.dirty ?? false,
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
    active.value.dirty = true;
  }

  function setTemplate(tpl: TemplateName): void {
    if (active.value) {
      active.value.template = tpl;
      active.value.dirty = true;
    }
  }

  function setSectionOrder(order: SectionKey[] | null): void {
    if (active.value) {
      active.value.sectionOrder = order;
      active.value.dirty = true;
    }
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
    patchActive, setTemplate, setSectionOrder, rename, markClean, markDirty,
    addSkill, removeSkill, addExperience, removeExperience,
    addProject, removeProject, addEducation, removeEducation,
    findExistingByTitle,
  };
});
