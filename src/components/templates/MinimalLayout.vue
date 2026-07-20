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
  <div class="resume minimal-resume">
    <header class="resume-header">
      <h1 v-if="data.name" class="resume-name">{{ data.name }}</h1>
      <p v-if="data.title" class="resume-title">{{ data.title }}</p>
      <ContactItems
        v-if="data.phone || data.email || data.github || data.website"
        :data="data"
        variant="inline"
      />
      <div v-if="data.jobIntention || data.salary || data.experienceYears" class="resume-intent">
        <span v-if="data.jobIntention">{{ data.jobIntention }}</span>
        <span v-if="data.salary">{{ data.salary }}</span>
        <span v-if="data.experienceYears">{{ data.experienceYears }}经验</span>
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
.minimal-resume {
  background: #fff;
  padding: 40px;
  color: #333;
  font-family: "Helvetica Neue", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.7;
}
.resume-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e5e5;
}
.resume-name {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 400;
  letter-spacing: 8px;
  color: #111;
}
.resume-title {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #666;
}
.resume-intent {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 11px;
}
.resume-intent span {
  padding: 3px 12px;
  background: #f5f5f5;
  border-radius: 3px;
  color: #666;
}
.resume-section { margin-bottom: 24px; }
.section-title {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 3px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  text-align: justify;
}
</style>
