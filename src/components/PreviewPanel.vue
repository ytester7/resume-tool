<script setup lang="ts">
import {
  computed, defineAsyncComponent, nextTick, onErrorCaptured, onMounted, onUnmounted,
  ref, watch, h, type Component,
} from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useSectionOrder } from '@/composables/useSectionOrder';
import { useUiStore } from '@/stores/ui';
import { TEMPLATE_REGISTRY } from '@/types/resume';
import type { TemplateName } from '@/types/resume';
import { toCssVars } from '@/utils/theme';
import { toErrorMessage } from '@/utils/errors';
import { applyHiddenSections } from '@/utils/hiddenSections';
import { pageBreakOffsets, pageCountOf } from '@/utils/page';

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

// 被隐藏的区块在数据层清空，模板的 v-if / sectionHasContent 会自然跳过
const resumeData = computed(() => {
  const data = tabs.active?.data;
  if (!data) return undefined;
  return applyHiddenSections(data, tabs.active?.hiddenSections ?? []);
});
const themeVars = computed(() => toCssVars(tabs.active?.theme));
const effectiveOrder = computed(() => {
  if (!tabs.active) return [];
  if (!mutable.value) return TEMPLATE_REGISTRY[tabs.active.template]?.defaultSectionOrder ?? [];
  return order.value;
});

// —— A4 分页测量 ——
const canvasRef = ref<HTMLElement | null>(null);
const contentHeight = ref(0);
let observer: ResizeObserver | null = null;

function measure(): void {
  // 用元素自身盒高而不是 scrollHeight：分页线是绝对定位子元素，
  // 当内容变短时旧的页码线会溢出画布，把 scrollHeight 撑大导致页数"回不去"
  const rect = canvasRef.value?.getBoundingClientRect();
  contentHeight.value = rect ? Math.ceil(rect.height) : 0;
}

const pageCount = computed(() => pageCountOf(contentHeight.value));
const breaks = computed(() => pageBreakOffsets(contentHeight.value));
const isLong = computed(() => pageCount.value > 2);

watch(canvasRef, (el) => {
  observer?.disconnect();
  if (el && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure());
    observer.observe(el);
  }
  nextTick(measure);
});

watch(
  () => [
    tabs.activeId,
    tabs.active?.data,
    tabs.active?.template,
    tabs.active?.sectionOrder,
    tabs.active?.theme,
    tabs.active?.hiddenSections,
  ],
  async () => {
    await nextTick();
    measure();
  },
  { deep: true },
);

onMounted(() => {
  measure();
  if (canvasRef.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => measure());
    observer.observe(canvasRef.value);
  }
});

onUnmounted(() => observer?.disconnect());

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
    <template v-else>
      <div class="preview-meta">
        <span class="page-badge" :class="{ warn: isLong }">A4 · {{ pageCount }} 页</span>
        <span class="page-hint">
          {{ isLong ? '超过 2 页，建议精简内容' : '导出 PDF 时保持 1–2 页最佳' }}
        </span>
      </div>
      <div class="preview-scroll">
        <div ref="canvasRef" class="preview-canvas" :style="themeVars">
          <component
            :is="currentComponent"
            v-if="resumeData"
            :data="resumeData"
            :section-order="effectiveOrder"
          />
          <div class="page-guides" aria-hidden="true">
            <div
              v-for="(offset, i) in breaks"
              :key="offset"
              class="page-guide"
              :style="{ top: offset + 'px' }"
            >
              <span class="page-guide-label">第 {{ i + 2 }} 页 / 共 {{ pageCount }} 页</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.preview-panel {
  height: 100%; display: flex; flex-direction: column;
  background: #f0f2f5;
}
.preview-empty {
  display: flex; align-items: center; justify-content: center;
  height: 100%; color: #999;
}

.preview-meta {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px; background: #fff;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12px; color: #8c8c8c;
  flex-shrink: 0;
}
.page-badge {
  padding: 2px 9px; border-radius: 10px;
  background: #e6f7ff; color: #1677ff; font-weight: 600;
}
.page-badge.warn { background: #fff2e8; color: #d4380d; }

.preview-scroll {
  flex: 1; overflow: auto; padding: 24px;
}
.preview-canvas {
  width: min(210mm, 100%);
  min-height: 297mm;
  margin: 0 auto;
  background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
}
.preview-loading,
.preview-error {
  display: flex; align-items: center; justify-content: center;
  min-height: 200px; padding: 24px; text-align: center;
  color: #888; font-size: 14px;
}
.preview-error { color: #d4380d; }

.page-guides { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.preview-canvas.exporting .page-guides { display: none; }
/* 页缝：实线页边 + 上下折痕阴影 + 页码胶囊，替代原来那条容易被忽略的红色细虚线。
   正文连续流动，所以只做"纸页折痕"而不遮挡文字。 */
.page-guide {
  position: absolute; left: 0; right: 0; height: 0;
  border-top: 2px solid #64748b;
  z-index: 2;
}
.page-guide::before,
.page-guide::after {
  content: '';
  position: absolute; left: 0; right: 0; height: 10px;
  pointer-events: none;
}
.page-guide::before {
  top: -10px;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.1));
}
.page-guide::after {
  top: 2px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.07));
}
.page-guide-label {
  position: absolute; right: 10px; top: 0; transform: translateY(-50%);
  padding: 2px 10px; border-radius: 999px;
  background: #fff; border: 1px solid #7c8b9d; color: #475569;
  font-size: 11px; font-weight: 600; line-height: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.16);
  white-space: nowrap;
}

/* 窄屏：减小预览内边距 */
@media (max-width: 1023px) {
  .preview-scroll { padding: 16px; }
}
@media (max-width: 767px) {
  .preview-scroll { padding: 10px; }
  .preview-canvas { box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .page-hint { display: none; }
}
</style>
