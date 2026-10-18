<script setup lang="ts">
import { computed } from 'vue';
import type { Education } from '@/types/resume';
import { asText, visibleEducation } from '@/utils/resumeView';

const props = defineProps<{ items: Education[] }>();

const list = computed(() =>
  visibleEducation(props.items).map(edu => ({
    id: edu.id,
    school: asText(edu.school),
    major: asText(edu.major),
    degree: asText(edu.degree),
    time: asText(edu.time),
  })),
);
</script>

<template>
  <div v-if="list.length" class="education-list">
    <div v-for="edu in list" :key="edu.id" class="education-item">
      <div v-if="edu.school || edu.time" class="edu-header">
        <span v-if="edu.school" class="edu-school">{{ edu.school }}</span>
        <span v-if="edu.time" class="edu-time">{{ edu.time }}</span>
      </div>
      <div v-if="edu.major || edu.degree" class="edu-meta">
        <span v-if="edu.major">{{ edu.major }}</span>
        <span v-if="edu.major && edu.degree"> · </span>
        <span v-if="edu.degree">{{ edu.degree }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.education-list { display: flex; flex-direction: column; gap: 8px; }
.education-item { font-size: 13px; }
.edu-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; }
.edu-school { font-weight: 600; overflow-wrap: anywhere; }
.edu-time { color: var(--c-text-muted, #999); font-size: 12px; }
.edu-meta { color: var(--c-text-muted, #666); margin-top: 2px; overflow-wrap: anywhere; }
</style>
