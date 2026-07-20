<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { Skill, SkillLevel } from '@/types/resume';

const tabs = useTabsStore();

const skills = computed({
  get: () => tabs.active?.data.skills ?? [],
  set: (val: Skill[]) => tabs.patchActive({ skills: val }),
});

const LEVELS: SkillLevel[] = ['精通', '熟练', '了解'];

function updateSkill(idx: number, patch: Partial<Skill>) {
  if (!tabs.active) return;
  Object.assign(tabs.active.data.skills[idx], patch);
  tabs.active.dirty = true;
}

function remove(idx: number) {
  tabs.removeSkill(idx);
}

function add() {
  tabs.addSkill();
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">专业技能</h3>
    <DraggableList v-model="skills">
      <template #item="{ element, index }">
        <div class="skill-edit-row">
          <span class="drag-handle" title="拖拽排序"><AppIcon name="drag" /></span>
          <input
            :value="element.category"
            @input="updateSkill(index, { category: ($event.target as HTMLInputElement).value })"
            placeholder="技能分类（如：自动化测试）"
            class="skill-cat-input"
          />
          <input
            :value="element.items"
            @input="updateSkill(index, { items: ($event.target as HTMLInputElement).value })"
            placeholder="具体技能（如：Selenium, Playwright）"
            class="skill-items-input"
          />
          <select
            :value="element.level"
            @change="updateSkill(index, { level: ($event.target as HTMLSelectElement).value as SkillLevel })"
            class="skill-level-select"
          >
            <option v-for="lvl in LEVELS" :key="lvl" :value="lvl">{{ lvl }}</option>
          </select>
          <button @click="remove(index)" class="remove-btn" title="删除"><AppIcon name="trash" /></button>
        </div>
      </template>
      <template #footer>
        <button @click="add" class="add-btn"><AppIcon name="plus" /> 添加技能</button>
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
.skill-edit-row {
  display: grid; grid-template-columns: 24px 1fr 2fr 70px 32px;
  gap: 6px; align-items: center; margin-bottom: 6px;
}
.drag-handle { cursor: grab; color: #bbb; display: flex; align-items: center; }
.drag-handle:active { cursor: grabbing; }
.skill-edit-row input,
.skill-level-select {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none;
}
.skill-edit-row input:focus,
.skill-level-select:focus { border-color: #1890ff; }
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
