<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import AppIcon from './AppIcon.vue';

const tabs = useTabsStore();
const ui = useUiStore();

async function onClose(id: string, e: MouseEvent) {
  e.stopPropagation();
  const tab = tabs.tabs.find(t => t.id === id);
  if (!tab) return;
  if (tab.dirty) {
    const action = await ui.confirmDialog({
      title: '关闭确认',
      message: `Tab "${tab.title}" 有未保存的修改，确定关闭吗？`,
      actions: ['关闭且不保存', '取消'],
    });
    if (action !== '关闭且不保存') return;
  }
  tabs.close(id);
}

function onNew() {
  tabs.open({ title: '未命名' });
}

function onSwitch(id: string) {
  tabs.switchTo(id);
}
</script>

<template>
  <div class="tab-bar">
    <div class="tab-list" role="tablist" aria-label="简历 Tab 列表">
      <div
        v-for="tab in tabs.tabs"
        :key="tab.id"
        :class="['tab-item', { active: tab.id === tabs.activeId }]"
        role="tab"
        :aria-selected="tab.id === tabs.activeId"
        :tabindex="tab.id === tabs.activeId ? 0 : -1"
        :aria-label="`切换到简历：${tab.title}${tab.dirty ? '（未保存）' : ''}`"
        @click="onSwitch(tab.id)"
        @keydown.enter.prevent="onSwitch(tab.id)"
        @keydown.space.prevent="onSwitch(tab.id)"
      >
        <span class="tab-title" :title="tab.title">{{ tab.title }}</span>
        <span v-if="tab.dirty" class="tab-dirty-mark" aria-hidden="true" title="未保存">●</span>
        <button
          class="tab-close-btn"
          :aria-label="`关闭简历 ${tab.title}`"
          title="关闭"
          @click="onClose(tab.id, $event)"
        >
          <AppIcon name="times" />
        </button>
      </div>
    </div>
    <button class="tab-new-btn" aria-label="新建简历" title="新建简历" @click="onNew">
      <AppIcon name="plus" /> 新建
    </button>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}
.tab-list { display: flex; gap: 4px; flex: 1; overflow-x: auto; }
.tab-item {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border: 1px solid #d9d9d9;
  border-radius: 4px 4px 0 0; background: #fff;
  cursor: pointer; font-size: 13px; color: #555;
  max-width: 200px; transition: all 0.2s;
}
.tab-item:hover { background: #f0f5ff; border-color: #1890ff; }
.tab-item.active { background: #e6f7ff; border-color: #1890ff; color: #1890ff; }
.tab-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.tab-dirty-mark { color: #faad14; font-size: 10px; }
.tab-close-btn {
  border: none; background: transparent; cursor: pointer;
  color: #999; padding: 0; display: flex; align-items: center;
  font-size: 12px; border-radius: 2px;
}
.tab-close-btn:hover { color: #ff4d4f; background: #fff1f0; }
.tab-new-btn {
  padding: 4px 12px; border: 1px dashed #1890ff;
  background: #fff; color: #1890ff; cursor: pointer;
  border-radius: 4px; font-size: 12px;
  display: inline-flex; align-items: center; gap: 4px;
  white-space: nowrap;
}
.tab-new-btn:hover { background: #f0f5ff; }
</style>
