<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { AiProviderId } from '@/types/settings';
import { useSettingsStore } from '@/stores/settings';
import { useUiStore } from '@/stores/ui';
import { PROVIDER_CATALOG, PROVIDER_ORDER, isConfigComplete } from '@/utils/ai/providers';
import { toErrorMessage } from '@/utils/errors';
import AppIcon from './AppIcon.vue';

const emit = defineEmits<{ (e: 'close'): void }>();

const settings = useSettingsStore();
const ui = useUiStore();

/** 测试状态：任何字段编辑后回到 untested（沿用“测试通过才可保存”的纪律） */
type TestState = 'untested' | 'testing' | 'success' | 'failure';

const form = reactive({
  provider: 'deepseek' as AiProviderId,
  baseURL: PROVIDER_CATALOG.deepseek.defaultBaseURL,
  apiKey: '',
  model: PROVIDER_CATALOG.deepseek.models[0] ?? '',
});
const testState = ref<TestState>('untested');
const testMessage = ref('');

const meta = computed(() => PROVIDER_CATALOG[form.provider]);
const formComplete = computed(() =>
  isConfigComplete({ provider: form.provider, baseURL: form.baseURL, apiKey: form.apiKey, model: form.model }),
);
const canSave = computed(() => formComplete.value && testState.value === 'success');
const savedKeyHint = computed(() => settings.keyPreview ? `已保存：${settings.keyPreview}，留空则继续使用` : '');

// 打开时用已保存配置回填（Key 留空，沿用已保存的）
if (settings.ai) {
  form.provider = settings.ai.provider;
  form.baseURL = settings.ai.baseURL;
  form.model = settings.ai.model;
}

watch(
  () => [form.provider, form.baseURL, form.apiKey, form.model],
  () => {
    if (testState.value !== 'testing') testState.value = 'untested';
    testMessage.value = '';
  },
);

function onProviderChange(): void {
  form.baseURL = PROVIDER_CATALOG[form.provider].defaultBaseURL;
  form.model = PROVIDER_CATALOG[form.provider].models[0] ?? '';
  form.apiKey = '';
}

async function runTest(): Promise<void> {
  const config = {
    provider: form.provider,
    baseURL: form.baseURL.trim(),
    apiKey: form.apiKey.trim(),
    model: form.model.trim(),
  };
  if (!isConfigComplete(config)) {
    ui.toastWarning('请先补全 API 地址、模型' + (form.provider === 'ollama' ? '' : '和 API Key'));
    return;
  }
  testState.value = 'testing';
  testMessage.value = '';
  try {
    // 测试时若 Key 留空且已有保存配置（仅换模型等场景），用保存的 Key 补齐
    if (!config.apiKey && settings.ai?.apiKey) config.apiKey = settings.ai.apiKey;
    await settings.testConnection(config);
    testState.value = 'success';
    testMessage.value = '连接成功，模型可用';
  } catch (e) {
    testState.value = 'failure';
    testMessage.value = toErrorMessage(e);
  }
}

function save(): void {
  const apiKey = form.apiKey.trim() || settings.ai?.apiKey || '';
  settings.saveAiConfig({
    provider: form.provider,
    baseURL: form.baseURL.trim(),
    apiKey,
    model: form.model.trim(),
  });
  ui.toastSuccess('AI 配置已保存（仅存本地浏览器）');
  emit('close');
}

async function clearConfig(): Promise<void> {
  const action = await ui.confirmDialog({
    title: '清除 AI 配置',
    message: '将删除本地保存的 API Key 与模型配置，AI 功能随之关闭（不影响简历数据）。',
    actions: ['清除', '取消'],
  });
  if (action !== '清除') return;
  settings.clearAiConfig();
  ui.toastInfo('AI 配置已清除');
  emit('close');
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="settings-backdrop" @click.self="emit('close')">
    <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header class="settings-head">
        <div>
          <h3 id="settings-title">AI 设置</h3>
          <p class="settings-sub">自带 Key（BYOK）：配置只保存在本浏览器，简历数据不因此上云</p>
        </div>
        <button class="settings-close" type="button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div class="settings-body">
        <label class="form-row">
          <span class="form-label">服务商</span>
          <select v-model="form.provider" class="form-input" @change="onProviderChange">
            <option v-for="id in PROVIDER_ORDER" :key="id" :value="id">{{ PROVIDER_CATALOG[id].name }}</option>
          </select>
        </label>

        <label class="form-row">
          <span class="form-label">API 地址</span>
          <input
            v-model="form.baseURL"
            class="form-input"
            type="text"
            placeholder="https://api.example.com/v1"
            autocomplete="off"
            spellcheck="false"
          />
        </label>

        <label class="form-row" :class="{ optional: form.provider === 'ollama' }">
          <span class="form-label">API Key</span>
          <input
            v-model="form.apiKey"
            class="form-input"
            type="password"
            :placeholder="savedKeyHint || (form.provider === 'ollama' ? '本地模型无需 Key' : 'sk-...')"
            autocomplete="off"
          />
        </label>
        <p v-if="savedKeyHint" class="field-hint">{{ savedKeyHint }}</p>
        <p v-if="meta.keyUrl && !form.apiKey" class="field-hint">
          还没有 Key？前往
          <a :href="meta.keyUrl" target="_blank" rel="noreferrer noopener">服务商控制台</a>
          创建，账单产生在服务商侧，与本工具无关
        </p>

        <label class="form-row">
          <span class="form-label">模型</span>
          <input v-model="form.model" class="form-input" type="text" list="model-suggestions" placeholder="模型名" autocomplete="off" spellcheck="false" />
          <datalist id="model-suggestions">
            <option v-for="m in meta.models" :key="m" :value="m" />
          </datalist>
        </label>

        <p v-if="meta.hint" class="field-hint">{{ meta.hint }}</p>

        <div class="test-row">
          <button
            class="test-btn"
            type="button"
            :disabled="!formComplete || testState === 'testing'"
            @click="runTest"
          >
            <AppIcon v-if="testState === 'testing'" name="spinner" class="spin" />
            {{ testState === 'testing' ? '测试中…' : '测试连接' }}
          </button>
          <span v-if="testMessage" class="test-message" :class="{ ok: testState === 'success', bad: testState === 'failure' }">
            {{ testMessage }}
          </span>
          <span v-else-if="testState === 'untested'" class="test-message">保存前需通过一次连接测试</span>
        </div>

        <p class="privacy-note">
          未配置 AI 时，本工具保持零网络请求；配置后，仅在点击带 AI 标识的按钮时才会把对应文本发送到你选择的服务商。
        </p>
      </div>

      <footer class="settings-actions">
        <button v-if="settings.ai" class="btn-danger" type="button" @click="clearConfig">清除配置</button>
        <span class="spacer" />
        <button class="btn-secondary" type="button" @click="emit('close')">取消</button>
        <button class="btn-primary" type="button" :disabled="!canSave" :title="canSave ? '' : '请先通过连接测试'" @click="save">保存</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.settings-backdrop {
  position: fixed; inset: 0; z-index: 9997;
  background: rgba(16, 35, 59, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.settings-dialog {
  width: min(520px, 100%); max-height: 88vh;
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; overflow: hidden;
}
.settings-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 12px; border-bottom: 1px solid #f0f0f0;
}
.settings-head h3 { margin: 0 0 4px; font-size: 17px; color: #10233b; }
.settings-sub { margin: 0; font-size: 12px; color: #7b8a9c; }
.settings-close {
  border: none; background: transparent; font-size: 22px; line-height: 1;
  color: #999; cursor: pointer; padding: 0 4px;
}
.settings-close:hover { color: #333; }

.settings-body { padding: 14px 20px; overflow: auto; }
.form-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.form-row.optional .form-label::after { content: '（可选）'; font-size: 10px; color: #bbb; }
.form-label { width: 64px; flex-shrink: 0; font-size: 12px; color: #5b6b7f; }
.form-input {
  flex: 1; padding: 7px 10px; border: 1px solid #d9d9d9; border-radius: 6px;
  font-size: 13px; font-family: inherit; outline: none; min-width: 0;
}
.form-input:focus { border-color: #1890ff; }
.field-hint { margin: -4px 0 10px 74px; font-size: 11px; color: #9aa7b6; line-height: 1.6; }
.field-hint a { color: #1890ff; }

.test-row { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
.test-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border: 1px solid #1890ff; border-radius: 6px;
  background: #fff; color: #1890ff; font-size: 13px; cursor: pointer;
}
.test-btn:hover:not(:disabled) { background: #e6f4ff; }
.test-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.test-message { font-size: 12px; color: #9aa7b6; line-height: 1.5; }
.test-message.ok { color: #52c41a; }
.test-message.bad { color: #fa541c; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.privacy-note {
  margin: 4px 0 0; padding: 10px 12px;
  background: #f6ffed; border: 1px solid #d9f7be; border-radius: 8px;
  font-size: 11px; color: #389e0d; line-height: 1.7;
}

.settings-actions {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px; border-top: 1px solid #f0f0f0; background: #fff;
}
.spacer { flex: 1; }
.btn-secondary, .btn-primary, .btn-danger {
  padding: 8px 18px; border-radius: 6px; font-size: 13px; cursor: pointer;
  border: 1px solid #d9d9d9; background: #fff; color: #333;
}
.btn-secondary:hover { border-color: #999; }
.btn-primary {
  background: #1890ff; border-color: #1890ff; color: #fff; font-weight: 600;
}
.btn-primary:hover:not(:disabled) { background: #40a9ff; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-danger { color: #fa541c; border-color: #ffccc7; }
.btn-danger:hover { background: #fff2f0; }

@media (max-width: 767px) {
  .settings-backdrop { padding: 10px; }
  .form-row { flex-direction: column; align-items: stretch; gap: 4px; }
  .form-label { width: auto; }
  .field-hint { margin-left: 0; }
}
</style>
