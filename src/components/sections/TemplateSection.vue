<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { TEMPLATE_LIST } from '@/types/resume';
import type { TemplateName } from '@/types/resume';
import { COLOR_PRESETS, FONT_PRESETS } from '@/utils/theme';
import { templateThumb } from '@/data/templateThumbs';

const tabs = useTabsStore();

const currentTemplate = computed(() => tabs.active?.template ?? 'classic');
const primaryColor = computed(() => tabs.active?.theme?.primaryColor ?? '');
const fontFamily = computed(() => tabs.active?.theme?.fontFamily ?? '');

function select(name: TemplateName) {
  tabs.setTemplate(name);
}

function selectColor(color: string) {
  tabs.setTheme({ primaryColor: color, fontFamily: fontFamily.value });
}

function onColorInput(e: Event) {
  selectColor((e.target as HTMLInputElement).value);
}

function selectFont(value: string) {
  tabs.setTheme({ primaryColor: primaryColor.value, fontFamily: value });
}

function resetTheme() {
  tabs.setTheme(null);
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
          :aria-pressed="currentTemplate === tpl.name"
          @click="select(tpl.name)"
        >
          <span class="thumb">
            <img
              v-if="templateThumb(tpl.name)"
              :src="templateThumb(tpl.name)"
              :alt="`${tpl.displayName}模板预览`"
              loading="lazy"
            />
            <span v-else class="thumb-fallback">{{ tpl.displayName.charAt(0) }}</span>
          </span>
          <span class="template-meta">
            <span class="template-name">{{ tpl.displayName }}</span>
            <span class="template-tag">{{ tpl.sectionOrderMutable ? '可调顺序' : '固定布局' }}</span>
          </span>
        </button>
      </div>
    </div>
  </section>

  <section class="editor-section">
    <h3 class="section-heading">主题设置</h3>
    <div class="theme-row">
      <span class="theme-label">主色</span>
      <div class="color-swatches">
        <button
          v-for="c in COLOR_PRESETS"
          :key="c"
          class="swatch"
          :style="{ background: c }"
          :class="{ active: primaryColor === c }"
          :aria-label="`选择主色 ${c}`"
          @click="selectColor(c)"
        />
        <input
          type="color"
          class="color-picker"
          :value="primaryColor || '#1890ff'"
          aria-label="自定义主色"
          @input="onColorInput"
        />
      </div>
    </div>
    <div class="theme-row">
      <label class="theme-label" for="font-select">字体</label>
      <select id="font-select" class="font-select" :value="fontFamily" @change="selectFont(($event.target as HTMLSelectElement).value)">
        <option v-for="f in FONT_PRESETS" :key="f.label" :value="f.value">{{ f.label }}</option>
      </select>
    </div>
    <button class="reset-theme" @click="resetTheme">恢复默认主题</button>
  </section>
</template>

<style scoped>
.template-category { margin-bottom: 14px; }
.cat-title { margin: 0 0 6px; font-size: 12px; color: #666; font-weight: 500; }
.template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.template-card {
  padding: 6px; border: 1px solid #e0e0e0; border-radius: 6px;
  background: #fff; cursor: pointer; font-size: 12px;
  display: flex; flex-direction: column; gap: 6px; align-items: stretch;
  transition: all 0.2s;
}
.template-card:hover { border-color: #1890ff; box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15); }
.template-card.active { border-color: #1890ff; background: #f0f8ff; }
.thumb {
  display: block; width: 100%; aspect-ratio: 4 / 5; overflow: hidden;
  border-radius: 3px; background: #f5f5f5;
  border: 1px solid #f0f0f0;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
.thumb-fallback {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; color: #bbb; font-size: 20px;
}
.template-meta { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.template-name { font-weight: 500; color: #333; font-size: 12px; }
.template-tag { font-size: 9px; color: #999; white-space: nowrap; }
.template-card.active .template-name { color: #1890ff; }

.theme-row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.theme-label { font-size: 12px; color: #666; width: 36px; flex-shrink: 0; }
.color-swatches { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.swatch {
  width: 22px; height: 22px; border-radius: 4px;
  border: 2px solid #fff; box-shadow: 0 0 0 1px #d9d9d9;
  cursor: pointer; padding: 0;
}
.swatch.active { box-shadow: 0 0 0 2px #1890ff; }
.color-picker {
  width: 30px; height: 24px; padding: 0; border: 1px solid #d9d9d9;
  border-radius: 4px; cursor: pointer; background: #fff;
}
.font-select {
  padding: 4px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; color: #333; background: #fff; outline: none;
}
.font-select:focus { border-color: #1890ff; }
.reset-theme {
  padding: 4px 10px; border: 1px solid #d9d9d9; background: #fff;
  border-radius: 4px; font-size: 12px; color: #666; cursor: pointer;
}
.reset-theme:hover { border-color: #ff4d4f; color: #ff4d4f; }

/* 窄屏：模板卡片略小 */
@media (max-width: 767px) {
  .template-grid { gap: 6px; }
  .template-tag { display: none; }
}
</style>
