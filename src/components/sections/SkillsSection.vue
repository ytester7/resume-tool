<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import DraggableList from '@/components/DraggableList.vue';
import AutoTextarea from '@/components/AutoTextarea.vue';
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
          <span class="drag-handle" title="拖拽排序" aria-label="拖拽以调整技能顺序" role="button"><AppIcon name="drag" /></span>
          <input
            :value="element.category"
            placeholder="技能分类（如：自动化测试）"
            class="skill-cat-input"
            :title="element.category"
            :aria-label="`技能 ${index + 1} 分类`"
            @input="updateSkill(index, { category: ($event.target as HTMLInputElement).value })"
          />
          <select
            :value="element.level"
            class="skill-level-select"
            :aria-label="`技能 ${index + 1} 熟练度`"
            @change="updateSkill(index, { level: ($event.target as HTMLSelectElement).value as SkillLevel })"
          >
            <option v-for="lvl in LEVELS" :key="lvl" :value="lvl">{{ lvl }}</option>
          </select>
          <AutoTextarea
            class="skill-items-input"
            :model-value="element.items"
            placeholder="具体技能（如：Selenium、Playwright、pytest）"
            :aria-label="`技能 ${index + 1} 具体内容`"
            @update:model-value="updateSkill(index, { items: $event })"
          />
          <button class="remove-btn" title="删除" :aria-label="`删除技能 ${element.category || index + 1}`" @click="remove(index)"><AppIcon name="trash" /></button>
        </div>
      </template>
      <template #footer>
        <button class="add-btn" aria-label="添加技能" @click="add"><AppIcon name="plus" /> 添加技能</button>
      </template>
    </DraggableList>
  </section>
</template>

<style scoped>
.skill-edit-row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) 74px 28px;
  grid-template-areas:
    "drag cat   lvl   del"
    "drag items items del";
  gap: 6px 8px;
  align-items: center;
  margin-bottom: 8px;
}
.skill-edit-row .drag-handle { grid-area: drag; }
.skill-cat-input { grid-area: cat; }
.skill-level-select { grid-area: lvl; }
.skill-items-input { grid-area: items; }
.remove-btn { grid-area: del; align-self: start; }

.skill-edit-row input,
.skill-level-select {
  padding: 5px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; outline: none;
}
.skill-edit-row input:focus,
.skill-level-select:focus { border-color: #1890ff; }
</style>
