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
      return h(SkillList, { skills: props.data.skills, variant: 'list' });
    case 'experience':
      return h(ExperienceItem, { items: props.data.experience });
    case 'projects':
      return h(ProjectItem, { items: props.data.projects });
    case 'education':
      return h(EducationItem, { items: props.data.education });
    case 'evaluation':
      return h(EvaluationList, { items: props.data.evaluation, variant: 'paragraphs' });
  }
}

const visibleSections = computed(() =>
  props.sectionOrder.filter(sectionHasContent),
);
</script>

<template>
  <div class="resume classic-resume">
    <header class="resume-header">
      <h1 v-if="data.name" class="resume-name">{{ data.name }}</h1>
      <p v-if="data.title" class="resume-title">{{ data.title }}</p>
      <ContactItems
        v-if="data.phone || data.email || data.github"
        :data="data"
        variant="inline"
      />
      <div v-if="data.jobIntention || data.salary" class="resume-intent">
        <span v-if="data.jobIntention">求职意向：{{ data.jobIntention }}</span>
        <span v-if="data.salary">期望薪资：{{ data.salary }}</span>
      </div>
    </header>

    <main class="resume-body">
      <section v-for="key in visibleSections" :key="key" class="resume-section">
        <h2 class="section-title">{{ SECTION_LABELS[key] }}</h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.classic-resume {
  background: #fff; padding: 40px; color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px; line-height: 1.5;
}
.resume-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1890ff; }
.resume-name { margin: 0 0 4px; font-size: 28px; font-weight: 700; color: #1890ff; }
.resume-title { margin: 0 0 8px; font-size: 16px; color: #555; }
.resume-intent { margin-top: 8px; font-size: 13px; color: #666; display: flex; gap: 16px; }
.resume-section { margin-bottom: 20px; }
.section-title {
  margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1890ff;
  padding-bottom: 4px; border-bottom: 1px solid #e8e8e8;
}
.section-summary { margin: 0; color: #555; line-height: 1.7; }
</style>
