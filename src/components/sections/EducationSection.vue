<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { Education } from '@/types/resume';

const tabs = useTabsStore();

function updateField<K extends keyof Education>(idx: number, field: K, value: Education[K]) {
  if (!tabs.active) return;
  tabs.active.data.education[idx][field] = value;
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
          <span class="drag-handle" aria-label="拖拽以调整教育背景顺序" role="button"><AppIcon name="drag" /></span>
          <input :value="element.school" placeholder="学校名称" :aria-label="`教育 ${index + 1} 学校`" @input="updateField(index, 'school', ($event.target as HTMLInputElement).value)" />
          <input :value="element.major" placeholder="专业" :aria-label="`教育 ${index + 1} 专业`" @input="updateField(index, 'major', ($event.target as HTMLInputElement).value)" />
          <input :value="element.degree" placeholder="学位（如：本科）" :aria-label="`教育 ${index + 1} 学位`" @input="updateField(index, 'degree', ($event.target as HTMLInputElement).value)" />
          <input :value="element.time" placeholder="时间（如 2015-2019）" :aria-label="`教育 ${index + 1} 时间`" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" />
          <button class="remove-btn" :aria-label="`删除教育 ${element.school || index + 1}`" title="删除" @click="remove(index)"><AppIcon name="trash" /></button>
        </div>
      </template>
      <template #footer>
        <button class="add-btn" aria-label="添加教育背景" @click="add"><AppIcon name="plus" /> 添加教育背景</button>
      </template>
    </DraggableList>
  </section>
</template>

<style scoped>
.edu-edit-row {
  display: grid; grid-template-columns: 24px 1.2fr 1fr 0.8fr 1fr 32px;
  gap: 6px; align-items: center; margin-bottom: 6px;
}
.edu-edit-row input {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none;
}
.edu-edit-row input:focus { border-color: #1890ff; }
</style>
