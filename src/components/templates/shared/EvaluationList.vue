<script setup lang="ts">
import { computed } from 'vue';
import type { EvaluationItem } from '@/types/resume';

const props = defineProps<{
  items: EvaluationItem[];
  variant?: 'paragraphs' | 'bullets';
}>();

const nonEmpty = computed(() => props.items.filter(i => i.text.trim()));
</script>

<template>
  <div v-if="nonEmpty.length" :class="['evaluation-list', `variant-${props.variant || 'paragraphs'}`]">
    <template v-if="(props.variant || 'paragraphs') === 'paragraphs'">
      <p v-for="(item, i) in nonEmpty" :key="i" class="eval-paragraph">{{ item.text }}</p>
    </template>
    <template v-else>
      <ul class="eval-bullets">
        <li v-for="(item, i) in nonEmpty" :key="i">{{ item.text }}</li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.evaluation-list { font-size: 13px; line-height: 1.6; color: var(--c-text-muted, #555); }
.eval-paragraph { margin: 0 0 8px; }
.eval-paragraph:last-child { margin-bottom: 0; }
.eval-bullets { margin: 0; padding-left: 18px; }
.eval-bullets li { margin-bottom: 4px; }
</style>
