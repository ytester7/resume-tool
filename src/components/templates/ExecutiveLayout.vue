<script setup lang="ts">
import type { ResumeData, SectionKey } from '@/types/resume';
import ContactItems from './shared/ContactItems.vue';
import SkillList from './shared/SkillList.vue';
import ExperienceItem from './shared/ExperienceItem.vue';
import ProjectItem from './shared/ProjectItem.vue';
import EvaluationList from './shared/EvaluationList.vue';

defineProps<{
  data: ResumeData;
  sectionOrder?: SectionKey[];
}>();
</script>

<template>
  <div class="executive-template">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="avatar">{{ data.name ? data.name.charAt(0) : '?' }}</div>
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
        v-if="data.jobIntention || data.salary || data.experienceYears || data.age"
        class="sidebar-intention"
      >
        <div class="sidebar-title">求职意向</div>
        <span v-if="data.jobIntention" class="badge">{{ data.jobIntention }}</span>
        <span v-if="data.salary" class="badge">{{ data.salary }}</span>
        <span v-if="data.experienceYears" class="badge">{{ data.experienceYears }}经验</span>
        <span v-if="data.age" class="badge">{{ data.age }}</span>
      </div>

      <div v-if="data.skills.length" class="sidebar-section">
        <div class="sidebar-title">专业技能</div>
        <SkillList :skills="data.skills" variant="list" />
      </div>

      <div v-if="data.education.length" class="sidebar-section">
        <div class="sidebar-title">教育背景</div>
        <div v-for="edu in data.education" :key="edu.id" class="sidebar-edu">
          <div class="sidebar-edu-school">{{ edu.school }}</div>
          <div class="sidebar-edu-detail">
            <span v-if="edu.major">{{ edu.major }}</span>
            <span v-if="edu.major && edu.degree"> | </span>
            <span v-if="edu.degree">{{ edu.degree }}</span>
          </div>
          <div v-if="edu.time" class="sidebar-edu-time">{{ edu.time }}</div>
        </div>
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
.executive-template {
  font-family: "Noto Serif SC", "Source Han Serif SC", "SimSun", Georgia, "Times New Roman", serif;
  display: flex;
  min-height: 297mm;
  color: #2c3e50;
  line-height: 1.6;
  background: #fff;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #1a2332;
  color: #e8e8e8;
  padding: 28px 18px;
  box-sizing: border-box;
  position: relative;
}
.sidebar::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #c9a96e 0%, #e8d5a3 50%, #c9a96e 100%);
}

.sidebar-header {
  text-align: center;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(201, 169, 110, 0.3);
}
.sidebar-header .avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a96e, #e8d5a3);
  color: #1a2332;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto 12px;
  font-family: "Noto Serif SC", Georgia, serif;
}
.sidebar-header h1 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 3px;
}
.sidebar-header .title {
  font-size: 12px;
  color: #c9a96e;
  font-weight: 400;
  letter-spacing: 1px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.sidebar-section { margin-bottom: 16px; }

.sidebar-intention { margin-bottom: 16px; }

.sidebar-title {
  font-size: 11px;
  font-weight: 700;
  color: #c9a96e;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(201, 169, 110, 0.25);
}

.badge {
  display: inline-block;
  font-size: 10px;
  padding: 3px 8px;
  background: rgba(201, 169, 110, 0.15);
  color: #c9a96e;
  border-radius: 3px;
  margin: 0 4px 4px 0;
  border: 1px solid rgba(201, 169, 110, 0.3);
}

.sidebar-edu { margin-bottom: 10px; }
.sidebar-edu-school { font-size: 12px; font-weight: 600; color: #fff; }
.sidebar-edu-detail { font-size: 11px; color: #b0b0b0; }
.sidebar-edu-time { font-size: 10px; color: #888; }

.template-main {
  flex: 1;
  padding: 28px 28px 20px;
  min-width: 0;
}

.section { margin-bottom: 18px; }
.section:last-child { margin-bottom: 0; }

.section-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: #1a2332;
  letter-spacing: 2px;
  padding-bottom: 6px;
  border-bottom: 2px solid #c9a96e;
}

.summary-text {
  margin: 0;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.8;
  text-align: justify;
}

/* Override shared component colors for dark sidebar */
.sidebar :deep(.contact-item) { color: #d0d0d0; }
.sidebar :deep(.skill-category) { color: #c9a96e; }
.sidebar :deep(.skill-items) { color: #d0d0d0; }
.sidebar :deep(.skill-level) { color: #c9a96e; }
</style>
