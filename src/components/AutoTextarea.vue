<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

/**
 * 自适应高度的多行输入框。
 *
 * 编辑栏固定宽度 380px，长句（工作内容、项目成果等）用单行 input 会被截断且无法查看，
 * 这里统一用 textarea 并让高度跟随内容：先归零再取 scrollHeight，保证内容变短时也会缩回。
 */
const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}>(), {
  placeholder: '',
  rows: 1,
  ariaLabel: '',
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const el = ref<HTMLTextAreaElement | null>(null);

function resize(): void {
  const node = el.value;
  if (!node) return;
  // 隐藏状态下 scrollHeight 为 0，跳过以免把高度压成 0
  node.style.height = 'auto';
  const height = node.scrollHeight;
  if (height > 0) node.style.height = `${height}px`;
}

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
  resize();
}

watch(() => props.modelValue, () => {
  void nextTick(resize);
});

onMounted(() => {
  resize();
  window.addEventListener('resize', resize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize);
});

defineExpose({ resize });
</script>

<template>
  <textarea
    ref="el"
    class="auto-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :aria-label="ariaLabel || undefined"
    @input="onInput"
  />
</template>

<style scoped>
.auto-textarea {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: inherit;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  outline: none;
  resize: none;
  overflow: hidden;
  transition: border-color 0.2s;
}
.auto-textarea:focus { border-color: #1890ff; }
</style>
