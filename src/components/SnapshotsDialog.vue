<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useSnapshotsStore } from '@/stores/snapshots';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { useFileSystemStore } from '@/stores/fileSystem';
import { parseResumeFile } from '@/utils/parseResume';
import type { SnapshotEntry } from '@/stores/snapshots';

/**
 * 历史版本（快照）面板：列出当前简历的保存快照，
 * 恢复永远以「新 Tab」打开（不覆盖当前内容），另支持下载 JSON / 删除。
 */
const emit = defineEmits<{ (e: 'close'): void }>();

const snapshots = useSnapshotsStore();
const tabs = useTabsStore();
const ui = useUiStore();
const fs = useFileSystemStore();

const activeSnapshots = computed(() => {
  const tabId = tabs.active?.id;
  if (!tabId) return [];
  return snapshots.byTab.get(tabId) ?? [];
});

/** 其他 Tab 的快照（按简历分组，折叠展示） */
const otherGroups = computed(() => {
  const activeId = tabs.active?.id;
  return [...snapshots.byTab.entries()]
    .filter(([tabId]) => tabId !== activeId)
    .map(([tabId, list]) => ({ tabId, title: list[0]?.tabTitle ?? '未知简历', list }));
});

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtSize(content: string): string {
  const kb = Math.round(content.length / 1024);
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`;
}

/** 以新 Tab 打开快照：复用 JSON 导入管线，零覆盖风险 */
function restore(entry: SnapshotEntry): void {
  try {
    const parsed = parseResumeFile(JSON.parse(entry.content));
    const title = `${entry.tabTitle}@${fmtTime(entry.savedAt)}`;
    tabs.open({
      title,
      data: parsed.data,
      template: parsed.template,
      sectionOrder: parsed.sectionOrder,
      theme: parsed.theme,
      targetJd: parsed.targetJd,
      hiddenSections: parsed.hiddenSections,
      dirty: true,
    });
    ui.toastSuccess(`已在新标签页打开快照（${fmtTime(entry.savedAt)}），确认无误后可关闭旧版本`);
    emit('close');
  } catch {
    ui.toastError('快照内容已损坏，无法恢复');
  }
}

function download(entry: SnapshotEntry): void {
  fs.downloadAsBlob(entry.content, `${entry.tabTitle}-${fmtTime(entry.savedAt).replace(/[- :]/g, '')}.json`);
}

async function removeSnapshot(entry: SnapshotEntry): Promise<void> {
  const action = await ui.confirmDialog({
    title: '删除快照',
    message: `删除 ${fmtTime(entry.savedAt)} 的快照？该操作不可恢复（不影响简历本身）。`,
    actions: ['删除', '取消'],
  });
  if (action !== '删除') return;
  snapshots.remove(entry.id);
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="snap-backdrop" @click.self="emit('close')">
    <div class="snap-dialog" role="dialog" aria-modal="true" aria-labelledby="snap-title">
      <header class="snap-head">
        <div>
          <h3 id="snap-title">历史版本</h3>
          <p class="snap-sub">每次成功保存自动留档（每份简历最近 5 份）；恢复会打开新标签页，不会覆盖当前内容</p>
        </div>
        <button class="snap-close" type="button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div class="snap-body">
        <div v-if="activeSnapshots.length === 0 && otherGroups.length === 0" class="snap-empty">
          还没有快照。保存一次简历（Ctrl+S）后，这里会出现可恢复的历史版本。
        </div>

        <section v-if="activeSnapshots.length">
          <h4 class="snap-group-title">当前简历（{{ activeSnapshots[0].tabTitle }}）</h4>
          <div v-for="entry in activeSnapshots" :key="entry.id" class="snap-item">
            <div class="snap-item-main">
              <span class="snap-time">{{ fmtTime(entry.savedAt) }}</span>
              <span class="snap-size">{{ fmtSize(entry.content) }}</span>
            </div>
            <div class="snap-item-actions">
              <button class="snap-btn primary" type="button" @click="restore(entry)">恢复为新标签页</button>
              <button class="snap-btn" type="button" @click="download(entry)">下载 JSON</button>
              <button class="snap-btn danger" type="button" @click="removeSnapshot(entry)">删除</button>
            </div>
          </div>
        </section>

        <details v-for="group in otherGroups" :key="group.tabId" class="snap-other">
          <summary class="snap-group-title collapsed">
            {{ group.title }}（{{ group.list.length }} 份快照）
          </summary>
          <div v-for="entry in group.list" :key="entry.id" class="snap-item">
            <div class="snap-item-main">
              <span class="snap-time">{{ fmtTime(entry.savedAt) }}</span>
              <span class="snap-size">{{ fmtSize(entry.content) }}</span>
            </div>
            <div class="snap-item-actions">
              <button class="snap-btn primary" type="button" @click="restore(entry)">恢复为新标签页</button>
              <button class="snap-btn danger" type="button" @click="removeSnapshot(entry)">删除</button>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snap-backdrop {
  position: fixed; inset: 0; z-index: 9994;
  background: rgba(16, 35, 59, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.snap-dialog {
  width: min(560px, 100%); max-height: 86vh;
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; overflow: hidden;
}
.snap-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 12px; border-bottom: 1px solid #f0f0f0;
}
.snap-head h3 { margin: 0 0 4px; font-size: 17px; color: #10233b; }
.snap-sub { margin: 0; font-size: 12px; color: #7b8a9c; line-height: 1.5; }
.snap-close {
  border: none; background: transparent; font-size: 22px; line-height: 1;
  color: #999; cursor: pointer; padding: 0 4px;
}
.snap-close:hover { color: #333; }

.snap-body { flex: 1; overflow: auto; padding: 12px 20px 20px; display: flex; flex-direction: column; gap: 12px; }
.snap-empty {
  padding: 20px; border: 1px dashed #d9d9d9; border-radius: 8px;
  color: #8c8c8c; font-size: 12px; text-align: center; line-height: 1.8;
}
.snap-group-title {
  margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #10233b;
}
.snap-group-title.collapsed {
  cursor: pointer; color: #5b6b7f; font-weight: 500; list-style: none; user-select: none;
}
.snap-group-title.collapsed::-webkit-details-marker { display: none; }
.snap-group-title.collapsed::before { content: '▸ '; font-size: 10px; }
.snap-other[open] .snap-group-title.collapsed::before { content: '▾ '; }

.snap-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 12px; border: 1px solid #eef1f5; border-radius: 8px;
  margin-bottom: 6px;
}
.snap-item-main { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.snap-time { font-size: 13px; font-weight: 600; color: #262626; white-space: nowrap; }
.snap-size { font-size: 11px; color: #9aa7b6; white-space: nowrap; }
.snap-item-actions { display: flex; gap: 6px; flex-shrink: 0; }
.snap-btn {
  padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #555; font-size: 11px; cursor: pointer; white-space: nowrap;
}
.snap-btn:hover { border-color: #1890ff; color: #1890ff; }
.snap-btn.primary { border-color: #1890ff; color: #1890ff; }
.snap-btn.primary:hover { background: #e6f4ff; }
.snap-btn.danger:hover { border-color: #ff4d4f; color: #ff4d4f; }
</style>
