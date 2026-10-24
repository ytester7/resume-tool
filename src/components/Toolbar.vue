<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';

defineProps<{
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  /** 打印通道：输出可选中文字的矢量 PDF */
  onPrintPdf: () => void;
  /** 兼容通道：html2canvas 光栅化 PDF */
  onExportPdf: () => void;
  /** Word 文档（国内投递常用） */
  onExportDocx: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** 当前是否有打开的简历，用于禁用保存/导出 */
  hasTab: boolean;
  /** 打开 AI 设置弹窗 */
  onOpenSettings: () => void;
  /** AI 已配置时高亮提示 */
  aiReady?: boolean;
  /** 打开投递记录面板（本地台账，无需 AI） */
  onOpenApplications: () => void;
}>();

const exportMenu = ref<HTMLDetailsElement | null>(null);

function closeMenu(): void {
  exportMenu.value?.removeAttribute('open');
}

function pick(action: () => void): void {
  closeMenu();
  action();
}

function onDocClick(e: MouseEvent): void {
  if (!exportMenu.value) return;
  if (!exportMenu.value.contains(e.target as Node)) closeMenu();
}

onMounted(() => document.addEventListener('click', onDocClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocClick));
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-brand">
      <AppIcon name="fileAlt" size="20px" />
      <span>简历制作工具</span>
    </div>

    <div class="toolbar-actions">
      <button class="tool-btn" title="新建 (Ctrl+Shift+N)" @click="onNew">
        <AppIcon name="plus" /><span class="btn-text">新建</span>
      </button>
      <button class="tool-btn" title="打开 / 导入 PDF、Word、JSON (Ctrl+O)" @click="onOpen">
        <AppIcon name="upload" /><span class="btn-text">导入</span>
      </button>
      <button class="tool-btn" title="保存 (Ctrl+S)" :disabled="!hasTab" @click="onSave">
        <AppIcon name="save" /><span class="btn-text">保存</span>
      </button>
      <button class="tool-btn" title="另存为 (Ctrl+Shift+S)" :disabled="!hasTab" @click="onSaveAs">
        <AppIcon name="download" /><span class="btn-text">另存为</span>
      </button>

      <span class="toolbar-divider" />

      <button
        class="tool-btn icon-btn"
        title="撤销 (Ctrl+Z)"
        aria-label="撤销"
        :disabled="!canUndo"
        @click="onUndo"
      >
        <AppIcon name="undo" />
      </button>
      <button
        class="tool-btn icon-btn"
        title="重做 (Ctrl+Shift+Z)"
        aria-label="重做"
        :disabled="!canRedo"
        @click="onRedo"
      >
        <AppIcon name="redo" />
      </button>

      <button
        class="tool-btn icon-btn"
        title="投递记录"
        aria-label="投递记录"
        @click="onOpenApplications"
      >
        <AppIcon name="briefcase" />
      </button>

      <details v-if="hasTab" ref="exportMenu" class="export-menu">
        <summary class="tool-btn primary" title="导出 (Ctrl+P)">
          <AppIcon name="print" /><span class="btn-text">导出 PDF</span><span class="caret">▾</span>
        </summary>
        <div class="export-pop">
          <button class="export-item" @click="pick(onPrintPdf)">
            <strong>打印 / 另存为 PDF</strong>
            <span>推荐：文字可选中，ATS 可解析</span>
          </button>
          <button class="export-item" @click="pick(onExportDocx)">
            <strong>Word 文档（.docx）</strong>
            <span>可编辑，适合国内投递系统</span>
          </button>
          <button class="export-item" @click="pick(onExportPdf)">
            <strong>图片 PDF（兼容模式）</strong>
            <span>保留复杂样式，文字不可选中</span>
          </button>
        </div>
      </details>
      <button v-else class="tool-btn primary" disabled title="请先新建或打开简历">
        <AppIcon name="print" /><span class="btn-text">导出 PDF</span>
      </button>
    </div>

    <div class="toolbar-shortcuts">
      <button
        class="tool-btn icon-btn"
        :class="{ 'ai-active': aiReady }"
        :title="aiReady ? 'AI 设置（已启用）' : 'AI 设置（未配置）'"
        aria-label="AI 设置"
        @click="onOpenSettings"
      >
        <AppIcon name="cogs" />
      </button>
      <kbd>[</kbd>/<kbd>]</kbd> 切换模板
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex; align-items: center; gap: 16px;
  padding: 8px 16px; background: #fff;
  border-bottom: 1px solid #e8e8e8;
  position: relative; z-index: 30;
}
.toolbar-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; color: #1890ff;
  white-space: nowrap;
}
.toolbar-actions { display: flex; gap: 6px; flex: 1; align-items: center; }
.tool-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px; border: 1px solid #d9d9d9;
  background: #fff; cursor: pointer; border-radius: 4px;
  font-size: 13px; color: #333; transition: all 0.2s;
  white-space: nowrap;
}
.tool-btn:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }
.tool-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tool-btn.primary { background: #1890ff; color: #fff; border-color: #1890ff; }
.tool-btn.primary:hover { background: #40a9ff; border-color: #40a9ff; color: #fff; }
.icon-btn { padding: 6px 8px; }
.toolbar-divider { width: 1px; height: 20px; background: #e8e8e8; margin: 0 4px; }

.export-menu { position: relative; }
.export-menu summary { list-style: none; user-select: none; }
.export-menu summary::-webkit-details-marker { display: none; }
.caret { font-size: 10px; margin-left: 2px; }
.export-pop {
  position: absolute; right: 0; top: calc(100% + 6px);
  width: 250px; padding: 6px;
  background: #fff; border: 1px solid #e8e8e8; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex; flex-direction: column; gap: 4px;
}
.export-item {
  display: flex; flex-direction: column; gap: 2px;
  text-align: left; padding: 8px 10px; border: none; border-radius: 6px;
  background: transparent; cursor: pointer; font-size: 12px; color: #333;
}
.export-item:hover { background: #f0f7ff; }
.export-item strong { font-size: 13px; font-weight: 600; }
.export-item span { color: #8c8c8c; font-size: 11px; }

.toolbar-shortcuts { font-size: 11px; color: #999; white-space: nowrap; display: flex; align-items: center; gap: 8px; }
.ai-active { color: #722ed1; border-color: #d3adf7; }
.toolbar-shortcuts kbd {
  display: inline-block; padding: 1px 5px;
  background: #f5f5f5; border: 1px solid #d9d9d9;
  border-radius: 3px; font-size: 11px;
  font-family: 'Consolas', monospace;
}

@media (max-width: 767px) {
  .toolbar {
    flex-wrap: nowrap; gap: 8px;
    padding: 6px 10px;
  }
  .toolbar-brand { font-size: 14px; }
  .toolbar-brand span { display: none; }
  .toolbar-actions {
    flex-wrap: nowrap; overflow-x: auto;
    scrollbar-width: none;
  }
  .toolbar-actions::-webkit-scrollbar { display: none; }
  .tool-btn { padding: 4px 8px; font-size: 12px; flex-shrink: 0; }
  .btn-text { display: none; }
  .toolbar-shortcuts { display: none; }
}
</style>
