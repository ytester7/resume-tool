<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';

const tabs = useTabsStore();

function updateTitle(idx: number, value: string) {
  const sec = tabs.active?.data.customSections[idx];
  if (!sec) return;
  sec.title = value;
  tabs.active!.dirty = true;
}

function updateContent(idx: number, value: string) {
  const sec = tabs.active?.data.customSections[idx];
  if (!sec) return;
  sec.content = value;
  tabs.active!.dirty = true;
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">自定义区块</h3>
    <p class="custom-hint">可添加证书资质、语言能力、开源贡献等额外区块</p>
    <div
      v-for="(sec, idx) in (tabs.active?.data.customSections ?? [])"
      :key="sec.id"
      class="custom-item"
    >
      <div class="custom-item-head">
        <input
          class="custom-title"
          :value="sec.title"
          placeholder="区块标题，如：证书资质"
          @input="updateTitle(idx, ($event.target as HTMLInputElement).value)"
        />
        <button class="remove-btn" aria-label="删除自定义区块" @click="tabs.removeCustomSection(idx)">×</button>
      </div>
      <textarea
        class="custom-content"
        :value="sec.content"
        placeholder="区块内容，支持多行文本"
        rows="3"
        @input="updateContent(idx, ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
    <button class="add-btn" @click="tabs.addCustomSection()">+ 添加自定义区块</button>
  </section>
</template>

<style scoped>
.custom-hint { margin: -6px 0 10px; font-size: 12px; color: #999; }
.custom-item {
  margin-bottom: 10px; padding: 8px;
  background: #f9f9f9; border-radius: 4px; border: 1px solid #f0f0f0;
}
.custom-item-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.custom-title {
  flex: 1; padding: 5px 8px;
  border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 13px; outline: none; font-family: inherit;
}
.custom-title:focus { border-color: #1890ff; }
.custom-content {
  width: 100%; padding: 6px 8px;
  border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 13px; line-height: 1.5; resize: vertical; outline: none; font-family: inherit;
}
.custom-content:focus { border-color: #1890ff; }
</style>
