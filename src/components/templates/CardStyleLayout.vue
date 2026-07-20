<script setup lang="ts">
import { h, computed } from 'vue';
import type { ResumeData, SectionKey } from '@/types/resume';
import { SECTION_LABELS } from '@/types/resume';
import ContactItems from './shared/ContactItems.vue';
import SkillList from './shared/SkillList.vue';
import ExperienceItem from './shared/ExperienceItem.vue';
import ProjectItem from './shared/ProjectItem.vue';
import EducationItem from './shared/EducationItem.vue';
import EvaluationList from './shared/EvaluationList.vue';

const props = defineProps<{
  data: ResumeData;
  sectionOrder: SectionKey[];
}>();

function sectionHasContent(key: SectionKey): boolean {
  const d = props.data;
  switch (key) {
    case 'summary': return !!d.summary.trim();
    case 'skills': return d.skills.length > 0;
    case 'experience': return d.experience.length > 0;
    case 'projects': return d.projects.length > 0;
    case 'education': return d.education.length > 0;
    case 'evaluation': return d.evaluation.some(e => e.text.trim());
  }
}

function renderSection(key: SectionKey) {
  switch (key) {
    case 'summary':
      return h('p', { class: 'section-summary' }, props.data.summary);
    case 'skills':
      return h(SkillList, { skills: props.data.skills, variant: 'compact' });
    case 'experience':
      return h(ExperienceItem, { items: props.data.experience });
    case 'projects':
      return h(ProjectItem, { items: props.data.projects });
    case 'education':
      return h(EducationItem, { items: props.data.education });
    case 'evaluation':
      return h(EvaluationList, { items: props.data.evaluation, variant: 'bullets' });
  }
}

const visibleSections = computed(() =>
  props.sectionOrder.filter(sectionHasContent),
);
</script>

<template>
  <div class="resume card-style-template">
    <header class="resume-header">
      <h1 v-if="data.name">{{ data.name }}</h1>
      <div v-if="data.title" class="title">{{ data.title }}</div>
      <div v-if="data.phone || data.email || data.github || data.website || data.age || data.experienceYears" class="contact-bar">
        <ContactItems :data="data" variant="inline" />
      </div>
      <div v-if="data.jobIntention || data.salary" class="intention-bar">
        <span v-if="data.jobIntention" class="tag">{{ data.jobIntention }}</span>
        <span v-if="data.salary" class="tag">{{ data.salary }}</span>
      </div>
    </header>

    <main class="resume-body">
      <section
        v-for="key in visibleSections"
        :key="key"
        :class="['resume-section', `section-${key}`]"
      >
        <h2 class="section-title">{{ SECTION_LABELS[key] }}</h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.card-style-template {
  padding: 20px 24px;
  color: #334155;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
.resume-header {
  margin-bottom: 16px;
  padding: 20px 24px;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.resume-header h1 {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 3px;
}
.title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6366f1;
}
.contact-bar {
  display: flex;
  justify-content: center;
}
.contact-bar :deep(.contact-items.inline) {
  justify-content: center;
}
.intention-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}
.tag {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 500;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 20px;
}
.resume-section {
  margin-bottom: 12px;
  padding: 16px 18px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #6366f1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.resume-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.section-skills { border-left-color: #3b82f6; }
.section-experience { border-left-color: #10b981; }
.section-projects { border-left-color: #8b5cf6; }
.section-education { border-left-color: #f59e0b; }
.section-evaluation { border-left-color: #ef4444; }
.section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.8;
  text-align: justify;
}
</style>
