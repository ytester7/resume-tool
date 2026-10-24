<script setup lang="ts">
import { computed } from 'vue';
import type { ResumeData } from '@/types/resume';
import { contactEntries } from '@/utils/resumeView';
import AppIcon from '@/components/AppIcon.vue';

const props = defineProps<{
  data: ResumeData;
  variant?: 'inline' | 'stacked';
}>();

// 字段缺失/为空的联系方式直接不产出条目，避免空图标和「26岁 岁」这类重复单位
const entries = computed(() => contactEntries(props.data));
</script>

<template>
  <div v-if="entries.length" :class="['contact-items', props.variant]">
    <span v-for="entry in entries" :key="entry.field" class="contact-item">
      <AppIcon :name="entry.icon" /> {{ entry.text }}
    </span>
  </div>
</template>

<style scoped>
.contact-items.inline { display: flex; flex-wrap: wrap; gap: 12px; }
.contact-items.stacked { display: flex; flex-direction: column; gap: 6px; }
.contact-item {
  display: inline-flex; align-items: center; gap: 4px; font-size: 13px;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
