<script setup lang="ts">
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AutoTextarea from '@/components/AutoTextarea.vue';
import AppIcon from '@/components/AppIcon.vue';
import AiImproveButton from '@/components/AiImproveButton.vue';
import type { Experience } from '@/types/resume';

const tabs = useTabsStore();

function updateField<K extends keyof Experience>(idx: number, field: K, value: Experience[K]) {
  if (!tabs.active) return;
  tabs.active.data.experience[idx][field] = value;
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
            <span class="drag-handle" aria-label="拖拽以调整工作经历顺序" role="button"><AppIcon name="drag" /></span>
            <input :value="element.company" placeholder="公司名称" class="exp-input exp-company" :title="element.company" :aria-label="`工作经历 ${index + 1} 公司`" @input="updateField(index, 'company', ($event.target as HTMLInputElement).value)" />
            <AutoTextarea class="exp-role" :model-value="element.role" placeholder="职位" :aria-label="`工作经历 ${index + 1} 职位`" @update:model-value="updateField(index, 'role', $event)" />
            <input :value="element.time" placeholder="时间（如 2020.03-至今）" class="exp-input exp-time" :title="element.time" :aria-label="`工作经历 ${index + 1} 时间`" @input="updateField(index, 'time', ($event.target as HTMLInputElement).value)" />
            <button class="remove-btn" title="删除" :aria-label="`删除工作经历 ${element.company || index + 1}`" @click="remove(index)"><AppIcon name="trash" /></button>
          </div>
          <AutoTextarea
            class="exp-textarea"
            :model-value="element.description"
            placeholder="工作描述（一句话说明负责的业务与范围）"
            :rows="2"
            :aria-label="`工作经历 ${index + 1} 描述`"
            @update:model-value="updateField(index, 'description', $event)"
          />
          <div class="exp-items-block">
            <div class="exp-items-label">工作内容（拖拽排序）</div>
            <!-- DraggableList 的泛型约束 T extends {id:string}|string 导致 $event 推断为联合，
                 此处显式断言到精确类型 string[]（非 any），与 element.items 类型一致 -->
            <DraggableList :model-value="element.items" @update:model-value="updateField(index, 'items', $event as string[])">
              <template #item="{ element: line, index: lineIdx }">
                <div class="exp-item-row">
                  <span class="drag-handle" aria-label="拖拽以调整工作内容顺序" role="button"><AppIcon name="drag" /></span>
                  <AutoTextarea
                    class="exp-item-input"
                    :model-value="line"
                    placeholder="用 STAR 法则描述：行动+技术+量化"
                    :aria-label="`工作经历 ${index + 1} 第 ${lineIdx + 1} 条内容`"
                    @update:model-value="updateItem(index, lineIdx, $event)"
                  />
                  <AiImproveButton
                    :line="line"
                    :context="{ owner: `${element.company} · ${element.role}`, siblings: element.items }"
                    @apply="updateItem(index, lineIdx, $event)"
                  />
                  <button class="remove-btn" :aria-label="`删除第 ${lineIdx + 1} 条工作内容`" title="删除" @click="removeItem(index, lineIdx)"><AppIcon name="times" /></button>
                </div>
              </template>
              <template #footer>
                <button class="add-item-btn" aria-label="添加工作内容" @click="addItem(index)"><AppIcon name="plus" /> 添加工作内容</button>
              </template>
            </DraggableList>
          </div>
          <AutoTextarea
            class="exp-achievement-input"
            :model-value="element.achievement"
            placeholder="关键成果（如：缺陷逃逸率降低 40%）"
            :aria-label="`工作经历 ${index + 1} 关键成果`"
            @update:model-value="updateField(index, 'achievement', $event)"
          />
        </div>
      </template>
      <template #footer>
        <button class="add-btn" aria-label="添加工作经历" @click="add"><AppIcon name="plus" /> 添加工作经历</button>
      </template>
    </DraggableList>
  </section>
</template>

<style scoped>
.exp-edit-card {
  border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px;
  margin-bottom: 10px; background: #fafafa;
}
.exp-card-header {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 126px 28px;
  grid-template-areas:
    "drag company company del"
    "drag role    time    del";
  gap: 6px 8px;
  align-items: center;
  margin-bottom: 8px;
}
.exp-card-header .drag-handle { grid-area: drag; }
.exp-company { grid-area: company; }
.exp-role { grid-area: role; }
.exp-time { grid-area: time; }
.exp-card-header .remove-btn { grid-area: del; align-self: start; }

.exp-input {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none; font-family: inherit;
}
.exp-input:focus { border-color: #1890ff; }
.exp-items-block { margin-top: 8px; }
.exp-items-label { font-size: 11px; color: #888; margin-bottom: 4px; }
.exp-item-row {
  display: grid; grid-template-columns: 20px minmax(0, 1fr) 24px 24px;
  gap: 4px; align-items: start; margin-bottom: 6px;
}
/* 卡片内嵌按钮的紧凑尺寸覆盖（基础样式由 main.css 提供） */
.remove-btn { padding: 2px; font-size: 12px; }
.add-btn { margin-top: 4px; padding: 4px 10px; font-size: 11px; }
.exp-achievement-input { margin-top: 6px; }
</style>
