<script setup lang="ts">
import { computed } from 'vue';
import { getIcon } from '@/utils/icons';

const props = defineProps<{
  name: string;
  size?: string;
}>();

const svg = computed(() => getIcon(props.name));
const style = computed(() => props.size ? { fontSize: props.size } : {});
</script>

<template>
  <!-- aria-hidden 让屏幕阅读器跳过装饰性图标；图标含义由父级按钮的 aria-label 提供 -->
  <span class="app-icon" aria-hidden="true" :style="style" v-html="svg" />
</template>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.app-icon :deep(svg) {
  width: 1em;
  height: 1em;
}
</style>
