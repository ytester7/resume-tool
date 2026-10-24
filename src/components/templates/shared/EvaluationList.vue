<script setup lang="ts">
import { computed } from 'vue';
import type { EvaluationItem } from '@/types/resume';
import { asText } from '@/utils/resumeView';

const props = defineProps<{
  items: EvaluationItem[];
  variant?: 'paragraphs' | 'bullets';
}>();

const currentVariant = computed(() => props.variant || 'paragraphs');

// 数据源可能只给空条目，过滤后整段不渲染
const nonEmpty = computed(() =>
  (Array.isArray(props.items) ? props.items : [])
    .map(item => asText(item?.text))
    .filter(Boolean),
);
</script>

<template>
  <div v-if="nonEmpty.length" :class="['evaluation-list', `variant-${currentVariant}`]">
    <template v-if="currentVariant === 'paragraphs'">
      <p v-for="(text, i) in nonEmpty" :key="i" class="eval-paragraph">{{ text }}</p>
    </template>
    <template v-else>
      <ul class="eval-bullets">
        <li v-for="(text, i) in nonEmpty" :key="i">{{ text }}</li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.evaluation-list { font-size: 13px; line-height: 1.6; color: var(--c-text-muted, #555); }
.eval-paragraph { margin: 0 0 8px; overflow-wrap: anywhere; }
.eval-paragraph:last-child { margin-bottom: 0; }
.eval-bullets { margin: 0; padding-left: 18px; }
.eval-bullets li { margin-bottom: 4px; overflow-wrap: anywhere; }
</style>
