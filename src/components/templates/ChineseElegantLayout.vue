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

const SEALS: Record<SectionKey, string> = {
  summary: '概',
  skills: '技',
  experience: '历',
  projects: '项',
  education: '学',
  evaluation: '',
};

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
      return h(EvaluationList, { items: props.data.evaluation, variant: 'bullets' });
  }
}

const visibleSections = computed(() =>
  props.sectionOrder.filter(sectionHasContent),
);
</script>

<template>
  <div class="resume chinese-elegant-template">
    <header class="resume-header">
      <div class="header-main">
        <div class="header-left">
          <h1 v-if="data.name">{{ data.name }}</h1>
          <div v-if="data.title" class="title">{{ data.title }}</div>
        </div>
        <div class="header-right">
          <ContactItems
            v-if="data.phone || data.email || data.github || data.website || data.age || data.experienceYears"
            :data="data"
            variant="stacked"
          />
        </div>
      </div>
      <div v-if="data.jobIntention || data.salary" class="header-intention">
        <span v-if="data.jobIntention">求职意向：{{ data.jobIntention }}</span>
        <span v-if="data.salary">期望薪资：{{ data.salary }}</span>
      </div>
    </header>

    <main class="resume-body">
      <section v-for="key in visibleSections" :key="key" class="resume-section">
        <h2 class="section-title">
          <span v-if="SEALS[key]" class="seal">{{ SEALS[key] }}</span>
          {{ SECTION_LABELS[key] }}
        </h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.chinese-elegant-template {
  padding: 0;
  color: #2c3e50;
  background: #faf6f0;
  font-family: "KaiTi", "楷体", "Noto Serif SC", "SimSun", "宋体", Georgia, serif;
  font-size: 14px;
  line-height: 1.8;
}
.resume-header {
  position: relative;
  padding: 24px 32px 18px;
  background: #faf6f0;
  border-bottom: 2px solid #c0392b;
}
.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.header-left h1 {
  margin: 0 0 4px;
  font-size: 30px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 6px;
  font-family: "KaiTi", "楷体", serif;
}
.header-left .title {
  font-size: 14px;
  font-weight: 400;
  color: #7f8c8d;
  letter-spacing: 2px;
}
.header-right {
  text-align: right;
  font-size: 12px;
  line-height: 2;
  color: #555;
}
.header-right :deep(.contact-items.stacked) {
  align-items: flex-end;
}
.header-intention {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px;
  padding-top: 8px;
  font-size: 12px;
  color: #7f8c8d;
  border-top: 1px dashed #d4c5a9;
}
.resume-body {
  padding: 18px 32px 24px;
}
.resume-section {
  margin-bottom: 18px;
}
.section-title {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  padding-bottom: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: 3px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  margin-left: 8px;
  background: #d4c5a9;
}
.seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  color: #c0392b;
  border: 1.5px solid #c0392b;
  border-radius: 2px;
  letter-spacing: 0;
  transform: rotate(-5deg);
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: #4a4a4a;
  line-height: 2;
  text-align: justify;
  text-indent: 2em;
}
</style>
