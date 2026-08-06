<script setup lang="ts">
import { onMounted } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useFileSystemStore } from '@/stores/fileSystem';
import { useUiStore } from '@/stores/ui';
import { useAutoSave } from '@/composables/useAutoSave';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { useStartupRecovery } from '@/composables/useStartupRecovery';
import { usePdfExport } from '@/composables/usePdfExport';
import { parseResumeFile, serializeResume } from '@/utils/parseResume';
import { sanitizeFilename } from '@/utils/sanitize';
import { toErrorMessage } from '@/utils/errors';
import Toolbar from '@/components/Toolbar.vue';
import TabBar from '@/components/TabBar.vue';
import EditorPanel from '@/components/EditorPanel.vue';
import PreviewPanel from '@/components/PreviewPanel.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Toast from '@/components/Toast.vue';

const tabs = useTabsStore();
const fs = useFileSystemStore();
const ui = useUiStore();
const { recoverOrphanedTabs } = useStartupRecovery();
const { exportActiveToPdf } = usePdfExport();

useAutoSave();

function onNew() {
  tabs.open({ title: '未命名' });
  ui.toastInfo('已新建简历');
}

async function onOpen() {
  try {
    const result = await fs.pickOpenFile();
    if (!result) return;
    const parsed = parseResumeFile(result.data);
    tabs.open({
      title: result.fileName.replace(/\.json$/i, ''),
      data: parsed.data,
      template: parsed.template,
      sectionOrder: parsed.sectionOrder,
      fileHandle: result.handle ?? null,
      dirty: false,
    });
    ui.toastSuccess(`已加载 ${result.fileName}`);
  } catch (e: unknown) {
    ui.toastError('打开失败: ' + toErrorMessage(e));
  }
}

async function onSave() {
  if (!tabs.active) return ui.toastWarning('没有打开的简历');
  const tab = tabs.active;
  let handle = tab.fileHandle;
  if (!handle) {
    const name = sanitizeFilename(tab.data.name || tab.title) + '-简历.json';
    handle = await fs.pickSaveFile(name);
    if (!handle) return;
    tab.fileHandle = handle;
  }
  const content = serializeResume(tab.data, tab.template, tab.sectionOrder, tab.theme);
  const ok = await fs.writeToFile(handle, content);
  if (ok) {
    tab.dirty = false;
    ui.toastSuccess('保存成功');
  } else {
    ui.toastError('保存失败');
  }
}

async function onSaveAs() {
  if (!tabs.active) return ui.toastWarning('没有打开的简历');
  const tab = tabs.active;
  const name = sanitizeFilename(tab.data.name || tab.title) + '-简历.json';
  const handle = await fs.pickSaveFile(name);
  if (!handle) return;
  const content = serializeResume(tab.data, tab.template, tab.sectionOrder, tab.theme);
  const ok = await fs.writeToFile(handle, content);
  if (ok) {
    tab.fileHandle = handle;
    tab.dirty = false;
    ui.toastSuccess('另存为成功');
  } else {
    ui.toastError('另存为失败');
  }
}

async function onExportPdf() {
  if (!tabs.active) return ui.toastWarning('没有打开的简历');
  // 通过 DOM 查询获取 PreviewPanel 内的 .preview-canvas 元素
  const canvas = document.querySelector('.preview-canvas') as HTMLElement | null;
  if (!canvas) return ui.toastError('预览区未就绪');
  await exportActiveToPdf(canvas);
}

useKeyboardShortcuts({ onNew, onOpen, onSave, onSaveAs, onExportPdf });

onMounted(async () => {
  await recoverOrphanedTabs();
  if (tabs.tabs.length === 0) {
    tabs.open({ title: '未命名' });
  }
});
</script>

<template>
  <div class="app-root">
    <Toolbar
      :on-new="onNew"
      :on-open="onOpen"
      :on-save="onSave"
      :on-save-as="onSaveAs"
      :on-export-pdf="onExportPdf"
    />
    <TabBar />
    <main class="app-main">
      <aside class="app-editor" aria-label="简历编辑区">
        <EditorPanel v-if="tabs.active" />
        <div v-else class="empty-editor">
          <p>请点击"新建"创建简历，或"打开"加载已有文件</p>
        </div>
      </aside>
      <section class="app-preview" aria-label="简历预览区">
        <PreviewPanel />
      </section>
    </main>
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<style scoped>
.app-root {
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
}
.app-main {
  display: grid; grid-template-columns: 380px 1fr;
  flex: 1; overflow: hidden;
}
.app-editor {
  border-right: 1px solid #e8e8e8;
  overflow: auto; background: #fff;
}
.app-preview { overflow: hidden; background: #f0f2f5; }
.empty-editor {
  display: flex; align-items: center; justify-content: center;
  height: 100%; color: #999; padding: 40px; text-align: center;
}

/* 平板（768-1023px）：收窄编辑栏，避免 380px 在 768px 屏上挤压预览 */
@media (max-width: 1023px) {
  .app-main { grid-template-columns: 320px 1fr; }
}

/* 手机 / 窄窗（<768px）：垂直堆叠，编辑栏与预览各占一半高度，独立滚动 */
@media (max-width: 767px) {
  .app-main {
    grid-template-columns: 1fr;
    grid-template-rows: 45% 55%;
  }
  .app-editor {
    border-right: none;
    border-bottom: 1px solid #e8e8e8;
  }
}
</style>
