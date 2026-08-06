<script setup lang="ts">
import { useResumeSections } from './shared/useResumeSections';
import { getSectionLabel } from '@/types/resume';
import ContactItems from './shared/ContactItems.vue';
import type { ResumeData, SectionId } from '@/types/resume';

const props = defineProps<{
  data: ResumeData;
  sectionOrder: SectionId[];
}>();

const { renderSection, visibleSections } = useResumeSections(props, {
  skillVariant: 'list',
  evaluationVariant: 'paragraphs',
});
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
        <h2 class="section-title">{{ getSectionLabel(key, data.customSections) }}</h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.classic-resume {
  background: var(--c-bg, #fff); padding: 40px; color: var(--c-text, #333);
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif);
  font-size: 14px; line-height: 1.5;
}
.resume-header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid var(--c-primary, #1890ff); }
.resume-name { margin: 0 0 4px; font-size: 28px; font-weight: 700; color: var(--c-primary, #1890ff); }
.resume-title { margin: 0 0 8px; font-size: 16px; color: var(--c-text-muted, #555); }
.resume-intent { margin-top: 8px; font-size: 13px; color: var(--c-text-muted, #666); display: flex; gap: 16px; }
.resume-section { margin-bottom: 20px; }
.section-title {
  margin: 0 0 12px; font-size: 16px; font-weight: 600; color: var(--c-primary, #1890ff);
  padding-bottom: 4px; border-bottom: 1px solid var(--c-border, #e8e8e8);
}
.section-summary { margin: 0; color: var(--c-text-muted, #555); line-height: 1.7; }
</style>
