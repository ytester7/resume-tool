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
  <span class="app-icon" v-html="svg" :style="style" />
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
