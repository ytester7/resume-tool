<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { TEMPLATE_LIST } from '@/types/resume';
import type { TemplateName } from '@/types/resume';

const tabs = useTabsStore();

const currentTemplate = computed(() => tabs.active?.template ?? 'classic');

function select(name: TemplateName) {
  tabs.setTemplate(name);
}

const categories = [
  { key: 'classic', label: '经典稳重' },
  { key: 'modern', label: '现代简约' },
  { key: 'tech', label: '专业测试' },
  { key: 'creative', label: '创意活力' },
] as const;
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">模板选择</h3>
    <div v-for="cat in categories" :key="cat.key" class="template-category">
      <h4 class="cat-title">{{ cat.label }}</h4>
      <div class="template-grid">
        <button
          v-for="tpl in TEMPLATE_LIST.filter(t => t.category === cat.key)"
          :key="tpl.name"
          :class="['template-card', { active: currentTemplate === tpl.name }]"
          @click="select(tpl.name)"
        >
          <span class="template-name">{{ tpl.displayName }}</span>
          <span v-if="!tpl.sectionOrderMutable" class="template-tag">固定布局</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.editor-section { margin-bottom: 24px; }
.section-heading {
  margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1890ff;
  padding-bottom: 6px; border-bottom: 1px solid #e8e8e8;
}
.template-category { margin-bottom: 14px; }
.cat-title { margin: 0 0 6px; font-size: 12px; color: #666; font-weight: 500; }
.template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 6px; }
.template-card {
  padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 12px;
  display: flex; flex-direction: column; gap: 2px; align-items: flex-start;
  transition: all 0.2s;
}
.template-card:hover { border-color: #1890ff; }
.template-card.active { border-color: #1890ff; background: #e6f7ff; color: #1890ff; }
.template-name { font-weight: 500; }
.template-tag { font-size: 10px; color: #999; }
</style>
