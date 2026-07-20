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
      return h(SkillList, { skills: props.data.skills, variant: 'bars' });
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
  <div class="resume gradient-resume">
    <div class="resume-inner">
      <header class="resume-header">
        <div class="header-content">
          <div class="header-left">
            <h1 v-if="data.name" class="resume-name">{{ data.name }}</h1>
            <p v-if="data.title" class="resume-title">{{ data.title }}</p>
          </div>
          <div class="header-right">
            <ContactItems
              v-if="data.phone || data.email || data.github || data.website"
              :data="data"
              variant="stacked"
            />
          </div>
        </div>
        <div v-if="data.jobIntention || data.salary || data.experienceYears || data.age" class="header-tags">
          <span v-if="data.jobIntention" class="tag">{{ data.jobIntention }}</span>
          <span v-if="data.salary" class="tag">{{ data.salary }}</span>
          <span v-if="data.experienceYears" class="tag">{{ data.experienceYears }}经验</span>
          <span v-if="data.age" class="tag">{{ data.age }}</span>
        </div>
      </header>

      <main class="resume-body">
        <section v-for="key in visibleSections" :key="key" class="resume-section">
          <h2 class="section-title">{{ SECTION_LABELS[key] }}</h2>
          <component :is="renderSection(key)" />
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.gradient-resume {
  background: white;
  color: #1e293b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.6;
}
.resume-inner { background: white; min-height: 100%; }
.resume-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px;
  position: relative;
  overflow: hidden;
}
.resume-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -30%;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
}
.resume-header::after {
  content: '';
  position: absolute;
  bottom: -40%;
  left: -10%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
}
.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.header-left .resume-name {
  margin: 0 0 6px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 3px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.header-left .resume-title {
  margin: 0;
  font-size: 16px;
  font-weight: 300;
  opacity: 0.95;
}
.header-right {
  text-align: right;
  font-size: 12px;
  line-height: 2.2;
}
.header-tags {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}
.tag {
  background: rgba(255,255,255,0.2);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
}
.resume-body { padding: 28px 32px 32px; }
.resume-section { margin-bottom: 22px; }
.section-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2, transparent);
  margin-left: 8px;
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
  padding: 14px;
  background: linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.05));
  border-radius: 8px;
  border-left: 4px solid #667eea;
}
</style>
