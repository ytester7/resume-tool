<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import AutoTextarea from '@/components/AutoTextarea.vue';

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
      <span class="eval-label">{{ LABELS[idx] || `段落 ${idx + 1}` }}</span>
      <AutoTextarea
        class="eval-textarea"
        :model-value="item.text"
        :placeholder="PLACEHOLDERS[idx] || '请输入...'"
        :rows="2"
        :aria-label="LABELS[idx] || `自我评价段落 ${idx + 1}`"
        @update:model-value="update(idx, $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.eval-item { margin-bottom: 10px; }
.eval-label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
textarea.eval-textarea {
  padding: 6px 8px;
  font-size: 13px;
  line-height: 1.5;
}
</style>
