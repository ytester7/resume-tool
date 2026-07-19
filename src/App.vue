<script setup lang="ts">
import PreviewPanel from '@/components/PreviewPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import { defaultResumeData } from '@/types/resume';

const tabs = useTabsStore();
tabs.open({ title: '测试', data: { ...defaultResumeData(), name: '张三', title: '测试工程师' } });
</script>

<template>
  <div style="display: flex; height: 100vh;">
    <div style="flex: 0 0 300px; padding: 16px;">编辑区（待实现）</div>
    <div style="flex: 1;">
      <PreviewPanel />
    </div>
  </div>
</template>
