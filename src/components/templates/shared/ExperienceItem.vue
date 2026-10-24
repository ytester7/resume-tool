<script setup lang="ts">
import { computed } from 'vue';
import type { Experience } from '@/types/resume';
import { asText, visibleBullets, visibleExperience } from '@/utils/resumeView';

const props = defineProps<{
  items: Experience[];
  variant?: 'default' | 'compact';
}>();

// 过滤「只有占位、没有任何内容」的记录，并逐字段归一化，模板不再判断空值
const list = computed(() =>
  visibleExperience(props.items).map(exp => ({
    id: exp.id,
    company: asText(exp.company),
    role: asText(exp.role),
    time: asText(exp.time),
    description: asText(exp.description),
    achievement: asText(exp.achievement),
    bullets: visibleBullets(exp.items),
  })),
);
</script>

<template>
  <div v-if="list.length" class="experience-list">
    <div v-for="exp in list" :key="exp.id" class="experience-item">
      <div v-if="exp.company || exp.role || exp.time" class="experience-header">
        <span v-if="exp.company" class="experience-company">{{ exp.company }}</span>
        <span v-if="exp.role" class="experience-role">{{ exp.role }}</span>
        <span v-if="exp.time" class="experience-time">{{ exp.time }}</span>
      </div>
      <p v-if="exp.description" class="experience-desc">{{ exp.description }}</p>
      <ul v-if="exp.bullets.length" class="experience-items-list">
        <li v-for="(line, i) in exp.bullets" :key="i">{{ line }}</li>
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
.experience-header { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-bottom: 6px; font-size: 14px; }
.experience-company { font-weight: 600; overflow-wrap: anywhere; }
.experience-role { color: var(--c-text-muted, #555); overflow-wrap: anywhere; }
.experience-time { color: var(--c-text-muted, #999); margin-left: auto; font-size: 12px; }
.experience-desc { margin: 4px 0; color: var(--c-text-muted, #666); font-size: 13px; overflow-wrap: anywhere; }
.experience-items-list { margin: 6px 0; padding-left: 18px; color: var(--c-text-muted, #555); font-size: 13px; line-height: 1.6; }
.experience-items-list li { overflow-wrap: anywhere; }
.experience-achievement { margin: 6px 0 0; color: var(--c-text, #333); font-size: 13px; background: #f6ffed; padding: 6px 10px; border-radius: 4px; overflow-wrap: anywhere; }
</style>
