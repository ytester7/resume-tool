<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { Project } from '@/types/resume';

const tabs = useTabsStore();

function updateField(idx: number, field: keyof Project, value: string) {
  if (!tabs.active) return;
  (tabs.active.data.projects[idx] as any)[field] = value;
  tabs.active.dirty = true;
}

function updateItem(projIdx: number, itemIdx: number, value: string) {
  if (!tabs.active) return;
  tabs.active.data.projects[projIdx].items[itemIdx] = value;
  tabs.active.dirty = true;
}

function addItem(projIdx: number) {
  if (!tabs.active) return;
  tabs.active.data.projects[projIdx].items.push('');
  tabs.active.dirty = true;
}

function removeItem(projIdx: number, itemIdx: number) {
  if (!tabs.active) return;
  tabs.active.data.projects[projIdx].items.splice(itemIdx, 1);
  tabs.active.dirty = true;
}

function remove(idx: number) {
  tabs.removeProject(idx);
}

function add() {
  tabs.addProject();
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">项目经历</h3>
    <DraggableList :model-value="tabs.active?.data.projects ?? []" @update:model-value="tabs.patchActive({ projects: $event as Project[] })">
      <template #item="{ element, index }">
        <div class="proj-edit-card">
          <div class="proj-card-header">
            <span class="drag-handle"><AppIcon name="drag" /></span>
            <input :value="element.name" @input="updateField(index, 'name', ($event.target as HTMLInputElement).value)" placeholder="项目名称" class="proj-input" />
            <input :value="element.role" @input="updateField(index, 'role', ($event.target as HTMLInputElement).value)" placeholder="担任角色" class="proj-input" />
            <input :value="element.time" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" placeholder="时间（如 2021.01-2021.12）" class="proj-input" />
            <button @click="remove(index)" class="remove-btn" title="删除"><AppIcon name="trash" /></button>
          </div>
          <textarea :value="element.background" @input="updateField(index, 'background', ($event.target as HTMLTextAreaElement).value)" placeholder="项目背景与目标" rows="2" class="proj-textarea" />
          <input :value="element.subtitle" @input="updateField(index, 'subtitle', ($event.target as HTMLInputElement).value)" placeholder="成果标题（如：自动化覆盖率提升至 80%）" class="proj-subtitle-input" />
          <div class="proj-items-block">
            <div class="proj-items-label">项目内容（拖拽排序）</div>
            <DraggableList :model-value="element.items" @update:model-value="updateField(index, 'items', $event as any)">
              <template #item="{ element: line, index: lineIdx }">
                <div class="proj-item-row">
                  <span class="drag-handle"><AppIcon name="drag" /></span>
                  <input :value="line" @input="updateItem(index, lineIdx, ($event.target as HTMLInputElement).value)" placeholder="用 STAR 法则描述：行动+技术+量化" class="proj-item-input" />
                  <button @click="removeItem(index, lineIdx)" class="remove-btn"><AppIcon name="times" /></button>
                </div>
              </template>
              <template #footer>
                <button @click="addItem(index)" class="add-item-btn"><AppIcon name="plus" /> 添加项目内容</button>
              </template>
            </DraggableList>
          </div>
          <input :value="element.achievement" @input="updateField(index, 'achievement', ($event.target as HTMLInputElement).value)" placeholder="关键成果量化" class="proj-achievement-input" />
        </div>
      </template>
      <template #footer>
        <button @click="add" class="add-btn"><AppIcon name="plus" /> 添加项目经历</button>
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
.proj-edit-card {
  border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px;
  margin-bottom: 10px; background: #fafafa;
}
.proj-card-header {
  display: grid; grid-template-columns: 24px 1fr 1fr 1fr 32px;
  gap: 6px; align-items: center; margin-bottom: 8px;
}
.drag-handle { cursor: grab; color: #bbb; display: flex; align-items: center; }
.drag-handle:active { cursor: grabbing; }
.proj-input, .proj-textarea, .proj-item-input, .proj-subtitle-input, .proj-achievement-input {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none; font-family: inherit;
}
.proj-input:focus, .proj-textarea:focus, .proj-item-input:focus, .proj-subtitle-input:focus, .proj-achievement-input:focus {
  border-color: #1890ff;
}
.proj-textarea { width: 100%; resize: vertical; }
.proj-subtitle-input { width: 100%; margin-top: 6px; }
.proj-items-block { margin-top: 8px; }
.proj-items-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.proj-item-row {
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
.proj-achievement-input { width: 100%; margin-top: 6px; }
:deep(.dragging) { opacity: 0.5; background: #e6f7ff; }
</style>
