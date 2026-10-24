<script setup lang="ts">
import { computed } from 'vue';
import type { Project } from '@/types/resume';
import { asText, visibleBullets, visibleProjects } from '@/utils/resumeView';

const props = defineProps<{ items: Project[] }>();

const list = computed(() =>
  visibleProjects(props.items).map(proj => ({
    id: proj.id,
    name: asText(proj.name),
    time: asText(proj.time),
    role: asText(proj.role),
    background: asText(proj.background),
    subtitle: asText(proj.subtitle),
    achievement: asText(proj.achievement),
    bullets: visibleBullets(proj.items),
  })),
);
</script>

<template>
  <div v-if="list.length" class="project-list">
    <div v-for="proj in list" :key="proj.id" class="project-item">
      <div v-if="proj.name || proj.time" class="project-header">
        <span v-if="proj.name" class="project-name">{{ proj.name }}</span>
        <span v-if="proj.time" class="project-time">{{ proj.time }}</span>
      </div>
      <div v-if="proj.role" class="project-meta">
        <span class="project-role">角色：{{ proj.role }}</span>
      </div>
      <p v-if="proj.background" class="project-bg">{{ proj.background }}</p>
      <p v-if="proj.subtitle" class="project-subtitle">{{ proj.subtitle }}</p>
      <ul v-if="proj.bullets.length" class="project-items-list">
        <li v-for="(line, i) in proj.bullets" :key="i">{{ line }}</li>
      </ul>
      <p v-if="proj.achievement" class="project-achievement">
        <strong>关键成果：</strong>{{ proj.achievement }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.project-list { display: flex; flex-direction: column; gap: 16px; }
.project-item { padding-left: 12px; border-left: 3px solid var(--c-primary, #722ed1); }
.project-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; margin-bottom: 4px; }
.project-name { font-weight: 600; font-size: 14px; overflow-wrap: anywhere; }
.project-time { color: var(--c-text-muted, #999); font-size: 12px; }
.project-meta { font-size: 12px; color: var(--c-text-muted, #666); margin-bottom: 4px; }
.project-bg, .project-subtitle { margin: 4px 0; color: var(--c-text-muted, #555); font-size: 13px; overflow-wrap: anywhere; }
.project-items-list { margin: 6px 0; padding-left: 18px; color: var(--c-text-muted, #555); font-size: 13px; line-height: 1.6; }
.project-items-list li { overflow-wrap: anywhere; }
.project-achievement { margin: 6px 0 0; color: var(--c-text, #333); font-size: 13px; background: #f9f0ff; padding: 6px 10px; border-radius: 4px; overflow-wrap: anywhere; }
</style>
