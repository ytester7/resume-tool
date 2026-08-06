<script setup lang="ts">
import type { ResumeData, SectionKey } from '@/types/resume';
import AppIcon from '@/components/AppIcon.vue';
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
  <div class="tech-gradient-template">
    <aside class="gradient-bar">
      <div class="avatar">{{ data.name ? data.name.charAt(0) : '?' }}</div>
      <div v-if="data.phone" class="bar-icon"><AppIcon name="phone" /></div>
      <div v-if="data.email" class="bar-icon"><AppIcon name="email" /></div>
      <div v-if="data.github" class="bar-icon"><AppIcon name="github" /></div>
      <div v-if="data.website" class="bar-icon"><AppIcon name="globe" /></div>
    </aside>

    <main class="template-main">
      <header class="resume-header">
        <h1 v-if="data.name">{{ data.name }}</h1>
        <div v-if="data.title" class="title">{{ data.title }}</div>
        <div
          v-if="data.phone || data.email || data.github || data.website"
          class="header-contact"
        >
          <ContactItems :data="data" variant="inline" />
        </div>
        <div
          v-if="data.jobIntention || data.salary || data.experienceYears || data.age"
          class="header-intention"
        >
          <span v-if="data.jobIntention" class="tag">{{ data.jobIntention }}</span>
          <span v-if="data.salary" class="tag">{{ data.salary }}</span>
          <span v-if="data.experienceYears" class="tag">{{ data.experienceYears }}经验</span>
          <span v-if="data.age" class="tag">{{ data.age }}</span>
        </div>
      </header>

      <section v-if="data.summary" class="section">
        <h2 class="section-title">专业概述</h2>
        <p class="summary-text">{{ data.summary }}</p>
      </section>

      <section v-if="data.skills.length" class="section">
        <h2 class="section-title">专业技能</h2>
        <SkillList :skills="data.skills" variant="bars" />
      </section>

      <section v-if="data.experience.length" class="section">
        <h2 class="section-title">工作经历</h2>
        <ExperienceItem :items="data.experience" />
      </section>

      <section v-if="data.projects.length" class="section">
        <h2 class="section-title">项目经历</h2>
        <ProjectItem :items="data.projects" />
      </section>

      <section v-if="data.education.length" class="section">
        <h2 class="section-title">教育背景</h2>
        <EducationItem :items="data.education" />
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
.tech-gradient-template {
  font-family: var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
  display: flex;
  min-height: 297mm;
  color: var(--c-text, #334155);
  line-height: 1.6;
  background: var(--c-bg, #fff);
}

.gradient-bar {
  width: 110px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #1e3a5f 0%, var(--c-primary, #0891b2) 50%, #06b6d4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 10px;
  box-sizing: border-box;
  color: white;
}
.gradient-bar .avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  border: 2px solid rgba(255, 255, 255, 0.4);
}
.gradient-bar .bar-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  opacity: 0.85;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
}

.template-main {
  flex: 1;
  padding: 24px 28px 20px;
  min-width: 0;
}

.resume-header {
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--c-border, #e2e8f0);
}
.resume-header h1 {
  margin: 0 0 4px;
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e3a5f, var(--c-primary, #0891b2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}
.resume-header .title {
  font-size: 14px;
  color: var(--c-text-muted, #64748b);
  font-weight: 400;
}

.header-contact {
  margin-top: 10px;
  font-size: 12px;
  color: var(--c-text-muted, #475569);
}
.header-contact :deep(.contact-item) { color: var(--c-text-muted, #475569); }

.header-intention {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.header-intention .tag {
  font-size: 11px;
  padding: 3px 10px;
  background: linear-gradient(135deg, rgba(30, 58, 95, 0.08), rgba(8, 145, 178, 0.08));
  color: var(--c-primary, #0891b2);
  border-radius: 12px;
  border: 1px solid rgba(8, 145, 178, 0.2);
}

.section { margin-bottom: 16px; }
.section:last-child { margin-bottom: 0; }

.section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--c-text, #1e3a5f);
  padding: 0 0 6px 12px;
  border-left: 3px solid var(--c-primary, #0891b2);
}

.summary-text {
  margin: 0;
  font-size: 13px;
  color: var(--c-text-muted, #475569);
  line-height: 1.8;
  text-align: justify;
}

/* Override shared skill bars to use gradient fill */
.section :deep(.skill-bar-fill) {
  background: linear-gradient(90deg, #1e3a5f, var(--c-primary, #0891b2));
}
.section :deep(.skill-category) { color: var(--c-text, #1e3a5f); }
.section :deep(.skill-level) { color: var(--c-primary, #0891b2); }
</style>
