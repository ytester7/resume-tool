<script setup lang="ts">
import { useSectionOrder } from '@/composables/useSectionOrder';
import { SECTION_LABELS } from '@/types/resume';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import SummarySection from './sections/SummarySection.vue';
import SkillsSection from './sections/SkillsSection.vue';
import ExperienceSection from './sections/ExperienceSection.vue';
import ProjectsSection from './sections/ProjectsSection.vue';
import EducationSection from './sections/EducationSection.vue';
import EvaluationSection from './sections/EvaluationSection.vue';
import TemplateSection from './sections/TemplateSection.vue';
import DraggableList from './DraggableList.vue';
import AppIcon from './AppIcon.vue';

const { order, mutable, resetToDefault } = useSectionOrder();
</script>

<template>
  <div class="editor-panel">
    <!-- 区块顺序面板（仅支持的模板显示） -->
    <div v-if="mutable" class="section-order-panel">
      <div class="order-header">
        <h3 class="order-title">区块顺序</h3>
        <button @click="resetToDefault" class="reset-btn">恢复默认</button>
      </div>
      <DraggableList v-model="order">
        <template #item="{ element }">
          <div class="order-item">
            <span class="drag-handle"><AppIcon name="drag" /></span>
            <span>{{ (SECTION_LABELS as Record<string, string>)[element as string] }}</span>
          </div>
        </template>
      </DraggableList>
    </div>
    <div v-else class="section-order-disabled">
      当前模板不支持调整区块顺序
    </div>

    <!-- 编辑区块固定顺序：基本信息 → 模板 → 其他 -->
    <BasicInfoSection />
    <TemplateSection />
    <SummarySection />
    <SkillsSection />
    <ExperienceSection />
    <ProjectsSection />
    <EducationSection />
    <EvaluationSection />
  </div>
</template>

<style scoped>
.editor-panel {
  height: 100%; overflow: auto; padding: 16px;
  background: #fff;
}
.section-order-panel {
  margin-bottom: 20px; padding: 12px;
  background: #f9f9f9; border-radius: 6px;
}
.order-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.order-title { margin: 0; font-size: 13px; font-weight: 600; color: #333; }
.reset-btn {
  padding: 2px 8px; border: 1px solid #d9d9d9;
  background: #fff; cursor: pointer; border-radius: 3px;
  font-size: 11px; color: #666;
}
.reset-btn:hover { border-color: #1890ff; color: #1890ff; }
.order-item {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px; background: #fff; border: 1px solid #e8e8e8;
  border-radius: 3px; margin-bottom: 4px; font-size: 12px;
}
.drag-handle { cursor: grab; color: #bbb; display: flex; align-items: center; }
.drag-handle:active { cursor: grabbing; }
.section-order-disabled {
  margin-bottom: 20px; padding: 8px 12px;
  background: #fafafa; border-radius: 4px;
  font-size: 12px; color: #999; text-align: center;
}
:deep(.dragging) { opacity: 0.5; background: #e6f7ff; }
</style>
