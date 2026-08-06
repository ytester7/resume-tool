<script setup lang="ts">
import type { Project } from '@/types/resume';

defineProps<{ items: Project[]; }>();
</script>

<template>
  <div v-if="items.length" class="project-list">
    <div v-for="proj in items" :key="proj.id" class="project-item">
      <div class="project-header">
        <span class="project-name">{{ proj.name }}</span>
        <span class="project-time">{{ proj.time }}</span>
      </div>
      <div class="project-meta">
        <span v-if="proj.role" class="project-role">角色：{{ proj.role }}</span>
      </div>
      <p v-if="proj.background" class="project-bg">{{ proj.background }}</p>
      <p v-if="proj.subtitle" class="project-subtitle">{{ proj.subtitle }}</p>
      <ul v-if="proj.items.length" class="project-items-list">
        <li v-for="(line, i) in proj.items" :key="i">{{ line }}</li>
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
.project-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.project-name { font-weight: 600; font-size: 14px; }
.project-time { color: var(--c-text-muted, #999); font-size: 12px; }
.project-meta { font-size: 12px; color: var(--c-text-muted, #666); margin-bottom: 4px; }
.project-bg, .project-subtitle { margin: 4px 0; color: var(--c-text-muted, #555); font-size: 13px; }
.project-items-list { margin: 6px 0; padding-left: 18px; color: var(--c-text-muted, #555); font-size: 13px; line-height: 1.6; }
.project-achievement { margin: 6px 0 0; color: var(--c-text, #333); font-size: 13px; background: #f9f0ff; padding: 6px 10px; border-radius: 4px; }
</style>
