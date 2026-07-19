<script setup lang="ts">
import type { Education } from '@/types/resume';

defineProps<{ items: Education[]; }>();
</script>

<template>
  <div v-if="items.length" class="education-list">
    <div v-for="edu in items" :key="edu.id" class="education-item">
      <div class="edu-header">
        <span class="edu-school">{{ edu.school }}</span>
        <span class="edu-time">{{ edu.time }}</span>
      </div>
      <div class="edu-meta">
        <span v-if="edu.major">{{ edu.major }}</span>
        <span v-if="edu.degree"> · {{ edu.degree }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.education-list { display: flex; flex-direction: column; gap: 8px; }
.education-item { font-size: 13px; }
.edu-header { display: flex; justify-content: space-between; }
.edu-school { font-weight: 600; }
.edu-time { color: #999; font-size: 12px; }
.edu-meta { color: #666; margin-top: 2px; }
</style>
