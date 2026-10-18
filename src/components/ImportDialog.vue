<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import type { ResumeImportDraft } from '@/types/import';

const props = defineProps<{ draft: ResumeImportDraft }>();
const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const confirmBtn = ref<HTMLButtonElement | null>(null);

const sourceLabel: Record<ResumeImportDraft['source'], string> = {
  json: 'JSON',
  pdf: 'PDF',
  docx: 'Word',
  text: '文本',
};

const counts = computed(() => {
  const d = props.draft.data;
  return [
    { label: '工作经历', value: d.experience.length },
    { label: '项目', value: d.projects.length },
    { label: '技能', value: d.skills.length },
    { label: '教育', value: d.education.length },
    { label: '自定义区块', value: d.customSections.length },
  ];
});

const confidenceClass = computed(() => {
  if (props.draft.confidence >= 80) return 'good';
  if (props.draft.confidence >= 50) return 'ok';
  return 'low';
});

const previewText = computed(() => {
  const text = props.draft.rawText.trim();
  return text.length > 2500 ? text.slice(0, 2500) + '\n…（仅预览前 2500 字）' : text;
});

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel');
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  nextTick(() => confirmBtn.value?.focus());
});
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="import-backdrop" @click.self="emit('cancel')">
    <div class="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <header class="import-head">
        <div>
          <h3 id="import-title">导入简历</h3>
          <p class="import-file">
            <span class="source-badge">{{ sourceLabel[draft.source] }}</span>
            {{ draft.fileName }}
          </p>
        </div>
        <button class="import-close" type="button" aria-label="关闭" @click="emit('cancel')">×</button>
      </header>

      <div class="import-body">
        <section class="overview">
          <div class="overview-main">
            <div class="field">
              <span class="field-label">姓名</span>
              <strong>{{ draft.data.name || '未识别' }}</strong>
            </div>
            <div class="field">
              <span class="field-label">岗位</span>
              <span>{{ draft.data.title || '未识别' }}</span>
            </div>
            <div class="field">
              <span class="field-label">联系方式</span>
              <span>{{ [draft.data.phone, draft.data.email].filter(Boolean).join(' / ') || '未识别' }}</span>
            </div>
          </div>
          <div class="confidence">
            <span class="confidence-num" :class="confidenceClass">{{ draft.confidence }}</span>
            <span class="confidence-label">识别完整度</span>
          </div>
        </section>

        <div class="counts">
          <span v-for="c in counts" :key="c.label" class="count-chip">
            {{ c.label }} <strong>{{ c.value }}</strong>
          </span>
        </div>

        <ul v-if="draft.warnings.length" class="warnings">
          <li v-for="w in draft.warnings" :key="w">{{ w }}</li>
        </ul>

        <details class="raw">
          <summary>查看原文（解析依据）</summary>
          <pre>{{ previewText }}</pre>
        </details>

        <p class="hint">
          导入后进入普通编辑模式，所有字段都可以继续修改；解析结果不会上传到任何服务器。
        </p>
      </div>

      <footer class="import-actions">
        <button class="btn-secondary" type="button" @click="emit('cancel')">取消</button>
        <button ref="confirmBtn" class="btn-primary" type="button" @click="emit('confirm')">
          导入并编辑
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.import-backdrop {
  position: fixed; inset: 0; z-index: 9998;
  background: rgba(16, 35, 59, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.import-dialog {
  width: min(720px, 100%); max-height: 88vh;
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; overflow: hidden;
}
.import-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 12px; border-bottom: 1px solid #f0f0f0;
}
.import-head h3 { margin: 0 0 4px; font-size: 17px; color: #10233b; }
.import-file { margin: 0; font-size: 12px; color: #7b8a9c; display: flex; align-items: center; gap: 6px; }
.source-badge {
  padding: 1px 7px; border-radius: 10px; background: #e6f4ff; color: #1677ff;
  font-size: 11px; font-weight: 600;
}
.import-close {
  border: none; background: transparent; font-size: 22px; line-height: 1;
  color: #999; cursor: pointer; padding: 0 4px;
}
.import-close:hover { color: #333; }

.import-body { padding: 14px 20px; overflow: auto; }
.overview {
  display: flex; justify-content: space-between; gap: 16px;
  padding: 14px; border: 1px solid #eef1f5; border-radius: 10px; background: #fbfcfe;
}
.overview-main { display: grid; gap: 6px; flex: 1; }
.field { display: flex; gap: 8px; font-size: 13px; color: #333; align-items: baseline; }
.field-label { width: 56px; flex-shrink: 0; font-size: 11px; color: #8c9aac; }
.field strong { font-size: 16px; color: #10233b; }
.confidence { text-align: center; flex-shrink: 0; }
.confidence-num { display: block; font-size: 26px; font-weight: 700; line-height: 1.1; }
.confidence-num.good { color: #52c41a; }
.confidence-num.ok { color: #1890ff; }
.confidence-num.low { color: #fa8c16; }
.confidence-label { font-size: 10px; color: #9aa7b6; }

.counts { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
.count-chip {
  font-size: 11px; color: #5b6b7f; background: #f5f7fa;
  padding: 3px 9px; border-radius: 10px;
}
.count-chip strong { color: #10233b; }

.warnings {
  margin: 0 0 12px; padding: 8px 12px 8px 26px;
  background: #fff7e6; border: 1px solid #ffe7ba; border-radius: 8px;
  font-size: 12px; color: #ad6800; line-height: 1.7;
}
.raw { margin-bottom: 10px; }
.raw summary {
  cursor: pointer; font-size: 12px; color: #1890ff; user-select: none;
}
.raw pre {
  margin: 8px 0 0; padding: 10px; max-height: 220px; overflow: auto;
  background: #f7f9fc; border: 1px solid #eef1f5; border-radius: 6px;
  font-size: 11px; line-height: 1.6; color: #4a5b70;
  white-space: pre-wrap; word-break: break-word;
}
.hint { margin: 0; font-size: 11px; color: #9aa7b6; line-height: 1.6; }

.import-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 12px 20px; border-top: 1px solid #f0f0f0; background: #fff;
}
.btn-secondary, .btn-primary {
  padding: 8px 18px; border-radius: 6px; font-size: 13px; cursor: pointer;
  border: 1px solid #d9d9d9; background: #fff; color: #333;
}
.btn-secondary:hover { border-color: #999; }
.btn-primary {
  background: #1890ff; border-color: #1890ff; color: #fff; font-weight: 600;
}
.btn-primary:hover { background: #40a9ff; border-color: #40a9ff; }

@media (max-width: 767px) {
  .import-backdrop { padding: 10px; }
  .import-dialog { max-height: 94vh; }
  .overview { flex-direction: column; }
  .confidence { text-align: left; display: flex; align-items: baseline; gap: 6px; }
}
</style>
