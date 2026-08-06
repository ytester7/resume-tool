<script setup lang="ts" generic="T extends { id: string } | string">
import draggable from 'vuedraggable';

withDefaults(defineProps<{
  modelValue: T[];
  handle?: string;
  group?: string;
}>(), {
  handle: '.drag-handle',
  group: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [T[]];
}>();

function itemKey(item: T, index: number): string {
  if (typeof item === 'string') return `idx-${index}`;
  return (item as any).id ?? `idx-${index}`;
}
</script>

<template>
  <draggable
    :model-value="modelValue"
    :item-key="itemKey as any"
    :handle="handle"
    :group="group"
    :animation="200"
    ghost-class="dragging"
    :swap-threshold="0.5"
    @update:model-value="emit('update:modelValue', $event as T[])"
  >
    <template #header><slot name="header" /></template>
    <template #item="{ element, index }">
      <slot name="item" :element="element" :index="index" />
    </template>
    <template #footer><slot name="footer" /></template>
  </draggable>
</template>
