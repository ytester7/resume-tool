<script setup lang="ts">
import { computed } from 'vue';
import type { ResumeData, SectionKey } from '@/types/resume';
import {
  hasContactInfo,
  hasIdentity,
  sectionHasContent,
} from '@/utils/resumeView';
import ContactItems from './shared/ContactItems.vue';
import SkillList from './shared/SkillList.vue';
import ExperienceItem from './shared/ExperienceItem.vue';
import ProjectItem from './shared/ProjectItem.vue';
import EducationItem from './shared/EducationItem.vue';
import EvaluationList from './shared/EvaluationList.vue';

const props = defineProps<{
  data: ResumeData;
  sectionOrder?: SectionKey[];
}>();

const hasLeft = computed(
  () =>
    sectionHasContent(props.data, 'skills') ||
    sectionHasContent(props.data, 'education') ||
    sectionHasContent(props.data, 'evaluation'),
);

const hasRight = computed(
  () =>
    sectionHasContent(props.data, 'summary') ||
    sectionHasContent(props.data, 'experience') ||
    sectionHasContent(props.data, 'projects'),
);
</script>

<template>
  <div class="european-template">
    <header v-if="hasIdentity(data)" class="resume-header">
      <div class="header-main">
        <div class="header-left">
          <h1 v-if="data.name">{{ data.name }}</h1>
          <div v-if="data.title" class="title">{{ data.title }}</div>
        </div>
        <div
          v-if="hasContactInfo(data)"
          class="header-right"
        >
          <ContactItems :data="data" variant="stacked" />
        </div>
      </div>
      <div
        v-if="data.jobIntention || data.salary"
        class="header-intention"
      >
        <span v-if="data.jobIntention">求职意向：{{ data.jobIntention }}</span>
        <span v-if="data.salary">期望薪资：{{ data.salary }}</span>
      </div>
    </header>

    <div v-if="hasLeft || hasRight" class="columns-wrapper">
      <div v-if="hasLeft" :class="['col-left', { 'is-full': !hasRight }]">
        <section v-if="sectionHasContent(data, 'skills')" class="section">
          <h2 class="section-title">专业技能</h2>
          <SkillList :skills="data.skills" variant="list" />
        </section>

        <section v-if="sectionHasContent(data, 'education')" class="section">
          <h2 class="section-title">教育背景</h2>
          <EducationItem :items="data.education" />
        </section>

        <section
          v-if="sectionHasContent(data, 'evaluation')"
          class="section"
        >
          <h2 class="section-title">自我评价</h2>
          <EvaluationList :items="data.evaluation" variant="bullets" />
        </section>
      </div>

      <div v-if="hasRight" :class="['col-right', { 'is-full': !hasLeft }]">
        <section v-if="sectionHasContent(data, 'summary')" class="section">
          <h2 class="section-title">专业概述</h2>
          <p class="summary-text">{{ data.summary }}</p>
        </section>

        <section v-if="sectionHasContent(data, 'experience')" class="section">
          <h2 class="section-title">工作经历</h2>
          <ExperienceItem :items="data.experience" />
        </section>

        <section v-if="sectionHasContent(data, 'projects')" class="section">
          <h2 class="section-title">项目经历</h2>
          <ProjectItem :items="data.projects" />
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.european-template {
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  display: flex;
  flex-direction: column;
  min-height: 297mm;
  color: var(--c-text, #374151);
  line-height: 1.6;
  background: var(--c-bg, #fff);
}

.resume-header {
  padding: 20px 24px 16px;
  border-bottom: 2px solid var(--c-primary, #374151);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.header-left h1 {
  margin: 0 0 2px;
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text, #111827);
  letter-spacing: 2px;
}
.header-left .title {
  font-size: 13px;
  color: var(--c-text-muted, #6b7280);
  font-weight: 400;
}
.header-right {
  text-align: right;
  font-size: 12px;
  line-height: 1.8;
  color: var(--c-text-muted, #4b5563);
}
.header-right :deep(.contact-items) {
  align-items: flex-end;
}

.header-intention {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--c-border, #e5e7eb);
  font-size: 12px;
  color: var(--c-text-muted, #6b7280);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.columns-wrapper {
  display: flex;
  flex: 1;
}

.col-left {
  width: 50%;
  padding: 24px 20px 24px 24px;
  box-sizing: border-box;
  border-right: 1px solid var(--c-border, #e5e7eb);
}

.col-right {
  width: 50%;
  padding: 24px 24px 24px 20px;
  box-sizing: border-box;
}

/* 另一栏没有任何内容时折叠为单栏，避免半页空白 */
.col-left.is-full {
  width: 100%;
  padding-right: 24px;
  border-right: none;
}

.col-right.is-full {
  width: 100%;
  padding-left: 24px;
}

.section { margin-bottom: 16px; }
.section:last-child { margin-bottom: 0; }

.section-title {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--c-primary, #374151);
  text-transform: uppercase;
  letter-spacing: 3px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--c-border, #d1d5db);
}

.summary-text {
  margin: 0;
  font-size: 12px;
  color: var(--c-text-muted, #4b5563);
  line-height: 1.7;
  text-align: justify;
}
</style>
