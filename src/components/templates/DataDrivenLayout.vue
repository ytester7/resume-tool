<script setup lang="ts">
import { computed } from 'vue';
import { useResumeSections } from './shared/useResumeSections';
import { getSectionLabel } from '@/types/resume';
import {
  asText,
  countBullets,
  hasContactInfo,
  hasIdentity,
  hasText,
  visibleProjects,
} from '@/utils/resumeView';
import ContactItems from './shared/ContactItems.vue';
import type { ResumeData, SectionId } from '@/types/resume';

const props = defineProps<{
  data: ResumeData;
  sectionOrder: SectionId[];
}>();

const { renderSection, visibleSections } = useResumeSections(props, {
  skillVariant: 'table',
  evaluationVariant: 'bullets',
});

/** 只展示真正有值的统计项，避免「0+ 核心职责 / 0 项目经历」占位 */
const stats = computed(() => {
  const result: { value: string; label: string }[] = [];

  if (hasText(props.data.experienceYears)) {
    result.push({ value: asText(props.data.experienceYears), label: '工作经验' });
  }
  const duties = countBullets(props.data.experience);
  if (duties > 0) {
    result.push({ value: `${duties}+`, label: '核心职责' });
  }
  const projectCount = visibleProjects(props.data.projects).length;
  if (projectCount > 0) {
    result.push({ value: String(projectCount), label: '项目经历' });
  }
  if (hasText(props.data.salary)) {
    result.push({ value: asText(props.data.salary), label: '期望薪资' });
  }

  return result;
});

const showHeader = computed(() => hasIdentity(props.data) || stats.value.length > 0);
</script>

<template>
  <div class="resume data-driven-resume">
    <header v-if="showHeader" class="resume-header">
      <div class="header-content">
        <div class="header-left">
          <h1 v-if="data.name" class="resume-name">{{ data.name }}</h1>
          <p v-if="data.title" class="resume-title">{{ data.title }}</p>
        </div>
        <div v-if="hasContactInfo(data)" class="header-right">
          <ContactItems :data="data" variant="stacked" />
        </div>
      </div>
      <div v-if="stats.length" class="stats-bar">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </header>

    <main class="resume-body">
      <section v-for="key in visibleSections" :key="key" class="resume-section">
        <h2 class="section-title">{{ getSectionLabel(key, data.customSections) }}</h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.data-driven-resume {
  background: var(--c-bg, white);
  color: var(--c-text, #1a202c);
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  font-size: 14px;
  line-height: 1.6;
}
.resume-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  padding: 28px 32px;
  position: relative;
  overflow: hidden;
}
.resume-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: linear-gradient(135deg, transparent 50%, rgba(59, 130, 246, 0.1) 50%);
}
.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.header-left .resume-name {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 2px;
}
.header-left .resume-title {
  margin: 0;
  font-size: 15px;
  color: var(--c-primary, #60a5fa);
  font-weight: 500;
}
.header-right {
  text-align: right;
  font-size: 12px;
  line-height: 2;
  color: #94a3b8;
}
.stats-bar {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 1;
}
.stat-item { text-align: center; }
.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: var(--c-primary, #60a5fa);
}
.stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.resume-body { padding: 28px 32px 32px; }
.resume-section { margin-bottom: 22px; }
.section-title {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text, #0f172a);
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--c-primary, #3b82f6), transparent);
  margin-left: 8px;
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: var(--c-text-muted, #475569);
  line-height: 1.7;
  padding: 14px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid var(--c-primary, #3b82f6);
}
</style>
