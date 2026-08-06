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
        <h2 class="section-title">{{ getSectionLabel(key, data.customSections) }}</h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.minimal-resume {
  background: var(--c-bg, #fff);
  padding: 40px;
  color: var(--c-text, #333);
  font-family: var(--font-family, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", Arial, sans-serif);
  font-size: 14px;
  line-height: 1.7;
}
.resume-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--c-border, #e5e5e5);
}
.resume-name {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 400;
  letter-spacing: 8px;
  color: var(--c-text, #111);
}
.resume-title {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--c-text-muted, #666);
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
  color: var(--c-text-muted, #666);
}
.resume-section { margin-bottom: 24px; }
.section-title {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-muted, #999);
  text-transform: uppercase;
  letter-spacing: 3px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--c-border, #eee);
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: var(--c-text-muted, #555);
  line-height: 1.8;
  text-align: justify;
}
</style>
