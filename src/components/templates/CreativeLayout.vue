<script setup lang="ts">
import { useResumeSections } from './shared/useResumeSections';
import { getSectionLabel } from '@/types/resume';
import { hasContactInfo, hasIdentity } from '@/utils/resumeView';
import ContactItems from './shared/ContactItems.vue';
import type { ResumeData, SectionId } from '@/types/resume';

const props = defineProps<{
  data: ResumeData;
  sectionOrder: SectionId[];
}>();

const { renderSection, visibleSections } = useResumeSections(props, {
  skillVariant: 'compact',
  evaluationVariant: 'bullets',
});
</script>

<template>
  <div class="resume creative-resume">
    <header v-if="hasIdentity(data)" class="resume-header">
      <div class="header-content">
        <div class="header-left">
          <h1 v-if="data.name" class="resume-name">{{ data.name }}</h1>
          <p v-if="data.title" class="resume-title">{{ data.title }}</p>
        </div>
        <div v-if="hasContactInfo(data)" class="header-right">
          <ContactItems :data="data" variant="stacked" />
        </div>
      </div>
      <div v-if="data.jobIntention || data.salary" class="header-tags">
        <span v-if="data.jobIntention" class="tag">{{ data.jobIntention }}</span>
        <span v-if="data.salary" class="tag">{{ data.salary }}</span>
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
.creative-resume {
  background: var(--c-bg, white);
  color: var(--c-text, #333);
  font-family: var(--font-family, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif);
  font-size: 14px;
  line-height: 1.6;
  overflow: hidden;
}
.resume-header {
  background: linear-gradient(135deg, var(--c-primary, #667eea) 0%, #764ba2 100%);
  color: white;
  padding: 32px;
  position: relative;
  overflow: hidden;
}
.resume-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
}
.resume-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
}
.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left .resume-name {
  margin: 0 0 6px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 4px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.header-left .resume-title {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  opacity: 0.95;
}
.header-right {
  text-align: right;
  font-size: 13px;
  line-height: 2;
}
.header-tags {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}
.tag {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  backdrop-filter: blur(10px);
}
.resume-body { padding: 28px 32px 32px; }
.resume-section { margin-bottom: 22px; }
.section-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-primary, #667eea);
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--c-primary, #667eea), transparent);
  margin-left: 8px;
}
.section-summary {
  margin: 0;
  font-size: 13px;
  color: var(--c-text-muted, #555);
  line-height: 1.7;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(102,126,234,0.05), rgba(118,75,162,0.05));
  border-radius: 8px;
  border-left: 3px solid var(--c-primary, #667eea);
}
</style>
