<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';

const tabs = useTabsStore();
const summary = computed(() => tabs.active?.data.summary ?? '');

function update(value: string) {
  tabs.patchActive({ summary: value });
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">专业概述</h3>
    <textarea
      :value="summary"
      placeholder="用一段话概括你的技术栈、年限、量化成果和价值。例如：5年软件测试经验，精通 Selenium/Playwright 自动化，搭建过 CI 流水线，缺陷逃逸率降低 40%。"
      rows="4"
      class="summary-textarea"
      aria-label="专业概述"
      @input="update(($event.target as HTMLTextAreaElement).value)"
    />
  </section>
</template>

<style scoped>
.summary-textarea {
  width: 100%; padding: 8px 10px;
  border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 13px; line-height: 1.6; resize: vertical; outline: none;
  font-family: inherit;
}
.summary-textarea:focus { border-color: #1890ff; }
</style>
