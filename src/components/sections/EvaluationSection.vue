<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';

const tabs = useTabsStore();

const LABELS = ['身份定位', '核心优势', '职业目标'];
const PLACEHOLDERS = [
  '如：5年经验软件测试工程师，专注自动化与性能测试',
  '如：精通 Selenium/Playwright，主导过 CI 流水线搭建，缺陷逃逸率降低 40%',
  '如：3年内成长为测试专家，主导测试体系建设',
];

function update(idx: number, value: string) {
  if (!tabs.active) return;
  tabs.active.data.evaluation[idx].text = value;
  tabs.active.dirty = true;
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">自我评价</h3>
    <div v-for="(item, idx) in (tabs.active?.data.evaluation ?? [])" :key="idx" class="eval-item">
      <label class="eval-label">{{ LABELS[idx] || `段落 ${idx + 1}` }}</label>
      <textarea
        :value="item.text"
        @input="update(idx, ($event.target as HTMLTextAreaElement).value)"
        :placeholder="PLACEHOLDERS[idx] || '请输入...'"
        rows="2"
        class="eval-textarea"
      />
    </div>
  </section>
</template>

<style scoped>
.editor-section { margin-bottom: 24px; }
.section-heading {
  margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1890ff;
  padding-bottom: 6px; border-bottom: 1px solid #e8e8e8;
}
.eval-item { margin-bottom: 10px; }
.eval-label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
.eval-textarea {
  width: 100%; padding: 6px 8px;
  border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 13px; line-height: 1.5; resize: vertical; outline: none;
  font-family: inherit;
}
.eval-textarea:focus { border-color: #1890ff; }
</style>
