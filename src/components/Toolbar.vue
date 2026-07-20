<script setup lang="ts">
import AppIcon from './AppIcon.vue';

defineProps<{
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportPdf: () => void;
}>();
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-brand">
      <AppIcon name="fileAlt" size="20px" />
      <span>简历制作工具</span>
    </div>
    <div class="toolbar-actions">
      <button class="tool-btn" @click="onNew" title="新建 (Ctrl+Shift+N)">
        <AppIcon name="plus" /> 新建
      </button>
      <button class="tool-btn" @click="onOpen" title="打开 (Ctrl+O)">
        <AppIcon name="upload" /> 打开
      </button>
      <button class="tool-btn" @click="onSave" title="保存 (Ctrl+S)">
        <AppIcon name="save" /> 保存
      </button>
      <button class="tool-btn" @click="onSaveAs" title="另存为 (Ctrl+Shift+S)">
        <AppIcon name="download" /> 另存为
      </button>
      <button class="tool-btn primary" @click="onExportPdf" title="导出PDF (Ctrl+P)">
        <AppIcon name="fileAlt" /> 导出PDF
      </button>
    </div>
    <div class="toolbar-shortcuts">
      <kbd>[</kbd>/<kbd>]</kbd> 切换模板
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex; align-items: center; gap: 16px;
  padding: 8px 16px; background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
.toolbar-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; color: #1890ff;
}
.toolbar-actions { display: flex; gap: 6px; flex: 1; }
.tool-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px; border: 1px solid #d9d9d9;
  background: #fff; cursor: pointer; border-radius: 4px;
  font-size: 13px; color: #333; transition: all 0.2s;
}
.tool-btn:hover { border-color: #1890ff; color: #1890ff; }
.tool-btn.primary { background: #1890ff; color: #fff; border-color: #1890ff; }
.tool-btn.primary:hover { background: #40a9ff; }
.toolbar-shortcuts { font-size: 11px; color: #999; }
.toolbar-shortcuts kbd {
  display: inline-block; padding: 1px 5px;
  background: #f5f5f5; border: 1px solid #d9d9d9;
  border-radius: 3px; font-size: 11px;
  font-family: 'Consolas', monospace;
}
</style>
