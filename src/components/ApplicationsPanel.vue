<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useApplicationsStore } from '@/stores/applications';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { useFileSystemStore } from '@/stores/fileSystem';
import { APPLICATION_STATUSES, CHANNEL_LABELS } from '@/types/applications';
import type { ApplicationChannel, JobApplication } from '@/types/applications';
import { toErrorMessage } from '@/utils/errors';
import { detectCompanion, fetchJdViaCompanion, openCompanionLogin, companionErrorCode } from '@/utils/companion';
import type { CompanionHealth } from '@/utils/companion';
import AppIcon from './AppIcon.vue';

/**
 * 投递记录面板：纯本地台账（Boss直聘等平台只作为渠道标签与 JD 的来源，
 * 工具不访问任何平台）。JD 粘贴捕获 + 状态流转 + 漏斗统计 +
 * 按岗位派生简历版本（多岗位版本矩阵的入口）。
 */
const emit = defineEmits<{ (e: 'close'): void }>();

const apps = useApplicationsStore();
const tabs = useTabsStore();
const ui = useUiStore();
const fs = useFileSystemStore();

// —— 新增表单 ——
const formOpen = ref(false);
const form = ref({
  company: '',
  position: '',
  channel: 'boss' as ApplicationChannel,
  link: '',
  jd: '',
});

// —— Boss直聘直连（可选：本地伴随进程在线时才有入口） ——
const companion = ref<CompanionHealth | null>(null);
const fetching = ref(false);

void detectCompanion().then((health) => {
  companion.value = health;
});

async function grabJd(): Promise<void> {
  const url = form.value.link.trim();
  if (!url) {
    ui.toastWarning('请先粘贴 Boss直聘岗位链接');
    return;
  }
  fetching.value = true;
  try {
    const job = await fetchJdViaCompanion(url);
    form.value.company = form.value.company || job.company;
    form.value.position = form.value.position || job.position;
    form.value.jd = job.jd;
    ui.toastSuccess(`已抓取「${job.company} · ${job.position}」的 JD，请核对后保存`);
  } catch (e) {
    if (companionErrorCode(e) === 'NEED_LOGIN') {
      ui.toastWarning('伴随进程未登录：点击「扫码登录」后重试');
    } else {
      ui.toastError(toErrorMessage(e));
    }
  } finally {
    fetching.value = false;
  }
}

async function loginBrowser(): Promise<void> {
  try {
    await openCompanionLogin();
    ui.toastInfo('已打开登录浏览器，扫码后回到这里重试抓取');
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  }
}

const funnel = computed(() => {
  const s = apps.stats;
  return [
    { label: '总计', value: s.total },
    { label: '已投递', value: s.applied },
    { label: '已沟通', value: s.communicated },
    { label: '约面/面试', value: s.interviewing },
    { label: 'offer', value: s.offer },
  ];
});

const CHANNEL_OPTIONS = Object.entries(CHANNEL_LABELS) as [ApplicationChannel, string][];

function openForm(): void {
  formOpen.value = true;
}

function submitForm(): void {
  const app = apps.addApplication({
    company: form.value.company,
    position: form.value.position,
    channel: form.value.channel,
    jd: form.value.jd,
    link: form.value.link,
  });
  if (!app) {
    ui.toastWarning('公司与岗位为必填项');
    return;
  }
  ui.toastSuccess(`已记录「${app.company} · ${app.position}」`);
  form.value = { company: '', position: '', channel: 'boss', link: '', jd: '' };
  formOpen.value = false;
}

function onStatusChange(app: JobApplication, event: Event): void {
  apps.setStatus(app.id, (event.target as HTMLSelectElement).value as JobApplication['status']);
}

async function removeApp(app: JobApplication): Promise<void> {
  const action = await ui.confirmDialog({
    title: '删除投递记录',
    message: `删除「${app.company} · ${app.position}」？该操作不可恢复。`,
    actions: ['删除', '取消'],
  });
  if (action !== '删除') return;
  apps.removeApplication(app.id);
  ui.toastInfo('已删除');
}

/** 把该岗位的 JD 填入当前简历的岗位匹配（本地关键词 + 可选 AI 深度分析复用） */
function analyzeJd(app: JobApplication): void {
  const tab = tabs.active;
  if (!tab) {
    ui.toastWarning('请先打开一份简历再分析岗位');
    return;
  }
  if (!app.jd.trim()) {
    ui.toastWarning('这条记录没有保存 JD，可编辑补上后再分析');
    return;
  }
  tabs.setTargetJd(app.jd);
  ui.toastSuccess('JD 已填入「岗位匹配」，展开即可查看分析');
  emit('close');
}

/** 多岗位版本矩阵：复制当前简历派生一份该岗位专用版本，并绑定 JD */
function deriveVersion(app: JobApplication): void {
  const tab = tabs.active;
  if (!tab) {
    ui.toastWarning('请先打开一份要派生的简历');
    return;
  }
  const title = `${app.company}·${app.position}`;
  const existing = tabs.findExistingByTitle(title);
  if (existing) {
    tabs.switchTo(existing.id);
    ui.toastInfo('该岗位的简历版本已存在，已切换过去');
    emit('close');
    return;
  }
  tabs.open({
    title,
    data: tab.data,
    template: tab.template,
    theme: tab.theme,
    targetJd: app.jd,
    dirty: true,
  });
  apps.updateApplication(app.id, { resumeTitle: title });
  ui.toastSuccess(`已派生「${title}」，JD 已带入岗位匹配`);
  emit('close');
}

// —— 备注 ——
const noteDraft = ref<Record<string, string>>({});
const expandedNotes = ref<Set<string>>(new Set());

function toggleNotes(id: string): void {
  const next = new Set(expandedNotes.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedNotes.value = next;
}

function submitNote(app: JobApplication): void {
  const text = noteDraft.value[app.id] ?? '';
  if (!text.trim()) return;
  apps.addNote(app.id, text);
  noteDraft.value[app.id] = '';
}

// —— 导入 / 导出 ——
const fileInput = ref<HTMLInputElement | null>(null);

function exportAll(): void {
  if (apps.list.length === 0) {
    ui.toastWarning('还没有投递记录可导出');
    return;
  }
  const date = new Date().toISOString().slice(0, 10);
  fs.downloadAsBlob(apps.exportJson(), `applications-${date}.json`);
  ui.toastSuccess('已导出 JSON');
}

function onImportFile(event: Event): void {
  const inputEl = event.target as HTMLInputElement;
  const file = inputEl.files?.[0];
  if (!file) return;
  void file.text().then((raw) => {
    const result = apps.importJson(raw);
    if (!result) {
      ui.toastError('导入失败：不是有效的投递记录 JSON');
      return;
    }
    ui.toastSuccess(`导入 ${result.imported} 条${result.skipped ? `，跳过重复 ${result.skipped} 条` : ''}`);
  }).catch((e: unknown) => ui.toastError(toErrorMessage(e)))
    .finally(() => { inputEl.value = ''; });
}

function fmtTime(iso: string): string {
  return iso.slice(0, 10);
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="apps-backdrop" @click.self="emit('close')">
    <div class="apps-dialog" role="dialog" aria-modal="true" aria-labelledby="apps-title">
      <header class="apps-head">
        <div>
          <h3 id="apps-title">投递记录</h3>
          <p class="apps-sub">本地台账，不连接任何招聘平台；粘贴 JD 即可复用岗位匹配与 AI 分析</p>
        </div>
        <button class="apps-close" type="button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div class="apps-funnel">
        <div v-for="f in funnel" :key="f.label" class="funnel-item">
          <span class="funnel-num">{{ f.value }}</span>
          <span class="funnel-label">{{ f.label }}</span>
        </div>
      </div>

      <div class="apps-toolbar">
        <button class="apps-btn primary" type="button" @click="openForm"><AppIcon name="plus" /> 记录一个岗位</button>
        <button class="apps-btn" type="button" @click="fileInput?.click()">导入</button>
        <button class="apps-btn" type="button" @click="exportAll">导出</button>
        <input ref="fileInput" type="file" accept=".json,application/json" class="hidden-input" @change="onImportFile" />
        <span v-if="companion" class="companion-chip online" title="本地伴随进程（mcp-server）在线；登录态与数据都在项目 .mcp/ 目录">
          Boss直聘直连 · 在线
        </span>
        <span v-else class="companion-chip" title="可选：项目内运行 npm run mcp 启动伴随进程后，可直接从岗位链接抓取 JD">
          Boss直聘直连 · 未启动
        </span>
      </div>

      <div v-if="formOpen" class="apps-form">
        <div class="form-grid">
          <input v-model="form.company" class="apps-input" placeholder="公司 *" aria-label="公司" />
          <input v-model="form.position" class="apps-input" placeholder="岗位 *" aria-label="岗位" />
          <select v-model="form.channel" class="apps-input" aria-label="渠道">
            <option v-for="[id, label] in CHANNEL_OPTIONS" :key="id" :value="id">{{ label }}</option>
          </select>
          <input v-model="form.link" class="apps-input" placeholder="岗位链接（Boss直聘详情页）" aria-label="岗位链接" />
        </div>
        <div v-if="companion" class="grab-row">
          <button class="apps-btn grab-btn" type="button" :disabled="fetching" @click="grabJd">
            {{ fetching ? '抓取中…' : '从链接抓取 JD' }}
          </button>
          <button class="apps-btn" type="button" title="首次使用先扫码登录；登录态只保存在项目 .mcp/ 目录" @click="loginBrowser">
            扫码登录
          </button>
          <span class="grab-hint">经本地伴随进程抓取，窗口最小化在任务栏可见；限速运行，请勿频繁使用</span>
        </div>
        <textarea
          v-model="form.jd"
          class="apps-textarea"
          rows="3"
          placeholder="粘贴 JD：打开 Boss直聘岗位页 → 选中职位描述 → 复制粘贴到这里（之后可一键分析匹配度、派生岗位定制版简历）"
          aria-label="JD 内容"
        />
        <div class="form-actions">
          <span class="form-hint">带 * 为必填；JD 保存后随时可补</span>
          <button class="apps-btn" type="button" @click="formOpen = false">取消</button>
          <button class="apps-btn primary" type="button" @click="submitForm">保存记录</button>
        </div>
      </div>

      <div class="apps-body">
        <div v-if="apps.list.length === 0" class="apps-empty">
          <p>还没有投递记录。找工作时的用法：</p>
          <ol>
            <li>在 Boss直聘看到合适的岗位，把职位描述粘贴进来，存一条记录</li>
            <li>用「分析 JD」一键看当前简历与岗位的匹配度</li>
            <li>用「派生版本」生成该岗位专用的简历副本，定向修改后导出投递</li>
            <li>随着沟通推进更新状态，顶部漏斗帮你掌握整体节奏</li>
          </ol>
        </div>

        <div v-for="app in apps.list" :key="app.id" class="app-card">
          <div class="app-card-head">
            <div class="app-title">
              <strong>{{ app.company }}</strong>
              <span class="app-position">{{ app.position }}</span>
              <span class="channel-badge" :class="app.channel">{{ CHANNEL_LABELS[app.channel] }}</span>
            </div>
            <select
              class="status-select"
              :value="app.status"
              :aria-label="`${app.company} 状态`"
              @change="onStatusChange(app, $event)"
            >
              <option v-for="s in APPLICATION_STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="app-card-meta">
            <span>更新于 {{ fmtTime(app.updatedAt) }}</span>
            <span v-if="app.resumeTitle" class="linked-resume" title="关联的简历版本">→ {{ app.resumeTitle }}</span>
            <span v-if="app.jd" class="jd-flag">已存 JD</span>
          </div>

          <div class="app-card-actions">
            <button class="mini-btn" type="button" @click="analyzeJd(app)">分析 JD</button>
            <button class="mini-btn" type="button" @click="deriveVersion(app)">派生简历版本</button>
            <button class="mini-btn" type="button" @click="toggleNotes(app.id)">
              备注（{{ app.notes.length }}）
            </button>
            <button class="mini-btn danger" type="button" @click="removeApp(app)">删除</button>
          </div>

          <div v-if="expandedNotes.has(app.id)" class="app-notes">
            <ul class="note-list">
              <li v-for="(n, i) in app.notes" :key="i">
                <span class="note-time">{{ fmtTime(n.at) }}</span>
                <span>{{ n.text }}</span>
              </li>
            </ul>
            <div class="note-input-row">
              <input
                v-model="noteDraft[app.id]"
                class="apps-input"
                placeholder="补充备注，如：HR 约了周三下午电话面"
                :aria-label="`${app.company} 新备注`"
                @keydown.enter="submitNote(app)"
              />
              <button class="mini-btn" type="button" @click="submitNote(app)">添加</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.apps-backdrop {
  position: fixed; inset: 0; z-index: 9996;
  background: rgba(16, 35, 59, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.apps-dialog {
  width: min(880px, 100%); max-height: 90vh;
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; overflow: hidden;
}
.apps-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 12px; border-bottom: 1px solid #f0f0f0;
}
.apps-head h3 { margin: 0 0 4px; font-size: 17px; color: #10233b; }
.apps-sub { margin: 0; font-size: 12px; color: #7b8a9c; }
.apps-close {
  border: none; background: transparent; font-size: 22px; line-height: 1;
  color: #999; cursor: pointer; padding: 0 4px;
}
.apps-close:hover { color: #333; }

.apps-funnel {
  display: flex; gap: 8px; padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0; background: #fbfcfe;
}
.funnel-item {
  flex: 1; text-align: center; padding: 8px 4px;
  background: #fff; border: 1px solid #eef1f5; border-radius: 8px;
}
.funnel-num { display: block; font-size: 20px; font-weight: 700; color: #10233b; }
.funnel-label { font-size: 10px; color: #8c9aac; }

.apps-toolbar {
  display: flex; gap: 8px; padding: 12px 20px 0;
}
.apps-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; border: 1px solid #d9d9d9; border-radius: 6px;
  background: #fff; color: #333; font-size: 12px; cursor: pointer;
}
.apps-btn:hover { border-color: #1890ff; color: #1890ff; }
.apps-btn.primary { background: #1890ff; border-color: #1890ff; color: #fff; }
.apps-btn.primary:hover { background: #40a9ff; }
.hidden-input { display: none; }

.companion-chip {
  margin-left: auto; align-self: center;
  font-size: 10px; color: #b0b8c4;
  padding: 2px 8px; border-radius: 10px;
  background: #f5f5f5;
}
.companion-chip.online { color: #d4380d; background: #fff2e8; }
.grab-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.grab-btn { border-color: #ffbb96; color: #d4380d; }
.grab-btn:hover:not(:disabled) { background: #fff2e8; }
.grab-btn:disabled { opacity: 0.6; cursor: wait; }
.grab-hint { font-size: 10px; color: #b0b8c4; line-height: 1.5; }

.apps-form {
  margin: 12px 20px 0; padding: 12px;
  background: #f9fbff; border: 1px solid #dbe7fa; border-radius: 8px;
}
.form-grid {
  display: grid; grid-template-columns: 1.4fr 1.4fr 0.9fr 2fr; gap: 8px;
}
.apps-input {
  padding: 6px 10px; border: 1px solid #d9d9d9; border-radius: 5px;
  font-size: 12px; font-family: inherit; outline: none; min-width: 0;
}
.apps-input:focus { border-color: #1890ff; }
.apps-textarea {
  width: 100%; box-sizing: border-box; margin-top: 8px; resize: vertical;
  padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 5px;
  font-size: 12px; line-height: 1.6; font-family: inherit; outline: none;
}
.apps-textarea:focus { border-color: #1890ff; }
.form-actions {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
}
.form-hint { flex: 1; font-size: 11px; color: #9aa7b6; }

.apps-body {
  flex: 1; overflow: auto; padding: 12px 20px 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.apps-empty {
  padding: 16px; border: 1px dashed #d9d9d9; border-radius: 8px;
  color: #8c8c8c; font-size: 12px; line-height: 1.8;
}
.apps-empty p { margin: 0 0 4px; color: #5b6b7f; }
.apps-empty ol { margin: 0; padding-left: 20px; }

.app-card {
  border: 1px solid #e8e8e8; border-radius: 8px; padding: 10px 12px;
  background: #fff;
}
.app-card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.app-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.app-title strong { font-size: 14px; color: #10233b; }
.app-position { font-size: 12px; color: #5b6b7f; }
.channel-badge {
  padding: 1px 7px; border-radius: 10px; font-size: 10px;
  background: #e6f4ff; color: #1677ff;
}
.channel-badge.boss { background: #fff0f0; color: #d4380d; }
.channel-badge.lagou { background: #e6fffb; color: #08979c; }
.channel-badge.zhilian { background: #f0f5ff; color: #2f54eb; }
.channel-badge.liepin { background: #fff7e6; color: #d46b08; }
.status-select {
  padding: 4px 8px; border: 1px solid #d9d9d9; border-radius: 5px;
  font-size: 12px; outline: none; background: #fff; flex-shrink: 0;
}
.app-card-meta {
  display: flex; gap: 10px; margin-top: 6px;
  font-size: 11px; color: #9aa7b6;
}
.linked-resume { color: #722ed1; }
.jd-flag { color: #52c41a; }
.app-card-actions {
  display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;
}
.mini-btn {
  padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #555; font-size: 11px; cursor: pointer;
}
.mini-btn:hover { border-color: #1890ff; color: #1890ff; }
.mini-btn.danger:hover { border-color: #ff4d4f; color: #ff4d4f; }

.app-notes {
  margin-top: 8px; padding-top: 8px; border-top: 1px dashed #eee;
}
.note-list {
  list-style: none; margin: 0 0 8px; padding: 0;
  display: flex; flex-direction: column; gap: 3px;
}
.note-list li {
  display: flex; gap: 8px; font-size: 11px; color: #5b6b7f; line-height: 1.6;
}
.note-time { color: #b0b8c4; flex-shrink: 0; }
.note-input-row { display: flex; gap: 6px; }
.note-input-row .apps-input { flex: 1; }

@media (max-width: 767px) {
  .apps-backdrop { padding: 10px; }
  .form-grid { grid-template-columns: 1fr 1fr; }
  .apps-funnel { flex-wrap: wrap; }
  .funnel-item { flex: 1 1 30%; }
}
</style>
