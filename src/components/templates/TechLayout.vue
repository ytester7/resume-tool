<script setup lang="ts">
import type { ResumeData, SectionKey } from '@/types/resume';
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
  <div class="tech-template">
    <header class="resume-header">
      <div class="terminal-bar">
        <div class="terminal-dot red"></div>
        <div class="terminal-dot yellow"></div>
        <div class="terminal-dot green"></div>
      </div>
      <div class="terminal-title">resume.sh — bash — 80x24</div>
      <div class="header-main">
        <div class="header-left">
          <h1 v-if="data.name">{{ data.name }}</h1>
          <div v-if="data.title" class="title">{{ data.title }}</div>
          <div class="prompt">
            <span>$</span> cat <span class="path">~/resume.json</span> | jq '.status'
          </div>
        </div>
        <div
          v-if="data.phone || data.email || data.github || data.website"
          class="header-right"
        >
          <ContactItems :data="data" variant="stacked" />
        </div>
      </div>
      <div
        v-if="data.jobIntention || data.salary || data.experienceYears"
        class="header-tags"
      >
        <span v-if="data.jobIntention" class="tag">{{ data.jobIntention }}</span>
        <span v-if="data.salary" class="tag">{{ data.salary }}</span>
        <span v-if="data.experienceYears" class="tag">{{ data.experienceYears }}经验</span>
      </div>
    </header>

    <main class="resume-body">
      <section v-if="data.summary" class="section">
        <h2 class="section-title">README.md</h2>
        <p class="summary-text">{{ data.summary }}</p>
      </section>

      <section v-if="data.skills.length" class="section">
        <h2 class="section-title">skills.config</h2>
        <SkillList :skills="data.skills" variant="table" />
      </section>

      <section v-if="data.experience.length" class="section">
        <h2 class="section-title">experience.log</h2>
        <ExperienceItem :items="data.experience" />
      </section>

      <section v-if="data.projects.length" class="section">
        <h2 class="section-title">projects/</h2>
        <ProjectItem :items="data.projects" />
      </section>

      <section v-if="data.education.length" class="section">
        <h2 class="section-title">education.log</h2>
        <EducationItem :items="data.education" />
      </section>

      <section
        v-if="data.evaluation.some(e => e.text.trim())"
        class="section"
      >
        <h2 class="section-title">self-eval.md</h2>
        <EvaluationList :items="data.evaluation" variant="bullets" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.tech-template {
  font-family: "JetBrains Mono", "Fira Code", "Source Code Pro", "Consolas", "Microsoft YaHei", monospace;
  background: #0d1117;
  color: #c9d1d9;
  line-height: 1.6;
  position: relative;
  overflow: hidden;
  min-height: 297mm;
}
.tech-template::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(0,255,136,0.03) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(88,166,255,0.03) 0%, transparent 50%);
  pointer-events: none;
}

.resume-header {
  padding: 28px 32px;
  border-bottom: 1px solid #21262d;
  position: relative;
  z-index: 1;
}

.terminal-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.terminal-dot.red { background: #ff5f56; }
.terminal-dot.yellow { background: #ffbd2e; }
.terminal-dot.green { background: #27c93f; }

.terminal-title {
  font-size: 11px;
  color: #8b949e;
  text-align: center;
  margin-top: -18px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}
.header-left h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #00ff88;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0,255,136,0.3);
}
.header-left .title {
  font-size: 14px;
  color: #58a6ff;
  margin-top: 4px;
}
.header-left .prompt {
  font-size: 12px;
  color: #8b949e;
  margin-top: 8px;
}
.header-left .prompt span { color: #00ff88; }
.header-left .prompt .path { color: #58a6ff; }

.header-right {
  text-align: right;
  font-size: 12px;
}
.header-right :deep(.contact-items) {
  align-items: flex-end;
}
.header-right :deep(.contact-item) {
  color: #8b949e;
  justify-content: flex-end;
}

.header-tags {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  background: rgba(0,255,136,0.1);
  border: 1px solid rgba(0,255,136,0.3);
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  color: #00ff88;
}

.resume-body {
  padding: 24px 32px 32px;
  position: relative;
  z-index: 1;
}

.section { margin-bottom: 20px; }
.section:last-child { margin-bottom: 0; }

.section-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: #58a6ff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title::before {
  content: '#';
  color: #00ff88;
  font-weight: 400;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #21262d;
  margin-left: 8px;
}

.summary-text {
  margin: 0;
  font-size: 12px;
  color: #8b949e;
  line-height: 1.7;
  padding: 12px;
  background: #161b22;
  border-radius: 6px;
  border: 1px solid #21262d;
}

/* Override shared component colors for dark theme */
.resume-body :deep(.skills-table) {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 6px;
}
.resume-body :deep(.skills-table td) {
  border-bottom-color: #21262d;
  color: #c9d1d9;
}
.resume-body :deep(.skill-cat-cell) { color: #00ff88; }
.resume-body :deep(.skill-level-cell) { color: #58a6ff; }

.resume-body :deep(.experience-item) {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 6px;
  border-left: 3px solid #00ff88;
  padding: 14px;
}
.resume-body :deep(.experience-company) { color: #58a6ff; }
.resume-body :deep(.experience-role) { color: #00ff88; }
.resume-body :deep(.experience-time) {
  color: #8b949e;
  background: #21262d;
  border-radius: 4px;
  padding: 2px 8px;
}
.resume-body :deep(.experience-desc) { color: #8b949e; }
.resume-body :deep(.experience-items-list) { color: #c9d1d9; }
.resume-body :deep(.experience-achievement) {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.08);
}

.resume-body :deep(.project-item) {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 6px;
  border-left: 3px solid #58a6ff;
  padding: 14px;
}
.resume-body :deep(.project-name) { color: #58a6ff; }
.resume-body :deep(.project-time) {
  color: #8b949e;
  background: #21262d;
  border-radius: 4px;
  padding: 2px 8px;
}
.resume-body :deep(.project-role) { color: #00ff88; }
.resume-body :deep(.project-bg),
.resume-body :deep(.project-subtitle) { color: #8b949e; }
.resume-body :deep(.project-items-list) { color: #c9d1d9; }
.resume-body :deep(.project-achievement) {
  color: #00ff88;
  background: rgba(0, 255, 136, 0.08);
}

.resume-body :deep(.education-item) {
  background: #161b22;
  border: 1px solid #21262d;
  border-radius: 6px;
  padding: 12px 14px;
}
.resume-body :deep(.edu-school) { color: #58a6ff; }
.resume-body :deep(.edu-time) {
  color: #8b949e;
  background: #21262d;
  border-radius: 4px;
  padding: 2px 8px;
}
.resume-body :deep(.edu-meta) { color: #8b949e; }

.resume-body :deep(.eval-bullets) { color: #c9d1d9; }
</style>
