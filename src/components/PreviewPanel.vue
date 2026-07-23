<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useSectionOrder } from '@/composables/useSectionOrder';
import { TEMPLATE_REGISTRY } from '@/types/resume';
import type { TemplateName } from '@/types/resume';

const tabs = useTabsStore();
const { order, mutable } = useSectionOrder();

// 模板组件映射（defineAsyncComponent 懒加载）
const templateComponents: Record<TemplateName, Component> = {
  classic:           defineAsyncComponent(() => import('@/components/templates/ClassicLayout.vue')),
  minimal:           defineAsyncComponent(() => import('@/components/templates/MinimalLayout.vue')),
  gradient:          defineAsyncComponent(() => import('@/components/templates/GradientLayout.vue')),
  creative:          defineAsyncComponent(() => import('@/components/templates/CreativeLayout.vue')),
  'data-driven':     defineAsyncComponent(() => import('@/components/templates/DataDrivenLayout.vue')),
  'qa-pro':          defineAsyncComponent(() => import('@/components/templates/QaProLayout.vue')),
  'card-style':      defineAsyncComponent(() => import('@/components/templates/CardStyleLayout.vue')),
  'chinese-elegant': defineAsyncComponent(() => import('@/components/templates/ChineseElegantLayout.vue')),
  modern:            defineAsyncComponent(() => import('@/components/templates/ModernLayout.vue')),
  executive:         defineAsyncComponent(() => import('@/components/templates/ExecutiveLayout.vue')),
  european:          defineAsyncComponent(() => import('@/components/templates/EuropeanLayout.vue')),
  tech:              defineAsyncComponent(() => import('@/components/templates/TechLayout.vue')),
  'tech-gradient':   defineAsyncComponent(() => import('@/components/templates/TechGradientLayout.vue')),
};

const currentComponent = computed(() => {
  const tpl = tabs.active?.template || 'classic';
  return templateComponents[tpl] || templateComponents.classic;
});

const resumeData = computed(() => tabs.active?.data);
const effectiveOrder = computed(() => {
  if (!tabs.active) return [];
  if (!mutable.value) return TEMPLATE_REGISTRY[tabs.active.template]?.defaultSectionOrder ?? [];
  return order.value;
});
</script>

<template>
  <div class="preview-panel">
    <div v-if="!tabs.active" class="preview-empty">
      <p>暂无打开的简历</p>
    </div>
    <div v-else class="preview-canvas">
      <component
        :is="currentComponent"
        v-if="resumeData"
        :data="resumeData"
        :section-order="effectiveOrder"
      />
    </div>
  </div>
</template>

<style scoped>
.preview-panel {
  height: 100%; overflow: auto;
  background: #f0f2f5; padding: 24px;
}
.preview-empty {
  display: flex; align-items: center; justify-content: center;
  height: 100%; color: #999;
}
.preview-canvas {
  max-width: 800px; margin: 0 auto;
  background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-height: 100%;
}
</style>
