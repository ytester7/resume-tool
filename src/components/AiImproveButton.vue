<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { improveLine } from '@/utils/ai/improve';
import type { ImproveContext, ImproveMode, ImproveResult } from '@/utils/ai/improve';
import { toErrorMessage } from '@/utils/errors';
import AppIcon from './AppIcon.vue';

/**
 * 单条经历要点的 AI 润色按钮（仅 AI 已配置时渲染）。
 * 应用走父组件的 update 回调；这里负责弹出选项、展示结果、
 * 校验「请求期间原文没被改过」后才允许替换。
 */
const props = defineProps<{
  /** 当前行的原文（应用前与请求时快照比对） */
  line: string;
  context: ImproveContext;
}>();

const emit = defineEmits<{ (e: 'apply', newText: string): void }>();

const settings = useSettingsStore();
const ui = useUiStore();

const open = ref(false);
const loading = ref(false);
const customInstruction = ref('');
const result = ref<ImproveResult | null>(null);
/** 发起请求那一刻的原文快照，用于应用前校验 */
let lineSnapshot = '';

const presets: { mode: ImproveMode; label: string }[] = [
  { mode: 'strong-verb', label: '强化动词' },
  { mode: 'add-result', label: '突出成果' },
  { mode: 'shorten', label: '精简压缩' },
];

const canRun = computed(() => props.line.trim().length > 0 && !loading.value);

async function run(mode: ImproveMode) {
  const config = settings.requireAiConfig();
  if (!config) return;
  if (mode === 'custom' && !customInstruction.value.trim()) {
    ui.toastWarning('请先填写自定义改写要求');
    return;
  }
  loading.value = true;
  result.value = null;
  lineSnapshot = props.line;
  try {
    result.value = await improveLine(config, props.line, mode, {
      ...props.context,
      instruction: mode === 'custom' ? customInstruction.value : undefined,
    });
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  } finally {
    loading.value = false;
  }
}

function apply() {
  if (!result.value) return;
  // 请求期间原文被编辑过 → 拒绝应用，避免覆盖用户的修改
  if (props.line !== lineSnapshot) {
    ui.toastWarning('原文已变化，请基于最新内容重新润色');
    result.value = null;
    return;
  }
  emit('apply', result.value.text);
  close();
}

function toggle(): void {
  open.value = !open.value;
  if (!open.value) {
    result.value = null;
    customInstruction.value = '';
  }
}

function close(): void {
  open.value = false;
  result.value = null;
  customInstruction.value = '';
}

function onDocClick(e: MouseEvent): void {
  if (!open.value) return;
  const target = e.target as Element | null;
  if (!target?.closest?.('.ai-improve')) close();
}

onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
</script>

<template>
  <span v-if="settings.aiReady" class="ai-improve">
    <button
      class="improve-btn"
      type="button"
      :class="{ active: open }"
      title="AI 润色这一条"
      aria-label="AI 润色"
      @click.stop="toggle"
    >
      <AppIcon name="sparkles" />
    </button>

    <div v-if="open" class="improve-pop" @click.stop>
      <div v-if="!result" class="improve-options">
        <button
          v-for="p in presets"
          :key="p.mode"
          class="option-btn"
          type="button"
          :disabled="!canRun"
          @click="run(p.mode)"
        >{{ p.label }}</button>
      </div>
      <div v-if="!result" class="custom-row">
        <input
          v-model="customInstruction"
          class="custom-input"
          type="text"
          placeholder="自定义要求，如「更贴合测试岗」"
          @keydown.enter="run('custom')"
        />
        <button class="option-btn" type="button" :disabled="!canRun" @click="run('custom')">执行</button>
      </div>
      <p v-if="loading" class="improve-status"><AppIcon name="spinner" class="spin" /> AI 改写中…</p>

      <div v-if="result" class="improve-result">
        <p class="result-text">{{ result.text }}</p>
        <p class="result-why">{{ result.why }}</p>
        <p v-if="result.addsFacts" class="result-warning">
          ⚠ 改写引入了原文没有的内容，请核对事实后再替换
        </p>
        <div class="result-actions">
          <button class="result-btn primary" type="button" @click="apply">替换原文</button>
          <button class="result-btn" type="button" @click="close">保留原文</button>
        </div>
      </div>
    </div>
  </span>
</template>

<style scoped>
.ai-improve { position: relative; display: inline-flex; }
.improve-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; padding: 0;
  border: 1px solid #e8e8e8; border-radius: 4px;
  background: #fff; color: #b37feb; cursor: pointer; font-size: 12px;
}
.improve-btn:hover, .improve-btn.active {
  border-color: #722ed1; color: #722ed1; background: #f9f0ff;
}

.improve-pop {
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 40;
  width: 264px; padding: 8px;
  background: #fff; border: 1px solid #e8e8e8; border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  display: flex; flex-direction: column; gap: 6px;
}
.improve-options { display: flex; gap: 4px; }
.option-btn {
  flex: 1; padding: 5px 4px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #555; font-size: 11px; cursor: pointer; white-space: nowrap;
}
.option-btn:hover:not(:disabled) { border-color: #722ed1; color: #722ed1; }
.option-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.custom-row { display: flex; gap: 4px; }
.custom-input {
  flex: 1; min-width: 0; padding: 4px 6px;
  border: 1px solid #d9d9d9; border-radius: 4px; font-size: 11px; outline: none;
}
.custom-input:focus { border-color: #722ed1; }

.improve-status {
  margin: 0; display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #999;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.improve-result { display: flex; flex-direction: column; gap: 6px; }
.result-text {
  margin: 0; padding: 6px 8px;
  background: #f9f0ff; border-radius: 4px;
  font-size: 12px; line-height: 1.6; color: #333;
}
.result-why { margin: 0; font-size: 11px; color: #8c8c8c; line-height: 1.5; }
.result-warning { margin: 0; font-size: 11px; color: #d46b08; }
.result-actions { display: flex; gap: 6px; }
.result-btn {
  flex: 1; padding: 5px 0; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #555; font-size: 11px; cursor: pointer;
}
.result-btn.primary { background: #722ed1; border-color: #722ed1; color: #fff; }
.result-btn.primary:hover { background: #9254de; }
</style>
