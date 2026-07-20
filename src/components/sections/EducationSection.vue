<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { Education } from '@/types/resume';

const tabs = useTabsStore();

function updateField(idx: number, field: keyof Education, value: string) {
  if (!tabs.active) return;
  (tabs.active.data.education[idx] as any)[field] = value;
  tabs.active.dirty = true;
}

function remove(idx: number) { tabs.removeEducation(idx); }
function add() { tabs.addEducation(); }
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">教育背景</h3>
    <DraggableList :model-value="tabs.active?.data.education ?? []" @update:model-value="tabs.patchActive({ education: $event as Education[] })">
      <template #item="{ element, index }">
        <div class="edu-edit-row">
          <span class="drag-handle"><AppIcon name="drag" /></span>
          <input :value="element.school" @input="updateField(index, 'school', ($event.target as HTMLInputElement).value)" placeholder="学校名称" />
          <input :value="element.major" @input="updateField(index, 'major', ($event.target as HTMLInputElement).value)" placeholder="专业" />
          <input :value="element.degree" @input="updateField(index, 'degree', ($event.target as HTMLInputElement).value)" placeholder="学位（如：本科）" />
          <input :value="element.time" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" placeholder="时间（如 2015-2019）" />
          <button @click="remove(index)" class="remove-btn"><AppIcon name="trash" /></button>
        </div>
      </template>
      <template #footer>
        <button @click="add" class="add-btn"><AppIcon name="plus" /> 添加教育背景</button>
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
.edu-edit-row {
  display: grid; grid-template-columns: 24px 1.2fr 1fr 0.8fr 1fr 32px;
  gap: 6px; align-items: center; margin-bottom: 6px;
}
.drag-handle { cursor: grab; color: #bbb; display: flex; align-items: center; }
.edu-edit-row input {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none;
}
.edu-edit-row input:focus { border-color: #1890ff; }
.remove-btn {
  border: none; background: transparent; cursor: pointer;
  color: #ff4d4f; padding: 4px; font-size: 14px;
}
.add-btn {
  margin-top: 8px; padding: 6px 12px;
  border: 1px dashed #1890ff; background: #fff;
  color: #1890ff; cursor: pointer; border-radius: 4px;
  font-size: 12px; display: inline-flex; align-items: center; gap: 4px;
}
.add-btn:hover { background: #f0f5ff; }
:deep(.dragging) { opacity: 0.5; background: #e6f7ff; }
</style>
