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
      return h(EvaluationList, { items: props.data.evaluation, variant: 'bullets' });
  }
}

const visibleSections = computed(() =>
  props.sectionOrder.filter(sectionHasContent),
);
</script>

<template>
  <div class="resume qa-pro-template">
    <header class="resume-header">
      <div class="header-content">
        <div class="header-left">
          <div class="avatar">{{ data.name ? data.name.charAt(0) : '?' }}</div>
          <div class="header-info">
            <h1 v-if="data.name">{{ data.name }}</h1>
            <div v-if="data.title" class="title">{{ data.title }}</div>
          </div>
        </div>
        <div class="header-right">
          <ContactItems
            v-if="data.phone || data.email || data.github || data.website || data.age || data.experienceYears"
            :data="data"
            variant="stacked"
          />
        </div>
      </div>
      <div v-if="data.jobIntention || data.salary" class="header-badges">
        <span v-if="data.jobIntention" class="badge">{{ data.jobIntention }}</span>
        <span v-if="data.salary" class="badge">{{ data.salary }}</span>
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
.qa-pro-template {
  background: #fff;
  color: #2d3748;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
.resume-header {
  position: relative;
  padding: 32px;
  background: linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%);
  color: #fff;
}
.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.avatar {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}
.header-info h1 {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 2px;
}
.header-info .title {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.95;
}
.header-right {
  text-align: right;
  font-size: 12px;
  line-height: 2.2;
}
.header-right :deep(.contact-items.stacked) {
  align-items: flex-end;
}
.header-badges {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.badge {
  padding: 4px 14px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}
.resume-body {
  padding: 36px 32px 32px;
}
.resume-section {
  margin-bottom: 22px;
}
.section-title {
  margin: 0 0 14px;
  padding-bottom: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #166534;
  border-bottom: 2px solid #16a34a;
}
.section-summary {
  margin: 0;
  padding: 14px;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.7;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-left: 4px solid #16a34a;
  border-radius: 8px;
}
</style>
