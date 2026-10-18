<script setup lang="ts">
import { computed } from 'vue';
import type { Skill } from '@/types/resume';
import { asText, visibleSkills } from '@/utils/resumeView';

const props = defineProps<{
  skills: Skill[];
  variant?: 'compact' | 'list' | 'table' | 'bars';
}>();

const LEVEL_WIDTH: Record<string, string> = {
  '精通': '100%',
  '熟练': '70%',
  '了解': '40%',
};

const currentVariant = computed(() => props.variant || 'list');

// 只有熟练度、没有分类/内容的技能视为空记录，不参与渲染
const view = computed(() =>
  visibleSkills(props.skills).map(skill => ({
    id: skill.id,
    category: asText(skill.category),
    items: asText(skill.items),
    level: asText(skill.level),
  })),
);

// 表格列按整份数据决定是否出现，避免每行缺字段导致列错位
const showCategory = computed(() => view.value.some(s => s.category));
const showItems = computed(() => view.value.some(s => s.items));
const showLevel = computed(() => view.value.some(s => s.level));

function levelWidth(level: string): string {
  return LEVEL_WIDTH[level] || '50%';
}
</script>

<template>
  <div v-if="view.length" :class="['skill-list', `variant-${currentVariant}`]">
    <div v-if="currentVariant === 'compact'" class="skills-compact">
      <span v-for="s in view" :key="s.id" class="skill-tag">
        <strong v-if="s.category">{{ s.category }}</strong><template v-if="s.category && s.items">：</template>{{ s.items }}
      </span>
    </div>

    <div v-else-if="currentVariant === 'list'" class="skills-list">
      <div v-for="s in view" :key="s.id" class="skill-row">
        <span v-if="s.category" class="skill-category">{{ s.category }}</span>
        <span v-if="s.items" class="skill-items">{{ s.items }}</span>
        <span v-if="s.level" class="skill-level">{{ s.level }}</span>
      </div>
    </div>

    <table v-else-if="currentVariant === 'table'" class="skills-table">
      <colgroup>
        <col v-if="showCategory" class="skill-col-category" />
        <col v-if="showItems" />
        <col v-if="showLevel" class="skill-col-level" />
      </colgroup>
      <tbody>
        <tr v-for="s in view" :key="s.id">
          <td v-if="showCategory" class="skill-cat-cell">{{ s.category }}</td>
          <td v-if="showItems">{{ s.items }}</td>
          <td v-if="showLevel" class="skill-level-cell">{{ s.level }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="currentVariant === 'bars'" class="skills-bars">
      <div v-for="s in view" :key="s.id" class="skill-bar-row">
        <div v-if="s.category || s.level" class="skill-bar-header">
          <span v-if="s.category" class="skill-category">{{ s.category }}</span>
          <span v-if="s.level" class="skill-level">{{ s.level }}</span>
        </div>
        <div v-if="s.level" class="skill-bar-track">
          <div class="skill-bar-fill" :style="{ width: levelWidth(s.level) }" />
        </div>
        <div v-if="s.items" class="skill-items">{{ s.items }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills-compact { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag { background: #f0f5ff; padding: 4px 10px; border-radius: 12px; font-size: 13px; overflow-wrap: anywhere; }
.skill-tag strong { color: var(--c-primary, #1890ff); }

.skills-list { display: flex; flex-direction: column; gap: 6px; }
.skill-row { display: flex; flex-wrap: wrap; gap: 2px 12px; font-size: 13px; line-height: 1.6; }
.skill-category { min-width: 100px; font-weight: 600; color: var(--c-text, #333); overflow-wrap: anywhere; }
.skill-items { flex: 1; min-width: 0; color: var(--c-text-muted, #555); overflow-wrap: anywhere; }
.skill-level { color: var(--c-primary, #1890ff); font-size: 12px; }

.skills-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
.skill-col-category { width: 120px; }
.skill-col-level { width: 64px; }
.skills-table td { padding: 6px 8px; border-bottom: 1px solid var(--c-border, #eee); overflow-wrap: anywhere; }
.skill-cat-cell { font-weight: 600; min-width: 100px; }
.skill-level-cell { color: var(--c-primary, #1890ff); text-align: right; }

.skills-bars { display: flex; flex-direction: column; gap: 10px; }
.skill-bar-row { font-size: 13px; }
.skill-bar-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.skill-bar-header .skill-level { margin-left: auto; }
.skill-bar-track { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.skill-bar-fill { height: 100%; background: var(--c-primary, #1890ff); transition: width 0.3s; }
.skill-items { margin-top: 4px; color: var(--c-text-muted, #666); font-size: 12px; overflow-wrap: anywhere; }
</style>
