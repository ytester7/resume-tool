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
  skillVariant: 'list',
  evaluationVariant: 'bullets',
});
</script>

<template>
  <div class="resume qa-pro-template">
    <header v-if="hasIdentity(data)" class="resume-header">
      <div class="header-content">
        <div class="header-left">
          <div v-if="data.name" class="avatar">{{ data.name.charAt(0) }}</div>
          <div class="header-info">
            <h1 v-if="data.name">{{ data.name }}</h1>
            <div v-if="data.title" class="title">{{ data.title }}</div>
          </div>
        </div>
        <div v-if="hasContactInfo(data)" class="header-right">
          <ContactItems :data="data" variant="stacked" />
        </div>
      </div>
      <div v-if="data.jobIntention || data.salary" class="header-badges">
        <span v-if="data.jobIntention" class="badge">{{ data.jobIntention }}</span>
        <span v-if="data.salary" class="badge">{{ data.salary }}</span>
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
.qa-pro-template {
  background: var(--c-bg, #fff);
  color: var(--c-text, #2d3748);
  font-family: var(--font-family, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  font-size: 14px;
  line-height: 1.6;
}
.resume-header {
  position: relative;
  padding: 32px;
  background: linear-gradient(135deg, var(--c-primary, #166534) 0%, #15803d 50%, #16a34a 100%);
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
  color: var(--c-primary, #166534);
  border-bottom: 2px solid var(--c-primary, #16a34a);
}
.section-summary {
  margin: 0;
  padding: 14px;
  font-size: 13px;
  color: var(--c-text-muted, #4a5568);
  line-height: 1.7;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-left: 4px solid var(--c-primary, #16a34a);
  border-radius: 8px;
}
</style>
