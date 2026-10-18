<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AutoTextarea from '@/components/AutoTextarea.vue';
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
          <AutoTextarea class="edu-school" :model-value="element.school" placeholder="学校名称" :aria-label="`教育 ${index + 1} 学校`" @update:model-value="updateField(index, 'school', $event)" />
          <AutoTextarea class="edu-major" :model-value="element.major" placeholder="专业" :aria-label="`教育 ${index + 1} 专业`" @update:model-value="updateField(index, 'major', $event)" />
          <input :value="element.degree" placeholder="学位" class="edu-degree" :title="element.degree" :aria-label="`教育 ${index + 1} 学位`" @input="updateField(index, 'degree', ($event.target as HTMLInputElement).value)" />
          <input :value="element.time" placeholder="时间（如 2015-2019）" class="edu-time" :title="element.time" :aria-label="`教育 ${index + 1} 时间`" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" />
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
  display: grid;
  grid-template-columns: 20px minmax(0, 1.2fr) minmax(0, 1fr) 100px 28px;
  grid-template-areas:
    "drag school school time   del"
    "drag major  major  degree del";
  gap: 6px 8px;
  align-items: center;
  margin-bottom: 8px;
}
.edu-edit-row .drag-handle { grid-area: drag; }
.edu-school { grid-area: school; }
.edu-major { grid-area: major; }
.edu-degree { grid-area: degree; }
.edu-time { grid-area: time; }
.edu-edit-row .remove-btn { grid-area: del; align-self: start; }

.edu-edit-row input {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none;
}
.edu-edit-row input:focus { border-color: #1890ff; }
</style>
