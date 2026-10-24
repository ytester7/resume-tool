<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useFileSystemStore } from '@/stores/fileSystem';
import { useUiStore } from '@/stores/ui';
import { useSettingsStore } from '@/stores/settings';
import { useAutoSave } from '@/composables/useAutoSave';
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts';
import { useStartupRecovery } from '@/composables/useStartupRecovery';
import { usePdfExport } from '@/composables/usePdfExport';
import { usePrintExport } from '@/composables/usePrintExport';
import { useDocxExport } from '@/composables/useDocxExport';
import { useUndoHistory } from '@/composables/useUndoHistory';
import { serializeResume } from '@/utils/parseResume';
import { importResumeFile } from '@/utils/importFile';
import { aiParseResumeText } from '@/utils/ai/importParse';
import { sanitizeFilename } from '@/utils/sanitize';
import { toErrorMessage } from '@/utils/errors';
import type { SampleResume } from '@/data/samples';
import type { ResumeImportDraft } from '@/types/import';
import Toolbar from '@/components/Toolbar.vue';
import TabBar from '@/components/TabBar.vue';
import WelcomePanel from '@/components/WelcomePanel.vue';
import EditorPanel from '@/components/EditorPanel.vue';
import PreviewPanel from '@/components/PreviewPanel.vue';
import ImportDialog from '@/components/ImportDialog.vue';
import SettingsDialog from '@/components/SettingsDialog.vue';
import AssistantPanel from '@/components/AssistantPanel.vue';
import ApplicationsPanel from '@/components/ApplicationsPanel.vue';
import OptimizerPanel from '@/components/OptimizerPanel.vue';
import { provideOpenOptimizer } from '@/components/OptimizerPanel.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Toast from '@/components/Toast.vue';

const tabs = useTabsStore();
const fs = useFileSystemStore();
const ui = useUiStore();
const settings = useSettingsStore();
const { recoverOrphanedTabs } = useStartupRecovery();
const { exportActiveToPdf } = usePdfExport();
const { printResume } = usePrintExport();
const { exportDocx } = useDocxExport();
const { undo, redo, canUndo, canRedo } = useUndoHistory();

const mobileView = ref<'edit' | 'preview'>('edit');
const hasTabs = computed(() => tabs.tabs.length > 0);
const importDraft = ref<ResumeImportDraft | null>(null);
const importing = ref(false);
const settingsOpen = ref(false);
const applicationsOpen = ref(false);
const optimizerOpen = ref(false);
const optimizerJd = ref('');
const optimizerLabel = ref('');

/** 深层入口（JD 匹配区等）经 provide/inject 打开简历优化工程师 */
provideOpenOptimizer((jd: string, label: string) => {
  optimizerJd.value = jd;
  optimizerLabel.value = label;
  optimizerOpen.value = true;
});

/** 投递台账入口（直接子组件，走事件；同时收起台账避免遮挡） */
function onOptimizeApplication(jd: string, label: string) {
  optimizerJd.value = jd;
  optimizerLabel.value = label;
  optimizerOpen.value = true;
  applicationsOpen.value = false;
}
const aiReparsing = ref(false);

/** 导入确认弹窗内点击「AI 智能解析」：用 AI 重解析原文并替换当前草稿 */
async function onAiReparse() {
  const draft = importDraft.value;
  const config = settings.requireAiConfig();
  if (!draft || !config || aiReparsing.value) return;
  aiReparsing.value = true;
  try {
    importDraft.value = await aiParseResumeText(config, draft);
    ui.toastSuccess('AI 解析完成，请核对识别结果');
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  } finally {
    aiReparsing.value = false;
  }
}

useAutoSave();

function onNew() {
  tabs.open({});
  mobileView.value = 'edit';
  ui.toastInfo('已新建简历');
}

function onSample(sample: SampleResume) {
  tabs.open({ title: sample.data.name, data: sample.data });
  mobileView.value = 'edit';
  ui.toastSuccess(`已载入「${sample.label}」示例，把内容换成你的即可`);
}

function openDraft(draft: ResumeImportDraft, handle: FileSystemFileHandle | null) {
  const fallbackTitle = draft.fileName.replace(/\.[^.]+$/, '');
  const title = draft.data.name || fallbackTitle;

  if (draft.structured) {
    const existing = tabs.tabs.find(t => t.title === title);
    if (existing) {
      tabs.switchTo(existing.id);
      ui.toastInfo('该文件已打开，已切换到对应标签页');
      return;
    }
  }

  tabs.open({
    title,
    data: draft.data,
    template: draft.template,
    sectionOrder: draft.sectionOrder,
    theme: draft.theme,
    targetJd: draft.targetJd,
    hiddenSections: draft.hiddenSections,
    fileHandle: handle,
    // 文本导入是解析草稿，需要用户确认后保存；JSON 本身来自文件
    dirty: !draft.structured,
  });
  mobileView.value = 'edit';
  ui.toastSuccess(
    draft.structured
      ? `已加载 ${draft.fileName}`
      : `已导入 ${draft.fileName}，请先检查解析结果`,
  );
}

async function handleImportFile(file: File, handle: FileSystemFileHandle | null) {
  if (importing.value) return;
  importing.value = true;
  try {
    ui.toast(`正在解析 ${file.name}…`, 'info', 2500);
    const draft = await importResumeFile(file);
    if (draft.structured) {
      openDraft(draft, handle);
      return;
    }
    importDraft.value = draft;
  } catch (e: unknown) {
    ui.toastError('导入失败: ' + toErrorMessage(e));
  } finally {
    importing.value = false;
  }
}

async function onOpen() {
  try {
    const picked = await fs.pickResumeFile();
    if (!picked) return;
    await handleImportFile(picked.file, picked.handle);
  } catch (e: unknown) {
    ui.toastError('打开失败: ' + toErrorMessage(e));
  }
}

function confirmImport() {
  const draft = importDraft.value;
  if (!draft) return;
  importDraft.value = null;
  openDraft(draft, null);
}

function cancelImport() {
  importDraft.value = null;
}

function onDragOver(e: DragEvent) {
  if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  e.preventDefault();
  void handleImportFile(file, null);
}

function buildFileName(): string {
  const tab = tabs.active;
  return sanitizeFilename(tab?.data.name || tab?.title || '简历') + '-简历.json';
}

async function onSave() {
  if (!tabs.active) return ui.toastWarning('没有打开的简历');
  const tab = tabs.active;
  const content = serializeResume(
    tab.data, tab.template, tab.sectionOrder, tab.theme, tab.targetJd, tab.hiddenSections,
  );

  let handle = tab.fileHandle;
  if (!handle) {
    // 不支持 File System Access API 的浏览器（Firefox/Safari）降级为下载
    if (!fs.isSupported) {
      fs.downloadAsBlob(content, buildFileName());
      tab.dirty = false;
      ui.toastSuccess('当前浏览器不支持直接写文件，已下载 JSON 文件');
      return;
    }
    handle = await fs.pickSaveFile(buildFileName());
    if (!handle) return;
    tab.fileHandle = handle;
  }
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
  const content = serializeResume(
    tab.data, tab.template, tab.sectionOrder, tab.theme, tab.targetJd, tab.hiddenSections,
  );

  if (!fs.isSupported) {
    fs.downloadAsBlob(content, buildFileName());
    tab.dirty = false;
    ui.toastSuccess('已下载 JSON 文件');
    return;
  }

  const handle = await fs.pickSaveFile(buildFileName());
  if (!handle) return;
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

function onPrintPdf() {
  if (!tabs.active) return ui.toastWarning('没有打开的简历');
  printResume();
}

function onExportDocx() {
  if (!tabs.active) return ui.toastWarning('没有打开的简历');
  void exportDocx();
}

function onUndo() {
  if (!undo()) ui.toastInfo('没有可撤销的操作');
}

function onRedo() {
  if (!redo()) ui.toastInfo('没有可重做的操作');
}

useKeyboardShortcuts({
  onNew, onOpen, onSave, onSaveAs,
  onPrintPdf, onExportPdf, onUndo, onRedo,
});

onMounted(async () => {
  await recoverOrphanedTabs();
  // 不再自动创建空白 Tab：没有 Tab 时展示欢迎页，由用户选择示例或空白
});
</script>

<template>
  <div class="app-root" @dragover="onDragOver" @drop="onDrop">
    <Toolbar
      :on-new="onNew"
      :on-open="onOpen"
      :on-save="onSave"
      :on-save-as="onSaveAs"
      :on-print-pdf="onPrintPdf"
      :on-export-pdf="onExportPdf"
      :on-export-docx="onExportDocx"
      :on-undo="onUndo"
      :on-redo="onRedo"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :has-tab="hasTabs"
      :on-open-settings="() => (settingsOpen = true)"
      :ai-ready="settings.aiReady"
      :on-open-applications="() => (applicationsOpen = true)"
    />

    <template v-if="hasTabs">
      <TabBar />
      <div class="mobile-switch" role="tablist" aria-label="切换编辑或预览">
        <button
          :class="{ active: mobileView === 'edit' }"
          role="tab"
          :aria-selected="mobileView === 'edit'"
          @click="mobileView = 'edit'"
        >编辑</button>
        <button
          :class="{ active: mobileView === 'preview' }"
          role="tab"
          :aria-selected="mobileView === 'preview'"
          @click="mobileView = 'preview'"
        >预览</button>
      </div>
      <main class="app-main" :class="`view-${mobileView}`">
        <aside class="app-editor" aria-label="简历编辑区">
          <EditorPanel v-if="tabs.active" />
          <div v-else class="empty-editor">
            <p>请点击“新建”创建简历，或“打开”导入 PDF / Word / JSON</p>
          </div>
        </aside>
        <section class="app-preview" aria-label="简历预览区">
          <PreviewPanel />
        </section>
      </main>
    </template>

    <WelcomePanel
      v-else
      class="app-welcome"
      @new="onNew"
      @open="onOpen"
      @sample="onSample"
    />

    <ImportDialog
      v-if="importDraft"
      :draft="importDraft"
      :ai-reparsing="aiReparsing"
      @confirm="confirmImport"
      @cancel="cancelImport"
      @ai-reparse="onAiReparse"
    />

    <SettingsDialog v-if="settingsOpen" @close="settingsOpen = false" />

    <ApplicationsPanel
      v-if="applicationsOpen"
      @close="applicationsOpen = false"
      @optimize="onOptimizeApplication"
    />

    <OptimizerPanel
      v-if="optimizerOpen && settings.aiReady && hasTabs"
      :preset-jd="optimizerJd"
      :preset-label="optimizerLabel"
      @close="optimizerOpen = false"
    />

    <AssistantPanel v-if="settings.aiReady && hasTabs" />

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<style scoped>
.app-root {
  display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
}
.app-welcome { flex: 1; min-height: 0; }
.app-main {
  display: grid; grid-template-columns: 380px 1fr;
  flex: 1; overflow: hidden; min-height: 0;
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

.mobile-switch { display: none; }

/* 平板（768-1023px）：收窄编辑栏，避免 380px 在 768px 屏上挤压预览 */
@media (max-width: 1023px) {
  .app-main { grid-template-columns: 320px 1fr; }
}

/* 手机 / 窄窗（<768px）：编辑与预览二选一，避免上下对半都看不清 */
@media (max-width: 767px) {
  .mobile-switch {
    display: flex; gap: 6px; padding: 8px 10px;
    background: #fff; border-bottom: 1px solid #e8e8e8;
  }
  .mobile-switch button {
    flex: 1; padding: 7px 10px; border: 1px solid #d9d9d9; border-radius: 6px;
    background: #fff; font-size: 13px; color: #555; cursor: pointer;
  }
  .mobile-switch button.active {
    border-color: #1890ff; color: #1890ff; background: #e6f7ff; font-weight: 600;
  }
  .app-main { grid-template-columns: 1fr; grid-template-rows: 1fr; }
  .app-main.view-edit .app-preview { display: none; }
  .app-main.view-preview .app-editor { display: none; }
  .app-editor { border-right: none; }
}
</style>
