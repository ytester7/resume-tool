<script setup lang="ts">
import { useResumeSections } from './shared/useResumeSections';
import { getSectionLabel } from '@/types/resume';
import { hasContactInfo, hasIdentity } from '@/utils/resumeView';
import ContactItems from './shared/ContactItems.vue';
import type { ResumeData, SectionId, SectionKey } from '@/types/resume';

const props = defineProps<{
  data: ResumeData;
  sectionOrder: SectionId[];
}>();

const SEALS: Record<SectionKey, string> = {
  summary: '概',
  skills: '技',
  experience: '历',
  projects: '项',
  education: '学',
  evaluation: '',
};

const { renderSection, visibleSections } = useResumeSections(props, {
  skillVariant: 'list',
  evaluationVariant: 'bullets',
});
</script>

<template>
  <div class="resume chinese-elegant-template">
    <header v-if="hasIdentity(data)" class="resume-header">
      <div class="header-main">
        <div class="header-left">
          <h1 v-if="data.name">{{ data.name }}</h1>
          <div v-if="data.title" class="title">{{ data.title }}</div>
        </div>
        <div v-if="hasContactInfo(data)" class="header-right">
          <ContactItems :data="data" variant="stacked" />
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
          <span v-if="SEALS[key as SectionKey]" class="seal">{{ SEALS[key as SectionKey] }}</span>
          {{ getSectionLabel(key, data.customSections) }}
        </h2>
        <component :is="renderSection(key)" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.chinese-elegant-template {
  padding: 0;
  color: var(--c-text, #2c3e50);
  background: var(--c-bg, #faf6f0);
  font-family: var(--font-family, "KaiTi", "楷体", "Noto Serif SC", "SimSun", "宋体", Georgia, serif);
  font-size: 14px;
  line-height: 1.8;
}
.resume-header {
  position: relative;
  padding: 24px 32px 18px;
  background: var(--c-bg, #faf6f0);
  border-bottom: 2px solid var(--c-primary, #c0392b);
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
  color: var(--c-text, #2c3e50);
  letter-spacing: 6px;
  font-family: var(--font-family, "KaiTi", "楷体", serif);
}
.header-left .title {
  font-size: 14px;
  font-weight: 400;
  color: var(--c-text-muted, #7f8c8d);
  letter-spacing: 2px;
}
.header-right {
  text-align: right;
  font-size: 12px;
  line-height: 2;
  color: var(--c-text-muted, #555);
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
  color: var(--c-text-muted, #7f8c8d);
  border-top: 1px dashed var(--c-border, #d4c5a9);
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
  color: var(--c-text, #2c3e50);
  letter-spacing: 3px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  margin-left: 8px;
  background: var(--c-border, #d4c5a9);
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
  color: var(--c-primary, #c0392b);
  border: 1.5px solid var(--c-primary, #c0392b);
  border-radius: 2px;
  letter-spacing: 0;
  transform: rotate(-5deg);
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: var(--c-text, #4a4a4a);
  line-height: 2;
  text-align: justify;
  text-indent: 2em;
}
</style>
