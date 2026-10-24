<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { chatWithAssistant } from '@/utils/ai/assistant';
import type { ChatTurn } from '@/utils/ai/assistant';
import { applyProposal } from '@/utils/ai/proposals';
import type { ResolvedProposal } from '@/utils/ai/proposals';
import { toErrorMessage } from '@/utils/errors';
import AppIcon from './AppIcon.vue';

/**
 * AI 聊天助手面板：单轮提案式交互（仅 AI 已配置且有打开的简历时由 App 渲染）。
 * 修改永远以提案卡片呈现，用户逐条采纳后才写入（整体替换 → 独立撤销步）。
 */

interface UiProposal extends ResolvedProposal {
  ui: 'idle' | 'accepted' | 'rejected' | 'failed';
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  proposals?: UiProposal[];
}

const settings = useSettingsStore();
const tabs = useTabsStore();
const ui = useUiStore();

const open = ref(false);
const input = ref('');
const loading = ref(false);
const messages = ref<Message[]>([]);
const listEl = ref<HTMLElement | null>(null);

let msgId = 0;
let persistedTabId: string | null = null;

const STORAGE_KEY_PREFIX = 'resume_assistant_';
const MAX_PERSISTED = 20;
const MAX_PERSIST_BYTES = 256 * 1024;

const suggestions = ['把工作经历改得更量化', '精简专业概述', '根据目标 JD 优化技能描述'];

const empty = computed(() => messages.value.length === 0);

function storageKey(tabId: string): string {
  return STORAGE_KEY_PREFIX + tabId;
}

function persist(): void {
  const tabId = tabs.active?.id;
  if (!tabId) return;
  try {
    const payload = JSON.stringify(messages.value.slice(-MAX_PERSISTED));
    if (payload.length <= MAX_PERSIST_BYTES) {
      localStorage.setItem(storageKey(tabId), payload);
    }
  } catch {
    // 存储满/不可用时静默：会话仅保留在内存
  }
}

function loadFor(tabId: string): void {
  try {
    const raw = localStorage.getItem(storageKey(tabId));
    messages.value = raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    messages.value = [];
  }
}

function switchTab(): void {
  const tabId = tabs.active?.id ?? null;
  if (tabId === persistedTabId) return;
  persistedTabId = tabId;
  if (tabId) loadFor(tabId);
  else messages.value = [];
}

watch(() => tabs.active?.id, switchTab, { immediate: true });

async function send(preset?: string): Promise<void> {
  const config = settings.requireAiConfig();
  const tab = tabs.active;
  if (!config || !tab || loading.value) return;

  const request = (preset ?? input.value).trim();
  if (!request) return;

  input.value = '';
  const history: ChatTurn[] = messages.value.map((m) => ({ role: m.role, content: m.content }));
  messages.value.push({ id: ++msgId, role: 'user', content: request });
  loading.value = true;
  await scrollToEnd();

  try {
    const turn = await chatWithAssistant(config, {
      request,
      history,
      data: tab.data,
      jd: tab.targetJd || undefined,
    });
    messages.value.push({
      id: ++msgId,
      role: 'assistant',
      content: turn.reply,
      proposals: turn.proposals
        .filter((p) => p.status !== 'duplicate' && p.status !== 'no-change')
        .map((p) => ({ ...p, ui: 'idle' as const })),
    });
  } catch (e) {
    messages.value.push({ id: ++msgId, role: 'assistant', content: `出错了：${toErrorMessage(e)}` });
  } finally {
    loading.value = false;
    persist();
    await scrollToEnd();
  }
}

async function accept(message: Message, index: number): Promise<void> {
  const proposal = message.proposals?.[index];
  const tab = tabs.active;
  if (!proposal || !tab) return;

  const result = applyProposal(tab.data, proposal);
  if (result.ok) {
    tabs.replaceActive({ data: result.data });
    proposal.ui = 'accepted';
    ui.toastSuccess('已应用，可 Ctrl+Z 撤销');
  } else {
    proposal.ui = 'failed';
    ui.toastWarning(result.reason === 'stale' ? '原文已变化，请让 AI 基于最新内容重新提案' : '该提案无法应用');
  }
  persist();
}

function reject(message: Message, index: number): void {
  const proposal = message.proposals?.[index];
  if (proposal) proposal.ui = 'rejected';
  persist();
}

async function clearChat(): Promise<void> {
  const action = await ui.confirmDialog({
    title: '清空助手对话',
    message: '将删除当前简历的对话记录（不影响简历内容）。',
    actions: ['清空', '取消'],
  });
  if (action !== '清空') return;
  messages.value = [];
  if (tabs.active?.id) localStorage.removeItem(storageKey(tabs.active.id));
}

async function scrollToEnd(): Promise<void> {
  await nextTick();
  const el = listEl.value;
  if (!el) return;
  try {
    el.scrollTo({ top: el.scrollHeight });
  } catch {
    // scrollTo 不可用（jsdom / 旧浏览器）时降级为直接赋值
    el.scrollTop = el.scrollHeight;
  }
}

function onInputKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    void send();
  }
}

onMounted(scrollToEnd);
</script>

<template>
  <div class="assistant-root">
    <button
      v-if="!open"
      class="assistant-fab"
      type="button"
      title="AI 助手"
      aria-label="打开 AI 助手"
      @click="open = true"
    >
      <AppIcon name="sparkles" />
    </button>

    <aside v-else class="assistant-panel" aria-label="AI 助手面板">
      <header class="panel-head">
        <span class="panel-title"><AppIcon name="sparkles" /> AI 助手</span>
        <div class="panel-actions">
          <button v-if="!empty" class="head-btn" type="button" @click="clearChat">清空</button>
          <button class="head-btn" type="button" aria-label="收起助手" @click="open = false">×</button>
        </div>
      </header>

      <div ref="listEl" class="panel-body">
        <div v-if="empty" class="empty-hint">
          <p>告诉我想怎么改简历，我会以「提案卡片」给出修改建议，你逐条确认后才会生效。</p>
          <div class="suggestion-row">
            <button
              v-for="s in suggestions"
              :key="s"
              class="suggestion-chip"
              type="button"
              :disabled="loading"
              @click="send(s)"
            >{{ s }}</button>
          </div>
        </div>

        <template v-for="m in messages" :key="m.id">
          <div class="msg" :class="m.role">
            <p class="msg-text">{{ m.content }}</p>
          </div>

          <div v-if="m.proposals?.length" class="proposal-list">
            <div
              v-for="(p, i) in m.proposals"
              :key="`${m.id}-${i}`"
              class="proposal-card"
              :class="p.ui"
            >
              <div class="proposal-meta">
                <span class="proposal-loc">{{ p.passage?.location ?? '位置已失效' }}</span>
                <span v-if="p.add" class="proposal-add">新增条目</span>
              </div>
              <p v-if="p.passage?.text" class="proposal-before">{{ p.passage.text }}</p>
              <p class="proposal-after">{{ p.after }}</p>
              <p v-if="p.why" class="proposal-why">{{ p.why }}</p>
              <div v-if="p.ui === 'idle' && p.status === 'pending'" class="proposal-actions">
                <button class="proposal-btn primary" type="button" @click="accept(m, i)">采纳</button>
                <button class="proposal-btn" type="button" @click="reject(m, i)">忽略</button>
              </div>
              <span v-else-if="p.ui === 'accepted'" class="proposal-state ok">已采纳</span>
              <span v-else-if="p.ui === 'rejected'" class="proposal-state">已忽略</span>
              <span v-else-if="p.ui === 'failed'" class="proposal-state bad">应用失败（原文已变化）</span>
              <span v-else-if="p.status === 'stale'" class="proposal-state bad">内容已变化，请重新提案</span>
            </div>
          </div>
        </template>

        <div v-if="loading" class="msg assistant loading-msg">
          <AppIcon name="spinner" class="spin" /> AI 思考中…
        </div>
      </div>

      <footer class="panel-foot">
        <textarea
          v-model="input"
          class="panel-input"
          rows="2"
          placeholder="描述你想改什么，如：把第二段工作经历改写成 STAR 格式"
          aria-label="对 AI 助手的指令"
          :disabled="loading"
          @keydown="onInputKeydown"
        />
        <button
          class="send-btn"
          type="button"
          :disabled="loading || !input.trim()"
          aria-label="发送"
          @click="send()"
        >
          <AppIcon name="upload" />
        </button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.assistant-root { position: static; }

.assistant-fab {
  position: fixed; right: 20px; bottom: 24px; z-index: 60;
  width: 46px; height: 46px; border-radius: 50%;
  border: 1px solid #d3adf7; background: #722ed1; color: #fff;
  font-size: 20px; cursor: pointer;
  box-shadow: 0 4px 14px rgba(114, 46, 209, 0.4);
  display: flex; align-items: center; justify-content: center;
}
.assistant-fab:hover { background: #9254de; }

.assistant-panel {
  position: fixed; right: 16px; top: 64px; bottom: 16px; z-index: 60;
  width: min(360px, calc(100vw - 32px));
  background: #fff; border: 1px solid #e8e8e8; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  display: flex; flex-direction: column; overflow: hidden;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-bottom: 1px solid #f0f0f0;
  background: #faf5ff;
}
.panel-title {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #5a3a8a;
}
.panel-actions { display: flex; gap: 6px; }
.head-btn {
  border: none; background: transparent; color: #999; font-size: 12px;
  cursor: pointer; padding: 2px 6px; border-radius: 4px;
}
.head-btn:hover { background: #f0e6ff; color: #722ed1; }

.panel-body { flex: 1; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }

.empty-hint { padding: 12px 6px; }
.empty-hint p { margin: 0 0 10px; font-size: 12px; color: #8c8c8c; line-height: 1.7; }
.suggestion-row { display: flex; flex-wrap: wrap; gap: 6px; }
.suggestion-chip {
  padding: 4px 10px; border: 1px solid #d3adf7; border-radius: 12px;
  background: #fff; color: #722ed1; font-size: 11px; cursor: pointer;
}
.suggestion-chip:hover:not(:disabled) { background: #f9f0ff; }
.suggestion-chip:disabled { opacity: 0.5; cursor: not-allowed; }

.msg {
  max-width: 88%; padding: 8px 10px; border-radius: 10px;
  font-size: 12px; line-height: 1.6;
}
.msg.user {
  align-self: flex-end; background: #722ed1; color: #fff;
  border-bottom-right-radius: 3px;
}
.msg.assistant {
  align-self: flex-start; background: #f5f5f5; color: #333;
  border-bottom-left-radius: 3px;
}
.msg-text { margin: 0; white-space: pre-wrap; word-break: break-word; }
.loading-msg {
  display: inline-flex; align-items: center; gap: 6px; color: #999;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.proposal-list { display: flex; flex-direction: column; gap: 8px; }
.proposal-card {
  align-self: stretch;
  border: 1px solid #d9e5ff; border-radius: 8px; background: #fbfcff;
  padding: 8px 10px; display: flex; flex-direction: column; gap: 5px;
}
.proposal-card.rejected, .proposal-card.accepted { opacity: 0.6; }
.proposal-meta { display: flex; align-items: center; gap: 8px; }
.proposal-loc { font-size: 10px; color: #722ed1; font-weight: 600; }
.proposal-add {
  font-size: 10px; color: #d46b08;
  background: #fff7e6; border-radius: 8px; padding: 0 6px;
}
.proposal-before {
  margin: 0; font-size: 11px; color: #999;
  text-decoration: line-through; line-height: 1.6;
}
.proposal-after {
  margin: 0; font-size: 12px; color: #262626; line-height: 1.6;
  background: #f0f9ff; border-radius: 4px; padding: 5px 8px;
}
.proposal-why { margin: 0; font-size: 10px; color: #8c8c8c; }
.proposal-actions { display: flex; gap: 6px; margin-top: 2px; }
.proposal-btn {
  padding: 4px 14px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #555; font-size: 11px; cursor: pointer;
}
.proposal-btn.primary { background: #722ed1; border-color: #722ed1; color: #fff; }
.proposal-btn.primary:hover { background: #9254de; }
.proposal-state { font-size: 10px; color: #999; }
.proposal-state.ok { color: #52c41a; }
.proposal-state.bad { color: #fa541c; }

.panel-foot {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 10px; border-top: 1px solid #f0f0f0; background: #fff;
}
.panel-input {
  flex: 1; resize: none; padding: 7px 10px;
  border: 1px solid #d9d9d9; border-radius: 8px;
  font-size: 12px; line-height: 1.6; font-family: inherit; outline: none;
}
.panel-input:focus { border-color: #722ed1; }
.send-btn {
  width: 34px; height: 34px; flex-shrink: 0;
  border: none; border-radius: 8px; background: #722ed1; color: #fff;
  font-size: 14px; cursor: pointer;
  transform: rotate(90deg);
  display: flex; align-items: center; justify-content: center;
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 767px) {
  .assistant-panel {
    right: 8px; left: 8px; top: 56px; bottom: 8px;
    width: auto;
  }
}
</style>
