<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { Project } from '@/types/resume';

const tabs = useTabsStore();

function updateField<K extends keyof Project>(idx: number, field: K, value: Project[K]) {
  if (!tabs.active) return;
  tabs.active.data.projects[idx][field] = value;
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
            <span class="drag-handle" aria-label="拖拽以调整项目经历顺序" role="button"><AppIcon name="drag" /></span>
            <input :value="element.name" placeholder="项目名称" class="proj-input" :aria-label="`项目经历 ${index + 1} 名称`" @input="updateField(index, 'name', ($event.target as HTMLInputElement).value)" />
            <input :value="element.role" placeholder="担任角色" class="proj-input" :aria-label="`项目经历 ${index + 1} 担任角色`" @input="updateField(index, 'role', ($event.target as HTMLInputElement).value)" />
            <input :value="element.time" placeholder="时间（如 2021.01-2021.12）" class="proj-input" :aria-label="`项目经历 ${index + 1} 时间`" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" />
            <button class="remove-btn" title="删除" :aria-label="`删除项目经历 ${element.name || index + 1}`" @click="remove(index)"><AppIcon name="trash" /></button>
          </div>
          <textarea :value="element.background" placeholder="项目背景与目标" rows="2" class="proj-textarea" :aria-label="`项目经历 ${index + 1} 背景与目标`" @input="updateField(index, 'background', ($event.target as HTMLTextAreaElement).value)" />
          <input :value="element.subtitle" placeholder="成果标题（如：自动化覆盖率提升至 80%）" class="proj-subtitle-input" :aria-label="`项目经历 ${index + 1} 成果标题`" @input="updateField(index, 'subtitle', ($event.target as HTMLInputElement).value)" />
          <div class="proj-items-block">
            <div class="proj-items-label">项目内容（拖拽排序）</div>
            <!-- DraggableList 的泛型约束 T extends {id:string}|string 导致 $event 推断为联合，
                 此处显式断言到精确类型 string[]（非 any），与 element.items 类型一致 -->
            <DraggableList :model-value="element.items" @update:model-value="updateField(index, 'items', $event as string[])">
              <template #item="{ element: line, index: lineIdx }">
                <div class="proj-item-row">
                  <span class="drag-handle" aria-label="拖拽以调整项目内容顺序" role="button"><AppIcon name="drag" /></span>
                  <input :value="line" placeholder="用 STAR 法则描述：行动+技术+量化" class="proj-item-input" :aria-label="`项目经历 ${index + 1} 第 ${lineIdx + 1} 条内容`" @input="updateItem(index, lineIdx, ($event.target as HTMLInputElement).value)" />
                  <button class="remove-btn" :aria-label="`删除第 ${lineIdx + 1} 条项目内容`" title="删除" @click="removeItem(index, lineIdx)"><AppIcon name="times" /></button>
                </div>
              </template>
              <template #footer>
                <button class="add-item-btn" aria-label="添加项目内容" @click="addItem(index)"><AppIcon name="plus" /> 添加项目内容</button>
              </template>
            </DraggableList>
          </div>
          <input :value="element.achievement" placeholder="关键成果量化" class="proj-achievement-input" :aria-label="`项目经历 ${index + 1} 关键成果`" @input="updateField(index, 'achievement', ($event.target as HTMLInputElement).value)" />
        </div>
      </template>
      <template #footer>
        <button class="add-btn" aria-label="添加项目经历" @click="add"><AppIcon name="plus" /> 添加项目经历</button>
      </template>
    </DraggableList>
  </section>
</template>

<style scoped>
.proj-edit-card {
  border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px;
  margin-bottom: 10px; background: #fafafa;
}
.proj-card-header {
  display: grid; grid-template-columns: 24px 1fr 1fr 1fr 32px;
  gap: 6px; align-items: center; margin-bottom: 8px;
}
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
/* 卡片内嵌按钮的紧凑尺寸覆盖（基础样式由 main.css 提供） */
.remove-btn { padding: 2px; font-size: 12px; }
.add-btn { margin-top: 4px; padding: 4px 10px; font-size: 11px; }
.proj-achievement-input { width: 100%; margin-top: 6px; }
</style>
