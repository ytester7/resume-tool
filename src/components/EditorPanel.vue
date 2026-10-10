<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSectionOrder } from '@/composables/useSectionOrder';
import { useTabsStore } from '@/stores/tabs';
import { getSectionLabel } from '@/types/resume';
import type { SectionId, SectionKey } from '@/types/resume';
import { calcHealthScore, DIMENSION_MAX } from '@/utils/healthScore';
import type { DimensionKey } from '@/utils/healthScore';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import SummarySection from './sections/SummarySection.vue';
import SkillsSection from './sections/SkillsSection.vue';
import ExperienceSection from './sections/ExperienceSection.vue';
import ProjectsSection from './sections/ProjectsSection.vue';
import EducationSection from './sections/EducationSection.vue';
import EvaluationSection from './sections/EvaluationSection.vue';
import TemplateSection from './sections/TemplateSection.vue';
import CustomSectionsSection from './sections/CustomSectionsSection.vue';
import DraggableList from './DraggableList.vue';
import AppIcon from './AppIcon.vue';

const tabs = useTabsStore();
const { order, mutable, resetToDefault } = useSectionOrder();

// —— 简历健康度评分 ——
const expanded = ref(true);

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  completeness: '完整性',
  quantification: '量化度',
  richness: '充实度',
  keyword: '关键词',
  regularity: '规范性',
};

const DIMENSION_ORDER: DimensionKey[] = ['completeness', 'quantification', 'richness', 'keyword', 'regularity'];

const report = computed(() => {
  if (!tabs.active?.data) return null;
  return calcHealthScore(tabs.active.data);
});

function gradeClass(grade: string): string {
  return `grade-${grade}`;
}

function dimensionPercent(dim: DimensionKey): number {
  const v = report.value?.dimensions[dim] ?? 0;
  return Math.round((v / DIMENSION_MAX[dim]) * 100);
}

function focusSection(target?: SectionKey) {
  if (!target) return;
  const el = document.querySelector<HTMLElement>(`[data-health-target="${target}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('health-flash');
    window.setTimeout(() => el.classList.remove('health-flash'), 1200);
  }
}
</script>

<template>
  <div class="editor-panel">
    <!-- 健康度评分卡片 -->
    <section v-if="report" class="health-card" :class="gradeClass(report.grade)">
      <button class="health-header" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
        <div class="health-title">
          <span class="health-label">简历健康度</span>
          <span class="grade-badge" :class="gradeClass(report.grade)">{{ report.grade }}</span>
        </div>
        <div class="health-score">
          <span class="score-num">{{ report.total }}</span><span class="score-max">/100</span>
        </div>
        <span class="health-toggle" :class="{ collapsed: !expanded }" aria-hidden="true" />
      </button>

      <div v-show="expanded" class="health-body">
        <!-- 维度条 -->
        <div class="dimensions">
          <div v-for="dim in DIMENSION_ORDER" :key="dim" class="dim-row">
            <div class="dim-meta">
              <span class="dim-name">{{ DIMENSION_LABELS[dim] }}</span>
              <span class="dim-value">{{ report.dimensions[dim] }}/{{ DIMENSION_MAX[dim] }}</span>
            </div>
            <div class="dim-bar">
              <div class="dim-fill" :style="{ width: dimensionPercent(dim) + '%' }" />
            </div>
          </div>
        </div>

        <!-- 改进建议 -->
        <div v-if="report.suggestions.length > 0" class="suggestions">
          <h4 class="suggestions-title">改进建议 ({{ report.suggestions.length }})</h4>
          <ul class="suggestions-list">
            <li
              v-for="(s, i) in report.suggestions"
              :key="i"
              class="suggestion-item"
              :class="{ clickable: !!s.target }"
              :role="s.target ? 'button' : undefined"
              :tabindex="s.target ? 0 : undefined"
              @click="focusSection(s.target)"
              @keydown.enter.prevent="focusSection(s.target)"
            >
              <span class="suggestion-dim">{{ DIMENSION_LABELS[s.dimension] }}</span>
              <span class="suggestion-msg">{{ s.message }}</span>
            </li>
          </ul>
        </div>
        <p v-else class="suggestions-empty">简历已相当完善，无需特别改进。</p>
      </div>
    </section>

    <!-- 区块顺序面板（仅支持的模板显示） -->
    <div v-if="mutable" class="section-order-panel">
      <div class="order-header">
        <h3 class="order-title">区块顺序</h3>
        <button class="reset-btn" aria-label="恢复默认区块顺序" @click="resetToDefault">恢复默认</button>
      </div>
      <DraggableList v-model="order">
        <template #item="{ element }">
          <div class="order-item">
            <span class="drag-handle" aria-label="拖拽以调整顺序" role="button"><AppIcon name="drag" /></span>
            <span>{{ getSectionLabel(element as SectionId, tabs.active?.data.customSections) }}</span>
          </div>
        </template>
      </DraggableList>
    </div>
    <div v-else class="section-order-disabled" role="note">
      当前模板不支持调整区块顺序
    </div>

    <!-- 编辑区块固定顺序：基本信息 → 模板 → 其他 -->
    <div data-health-target="basic"><BasicInfoSection /></div>
    <TemplateSection />
    <div data-health-target="summary"><SummarySection /></div>
    <div data-health-target="skills"><SkillsSection /></div>
    <div data-health-target="experience"><ExperienceSection /></div>
    <div data-health-target="projects"><ProjectsSection /></div>
    <div data-health-target="education"><EducationSection /></div>
    <div data-health-target="evaluation"><EvaluationSection /></div>
    <CustomSectionsSection />
  </div>
</template>

<style scoped>
.editor-panel {
  height: 100%; overflow: auto; padding: 16px;
  background: #fff;
}

/* —— 健康度卡片 —— */
.health-card {
  margin-bottom: 16px; padding: 0;
  border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden;
  background: #fff;
}
.health-card.grade-优秀 { border-color: #52c41a; }
.health-card.grade-良好 { border-color: #1890ff; }
.health-card.grade-合格 { border-color: #faad14; }
.health-card.grade-待改进 { border-color: #ff4d4f; }

.health-header {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 10px 12px;
  background: transparent; border: none; cursor: pointer;
  font: inherit; text-align: left;
}
.health-header:hover { background: #fafafa; }
.health-title { flex: 1; display: flex; align-items: center; gap: 8px; }
.health-label { font-size: 13px; font-weight: 600; color: #333; }
.grade-badge {
  padding: 1px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
  color: #fff;
}
.grade-badge.grade-优秀 { background: #52c41a; }
.grade-badge.grade-良好 { background: #1890ff; }
.grade-badge.grade-合格 { background: #faad14; }
.grade-badge.grade-待改进 { background: #ff4d4f; }

.health-score { font-size: 16px; font-weight: 700; color: #333; }
.score-num { font-size: 22px; }
.score-max { font-size: 12px; color: #999; margin-left: 2px; }

.health-toggle {
  width: 0; height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #999;
  transition: transform 0.2s ease;
}
.health-toggle.collapsed { transform: rotate(-90deg); }

.health-body { padding: 4px 12px 12px; }

.dimensions { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.dim-row { display: flex; flex-direction: column; gap: 3px; }
.dim-meta { display: flex; justify-content: space-between; font-size: 11px; color: #666; }
.dim-value { color: #999; }
.dim-bar {
  height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden;
}
.dim-fill {
  height: 100%; background: #1890ff; border-radius: 3px;
  transition: width 0.3s ease;
}
.grade-优秀 .dim-fill { background: #52c41a; }
.grade-良好 .dim-fill { background: #1890ff; }
.grade-合格 .dim-fill { background: #faad14; }
.grade-待改进 .dim-fill { background: #ff4d4f; }

.suggestions { border-top: 1px solid #f0f0f0; padding-top: 8px; }
.suggestions-title { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #333; }
.suggestions-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.suggestion-item {
  display: flex; gap: 6px; padding: 4px 6px;
  font-size: 11px; line-height: 1.5; color: #555;
  border-radius: 3px;
}
.suggestion-item.clickable { cursor: pointer; }
.suggestion-item.clickable:hover { background: #f0f7ff; color: #1890ff; }
.suggestion-dim {
  flex-shrink: 0; padding: 0 5px; border-radius: 2px;
  background: #f5f5f5; color: #888; font-size: 10px;
  align-self: flex-start; margin-top: 1px;
}
.suggestion-msg { flex: 1; }
.suggestions-empty { margin: 0; padding: 8px 0; font-size: 12px; color: #999; text-align: center; }

/* 建议点击高亮闪烁 */
:deep([data-health-target].health-flash) {
  animation: health-flash 1.2s ease;
}
@keyframes health-flash {
  0%, 100% { background: transparent; }
  20%, 60% { background: #fff7e6; }
}

/* —— 区块顺序面板 —— */
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
.section-order-disabled {
  margin-bottom: 20px; padding: 8px 12px;
  background: #fafafa; border-radius: 4px;
  font-size: 12px; color: #999; text-align: center;
}

/* 窄屏：减小内边距，给编辑控件更多空间 */
@media (max-width: 767px) {
  .editor-panel { padding: 10px; }
}
</style>
