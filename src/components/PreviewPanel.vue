<script setup lang="ts">
import { computed, defineAsyncComponent, onErrorCaptured, h, type Component } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useSectionOrder } from '@/composables/useSectionOrder';
import { useUiStore } from '@/stores/ui';
import { TEMPLATE_REGISTRY } from '@/types/resume';
import type { TemplateName } from '@/types/resume';
import { toCssVars } from '@/utils/theme';
import { toErrorMessage } from '@/utils/errors';

const tabs = useTabsStore();
const ui = useUiStore();
const { order, mutable } = useSectionOrder();

// 模板懒加载统一的 loading / error 兜底
const TemplateLoading = () => h('div', { class: 'preview-loading' }, '模板加载中…');
const TemplateError = () => h('div', { class: 'preview-error' }, '模板加载失败，请刷新或切换模板重试');

function createAsyncTemplate(loader: () => Promise<Component>): Component {
  return defineAsyncComponent({
    loader,
    loadingComponent: TemplateLoading,
    errorComponent: TemplateError,
    delay: 200,
    timeout: 10000,
  });
}

// 模板组件映射（defineAsyncComponent 懒加载，统一加 loading/error 兜底）
const templateComponents: Record<TemplateName, Component> = {
  classic:           createAsyncTemplate(() => import('@/components/templates/ClassicLayout.vue')),
  minimal:           createAsyncTemplate(() => import('@/components/templates/MinimalLayout.vue')),
  gradient:          createAsyncTemplate(() => import('@/components/templates/GradientLayout.vue')),
  creative:          createAsyncTemplate(() => import('@/components/templates/CreativeLayout.vue')),
  'data-driven':     createAsyncTemplate(() => import('@/components/templates/DataDrivenLayout.vue')),
  'qa-pro':          createAsyncTemplate(() => import('@/components/templates/QaProLayout.vue')),
  'card-style':      createAsyncTemplate(() => import('@/components/templates/CardStyleLayout.vue')),
  'chinese-elegant': createAsyncTemplate(() => import('@/components/templates/ChineseElegantLayout.vue')),
  modern:            createAsyncTemplate(() => import('@/components/templates/ModernLayout.vue')),
  executive:         createAsyncTemplate(() => import('@/components/templates/ExecutiveLayout.vue')),
  european:          createAsyncTemplate(() => import('@/components/templates/EuropeanLayout.vue')),
  tech:              createAsyncTemplate(() => import('@/components/templates/TechLayout.vue')),
  'tech-gradient':   createAsyncTemplate(() => import('@/components/templates/TechGradientLayout.vue')),
};

const currentComponent = computed(() => {
  const tpl = tabs.active?.template || 'classic';
  return templateComponents[tpl] || templateComponents.classic;
});

const resumeData = computed(() => tabs.active?.data);
const themeVars = computed(() => toCssVars(tabs.active?.theme));
const effectiveOrder = computed(() => {
  if (!tabs.active) return [];
  if (!mutable.value) return TEMPLATE_REGISTRY[tabs.active.template]?.defaultSectionOrder ?? [];
  return order.value;
});

// 捕获子组件（含异步模板 chunk 加载失败）抛出的错误，避免整屏空白且无提示
onErrorCaptured((err) => {
  ui.toastError('预览渲染失败: ' + toErrorMessage(err));
  return false; // 阻止继续向上抛
});
</script>

<template>
  <div class="preview-panel">
    <div v-if="!tabs.active" class="preview-empty">
      <p>暂无打开的简历</p>
    </div>
    <div v-else class="preview-canvas" :style="themeVars">
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
.preview-loading,
.preview-error {
  display: flex; align-items: center; justify-content: center;
  min-height: 200px; padding: 24px; text-align: center;
  color: #888; font-size: 14px;
}
.preview-error { color: #d4380d; }

/* 平板/窄屏：减小预览容器内边距 */
@media (max-width: 1023px) {
  .preview-panel { padding: 16px; }
}
@media (max-width: 767px) {
  .preview-panel { padding: 10px; }
  .preview-canvas { box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
}
</style>
