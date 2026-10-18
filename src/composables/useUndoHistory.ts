import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import type { ResumeData, SectionId, TemplateName, ThemeConfig } from '@/types/resume';

/** 单个 Tab 的历史栈，存序列化快照，避免持有响应式代理 */
interface Snapshot {
  data: ResumeData;
  template: TemplateName;
  sectionOrder: SectionId[] | null;
  theme: ThemeConfig | null;
  hiddenSections?: SectionId[];
}

interface Stack {
  items: string[];
  index: number;
}

const HISTORY_LIMIT = 40;
const PUSH_DEBOUNCE_MS = 450;

const stacks = new Map<string, Stack>();

/** 仅供测试使用：清空所有 Tab 的历史 */
export function __clearHistory(): void {
  stacks.clear();
}

export function useUndoHistory() {
  const tabs = useTabsStore();
  const version = ref(0);
  let applying = false;

  function snapshotOf(): string {
    const tab = tabs.active;
    if (!tab) return '';
    const snap: Snapshot = {
      data: tab.data,
      template: tab.template,
      sectionOrder: tab.sectionOrder,
      theme: tab.theme,
      hiddenSections: tab.hiddenSections,
    };
    return JSON.stringify(snap);
  }

  function ensureStack(id: string): Stack {
    let stack = stacks.get(id);
    if (!stack) {
      stack = { items: [], index: -1 };
      stacks.set(id, stack);
    }
    return stack;
  }

  function ensureBaseline(id: string): void {
    const stack = ensureStack(id);
    if (stack.index === -1) {
      stack.items = [snapshotOf()];
      stack.index = 0;
      version.value++;
    }
  }

  function push(): void {
    const tab = tabs.active;
    if (!tab || applying) return;
    const snap = snapshotOf();
    const stack = ensureStack(tab.id);
    if (stack.index >= 0 && stack.items[stack.index] === snap) return;
    stack.items = stack.items.slice(0, stack.index + 1);
    stack.items.push(snap);
    if (stack.items.length > HISTORY_LIMIT) stack.items.shift();
    stack.index = stack.items.length - 1;
    version.value++;
  }

  let pushTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelScheduledPush(): void {
    if (pushTimer !== null) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
  }

  function schedulePush(): void {
    cancelScheduledPush();
    pushTimer = setTimeout(() => {
      pushTimer = null;
      push();
    }, PUSH_DEBOUNCE_MS);
  }

  function apply(snapshot: string): void {
    const parsed = JSON.parse(snapshot) as Snapshot;
    applying = true;
    cancelScheduledPush();
    tabs.replaceActive({
      data: parsed.data,
      template: parsed.template,
      sectionOrder: parsed.sectionOrder,
      theme: parsed.theme,
      hiddenSections: parsed.hiddenSections ?? [],
    });
    nextTick(() => {
      applying = false;
    });
  }

  function undo(): boolean {
    const tab = tabs.active;
    if (!tab) return false;
    const stack = stacks.get(tab.id);
    if (!stack || stack.index <= 0) return false;
    stack.index--;
    apply(stack.items[stack.index]);
    version.value++;
    return true;
  }

  function redo(): boolean {
    const tab = tabs.active;
    if (!tab) return false;
    const stack = stacks.get(tab.id);
    if (!stack || stack.index >= stack.items.length - 1) return false;
    stack.index++;
    apply(stack.items[stack.index]);
    version.value++;
    return true;
  }

  const canUndo = computed(() => {
    void version.value;
    const stack = tabs.active ? stacks.get(tabs.active.id) : undefined;
    return !!stack && stack.index > 0;
  });

  const canRedo = computed(() => {
    void version.value;
    const stack = tabs.active ? stacks.get(tabs.active.id) : undefined;
    return !!stack && stack.index < stack.items.length - 1;
  });

  // 初始化基线：当前已打开的 Tab 也应能撤销到初始状态
  if (tabs.active) ensureBaseline(tabs.active.id);

  const stopWatch = watch(
    () => {
      const tab = tabs.active;
      if (!tab) return null;
      return {
        id: tab.id,
        data: tab.data,
        template: tab.template,
        sectionOrder: tab.sectionOrder,
        theme: tab.theme,
        hiddenSections: tab.hiddenSections,
      };
    },
    (val, old) => {
      if (!val) return;
      if (!old || old.id !== val.id) {
        ensureBaseline(val.id);
        return;
      }
      if (applying) return;
      schedulePush();
    },
    { deep: true },
  );

  // Tab 关闭后清理历史，避免内存泄漏
  const stopCleanup = watch(
    () => tabs.tabs.map(t => t.id).join('|'),
    () => {
      const alive = new Set(tabs.tabs.map(t => t.id));
      for (const id of [...stacks.keys()]) {
        if (!alive.has(id)) stacks.delete(id);
      }
    },
  );

  onUnmounted(() => {
    stopWatch();
    stopCleanup();
    cancelScheduledPush();
  });

  return { undo, redo, canUndo, canRedo };
}
