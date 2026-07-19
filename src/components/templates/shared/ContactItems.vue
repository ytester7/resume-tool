<script setup lang="ts">
import type { ResumeData } from '@/types/resume';
import AppIcon from '@/components/AppIcon.vue';

const props = defineProps<{
  data: ResumeData;
  variant?: 'inline' | 'stacked';
}>();
</script>

<template>
  <div :class="['contact-items', props.variant]">
    <span v-if="data.phone" class="contact-item">
      <AppIcon name="phone" /> {{ data.phone }}
    </span>
    <span v-if="data.email" class="contact-item">
      <AppIcon name="email" /> {{ data.email }}
    </span>
    <span v-if="data.age" class="contact-item">
      <AppIcon name="user" /> {{ data.age }} 岁
    </span>
    <span v-if="data.experienceYears" class="contact-item">
      <AppIcon name="clock" /> {{ data.experienceYears }} 年经验
    </span>
    <span v-if="data.github" class="contact-item">
      <AppIcon name="github" /> {{ data.github }}
    </span>
    <span v-if="data.website" class="contact-item">
      <AppIcon name="globe" /> {{ data.website }}
    </span>
  </div>
</template>

<style scoped>
.contact-items.inline { display: flex; flex-wrap: wrap; gap: 12px; }
.contact-items.stacked { display: flex; flex-direction: column; gap: 6px; }
.contact-item {
  display: inline-flex; align-items: center; gap: 4px; font-size: 13px;
}
</style>
