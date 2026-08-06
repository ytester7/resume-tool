<script setup lang="ts">
import type { ResumeData, SectionKey } from '@/types/resume';
import ContactItems from './shared/ContactItems.vue';
import SkillList from './shared/SkillList.vue';
import ExperienceItem from './shared/ExperienceItem.vue';
import ProjectItem from './shared/ProjectItem.vue';
import EducationItem from './shared/EducationItem.vue';
import EvaluationList from './shared/EvaluationList.vue';

defineProps<{
  data: ResumeData;
  sectionOrder?: SectionKey[];
}>();
</script>

<template>
  <div class="modern-template">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 v-if="data.name">{{ data.name }}</h1>
        <div v-if="data.title" class="title">{{ data.title }}</div>
      </div>

      <div
        v-if="data.phone || data.email || data.github || data.website"
        class="sidebar-section"
      >
        <div class="sidebar-title">联系方式</div>
        <ContactItems :data="data" variant="stacked" />
      </div>

      <div
        v-if="data.jobIntention || data.salary || data.experienceYears"
        class="sidebar-section"
      >
        <div class="sidebar-title">求职意向</div>
        <ul class="intention-list">
          <li v-if="data.jobIntention">{{ data.jobIntention }}</li>
          <li v-if="data.salary">{{ data.salary }}</li>
          <li v-if="data.experienceYears">{{ data.experienceYears }}经验</li>
        </ul>
      </div>

      <div v-if="data.skills.length" class="sidebar-section">
        <div class="sidebar-title">专业技能</div>
        <SkillList :skills="data.skills" variant="compact" />
      </div>

      <div v-if="data.education.length" class="sidebar-section">
        <div class="sidebar-title">教育背景</div>
        <EducationItem :items="data.education" />
      </div>
    </aside>

    <main class="template-main">
      <section v-if="data.summary" class="section">
        <h2 class="section-title">专业概述</h2>
        <p class="summary-text">{{ data.summary }}</p>
      </section>

      <section v-if="data.experience.length" class="section">
        <h2 class="section-title">工作经历</h2>
        <ExperienceItem :items="data.experience" />
      </section>

      <section v-if="data.projects.length" class="section">
        <h2 class="section-title">项目经历</h2>
        <ProjectItem :items="data.projects" />
      </section>

      <section
        v-if="data.evaluation.some(e => e.text.trim())"
        class="section"
      >
        <h2 class="section-title">自我评价</h2>
        <EvaluationList :items="data.evaluation" variant="bullets" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.modern-template {
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  display: flex;
  min-height: 297mm;
  color: var(--c-text, #334155);
  line-height: 1.6;
  background: var(--c-bg, #fff);
}

.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--c-bg, #f8fafc);
  padding: 24px 16px;
  border-right: 3px solid var(--c-primary, #10b981);
  box-sizing: border-box;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--c-border, #e2e8f0);
}
.sidebar-header h1 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: var(--c-text, #0f172a);
  letter-spacing: 2px;
}
.sidebar-header .title {
  font-size: 12px;
  color: var(--c-primary, #10b981);
  font-weight: 500;
  overflow-wrap: break-word;
  word-break: break-word;
}

.sidebar-section { margin-bottom: 14px; }

.sidebar-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--c-primary, #10b981);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--c-border, #e2e8f0);
}

.intention-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 11px;
  color: var(--c-text-muted, #475569);
}
.intention-list li {
  margin-bottom: 6px;
  line-height: 1.4;
  overflow-wrap: break-word;
  word-break: break-word;
}

.template-main {
  flex: 1;
  min-width: 0;
  padding: 24px 24px 28px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.section { margin-bottom: 18px; }
.section:last-child { margin-bottom: 0; }

.section-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-text, #0f172a);
  padding-bottom: 4px;
  border-bottom: 2px solid var(--c-primary, #10b981);
  letter-spacing: 1px;
}

.summary-text {
  margin: 0;
  font-size: 12.5px;
  color: var(--c-text-muted, #475569);
  line-height: 1.7;
  text-align: justify;
}
</style>
