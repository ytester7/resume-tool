<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import AutoTextarea from '@/components/AutoTextarea.vue';

const tabs = useTabsStore();
const summary = computed(() => tabs.active?.data.summary ?? '');

function update(value: string) {
  tabs.patchActive({ summary: value });
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">专业概述</h3>
    <AutoTextarea
      class="summary-textarea"
      :model-value="summary"
      placeholder="用一段话概括你的技术栈、年限、量化成果和价值。例如：5年软件测试经验，精通 Selenium/Playwright 自动化，搭建过 CI 流水线，缺陷逃逸率降低 40%。"
      :rows="4"
      aria-label="专业概述"
      @update:model-value="update"
    />
  </section>
</template>

<style scoped>
textarea.summary-textarea {
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
}
</style>
