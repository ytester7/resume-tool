<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { Experience } from '@/types/resume';

const tabs = useTabsStore();

function updateField(idx: number, field: keyof Experience, value: string) {
  if (!tabs.active) return;
  (tabs.active.data.experience[idx] as any)[field] = value;
  tabs.active.dirty = true;
}

function updateItem(expIdx: number, itemIdx: number, value: string) {
  if (!tabs.active) return;
  tabs.active.data.experience[expIdx].items[itemIdx] = value;
  tabs.active.dirty = true;
}

function addItem(expIdx: number) {
  if (!tabs.active) return;
  tabs.active.data.experience[expIdx].items.push('');
  tabs.active.dirty = true;
}

function removeItem(expIdx: number, itemIdx: number) {
  if (!tabs.active) return;
  tabs.active.data.experience[expIdx].items.splice(itemIdx, 1);
  tabs.active.dirty = true;
}

function remove(idx: number) {
  tabs.removeExperience(idx);
}

function add() {
  tabs.addExperience();
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">工作经历</h3>
    <DraggableList :model-value="tabs.active?.data.experience ?? []" @update:model-value="tabs.patchActive({ experience: $event as Experience[] })">
      <template #item="{ element, index }">
        <div class="exp-edit-card">
          <div class="exp-card-header">
            <span class="drag-handle"><AppIcon name="drag" /></span>
            <input :value="element.company" @input="updateField(index, 'company', ($event.target as HTMLInputElement).value)" placeholder="公司名称" class="exp-input" />
            <input :value="element.role" @input="updateField(index, 'role', ($event.target as HTMLInputElement).value)" placeholder="职位" class="exp-input" />
            <input :value="element.time" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" placeholder="时间（如 2020.03-至今）" class="exp-input" />
            <button @click="remove(index)" class="remove-btn" title="删除"><AppIcon name="trash" /></button>
          </div>
          <textarea :value="element.description" @input="updateField(index, 'description', ($event.target as HTMLTextAreaElement).value)" placeholder="工作描述" rows="2" class="exp-textarea" />
          <div class="exp-items-block">
            <div class="exp-items-label">工作内容（拖拽排序）</div>
            <DraggableList :model-value="element.items" @update:model-value="updateField(index, 'items', $event as any)">
              <template #item="{ element: line, index: lineIdx }">
                <div class="exp-item-row">
                  <span class="drag-handle"><AppIcon name="drag" /></span>
                  <input :value="line" @input="updateItem(index, lineIdx, ($event.target as HTMLInputElement).value)" placeholder="用 STAR 法则描述：行动+技术+量化" class="exp-item-input" />
                  <button @click="removeItem(index, lineIdx)" class="remove-btn"><AppIcon name="times" /></button>
                </div>
              </template>
              <template #footer>
                <button @click="addItem(index)" class="add-item-btn"><AppIcon name="plus" /> 添加工作内容</button>
              </template>
            </DraggableList>
          </div>
          <input :value="element.achievement" @input="updateField(index, 'achievement', ($event.target as HTMLInputElement).value)" placeholder="关键成果（如：缺陷逃逸率降低 40%）" class="exp-achievement-input" />
        </div>
      </template>
      <template #footer>
        <button @click="add" class="add-btn"><AppIcon name="plus" /> 添加工作经历</button>
      </template>
    </DraggableList>
  </section>
</template>

<style scoped>
.editor-section { margin-bottom: 24px; }
.section-heading {
  margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1890ff;
  padding-bottom: 6px; border-bottom: 1px solid #e8e8e8;
}
.exp-edit-card {
  border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px;
  margin-bottom: 10px; background: #fafafa;
}
.exp-card-header {
  display: grid; grid-template-columns: 24px 1fr 1fr 1fr 32px;
  gap: 6px; align-items: center; margin-bottom: 8px;
}
.drag-handle { cursor: grab; color: #bbb; display: flex; align-items: center; }
.drag-handle:active { cursor: grabbing; }
.exp-input, .exp-textarea, .exp-item-input, .exp-achievement-input {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none; font-family: inherit;
}
.exp-input:focus, .exp-textarea:focus, .exp-item-input:focus, .exp-achievement-input:focus {
  border-color: #1890ff;
}
.exp-textarea { width: 100%; resize: vertical; }
.exp-items-block { margin-top: 8px; }
.exp-items-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.exp-item-row {
  display: grid; grid-template-columns: 20px 1fr 24px;
  gap: 4px; align-items: center; margin-bottom: 4px;
}
.remove-btn {
  border: none; background: transparent; cursor: pointer;
  color: #ff4d4f; padding: 2px; font-size: 12px;
}
.add-item-btn, .add-btn {
  margin-top: 4px; padding: 4px 10px;
  border: 1px dashed #1890ff; background: #fff;
  color: #1890ff; cursor: pointer; border-radius: 4px;
  font-size: 11px; display: inline-flex; align-items: center; gap: 4px;
}
.add-item-btn:hover, .add-btn:hover { background: #f0f5ff; }
.exp-achievement-input { width: 100%; margin-top: 6px; }
:deep(.dragging) { opacity: 0.5; background: #e6f7ff; }
</style>
