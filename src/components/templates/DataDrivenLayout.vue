<script setup lang="ts">
import { computed } from 'vue';
import { useResumeSections } from './shared/useResumeSections';
import { getSectionLabel } from '@/types/resume';
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

const coreDutiesCount = computed(() =>
  props.data.experience.reduce((sum, exp) => sum + (exp.items ? exp.items.length : 0), 0),
);
</script>

<template>
  <div class="resume data-driven-resume">
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
      <div class="stats-bar">
        <div v-if="data.experienceYears" class="stat-item">
          <div class="stat-value">{{ data.experienceYears }}</div>
          <div class="stat-label">工作经验</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ coreDutiesCount }}+</div>
          <div class="stat-label">核心职责</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ data.projects.length }}</div>
          <div class="stat-label">项目经历</div>
        </div>
        <div v-if="data.salary" class="stat-item">
          <div class="stat-value">{{ data.salary }}</div>
          <div class="stat-label">期望薪资</div>
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
