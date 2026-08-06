<script setup lang="ts">
import type { Experience } from '@/types/resume';

defineProps<{
  items: Experience[];
  variant?: 'default' | 'compact';
}>();
</script>

<template>
  <div v-if="items.length" class="experience-list">
    <div v-for="exp in items" :key="exp.id" class="experience-item">
      <div class="experience-header">
        <span class="experience-company">{{ exp.company }}</span>
        <span class="experience-role">{{ exp.role }}</span>
        <span class="experience-time">{{ exp.time }}</span>
      </div>
      <p v-if="exp.description" class="experience-desc">{{ exp.description }}</p>
      <ul v-if="exp.items.length" class="experience-items-list">
        <li v-for="(line, i) in exp.items" :key="i">{{ line }}</li>
      </ul>
      <p v-if="exp.achievement" class="experience-achievement">
        <strong>关键成果：</strong>{{ exp.achievement }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.experience-list { display: flex; flex-direction: column; gap: 16px; }
.experience-item { padding-left: 12px; border-left: 3px solid var(--c-primary, #1890ff); }
.experience-header { display: flex; gap: 12px; margin-bottom: 6px; font-size: 14px; }
.experience-company { font-weight: 600; }
.experience-role { color: var(--c-text-muted, #555); }
.experience-time { color: var(--c-text-muted, #999); margin-left: auto; font-size: 12px; }
.experience-desc { margin: 4px 0; color: var(--c-text-muted, #666); font-size: 13px; }
.experience-items-list { margin: 6px 0; padding-left: 18px; color: var(--c-text-muted, #555); font-size: 13px; line-height: 1.6; }
.experience-achievement { margin: 6px 0 0; color: var(--c-text, #333); font-size: 13px; background: #f6ffed; padding: 6px 10px; border-radius: 4px; }
</style>
