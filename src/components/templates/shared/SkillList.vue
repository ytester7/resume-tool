<script setup lang="ts">
import type { Skill } from '@/types/resume';

const props = defineProps<{
  skills: Skill[];
  variant?: 'compact' | 'list' | 'table' | 'bars';
}>();

const LEVEL_WIDTH: Record<string, string> = {
  '精通': '100%',
  '熟练': '70%',
  '了解': '40%',
};
</script>

<template>
  <div v-if="skills.length" :class="['skill-list', `variant-${props.variant || 'list'}`]">
    <div v-if="(props.variant || 'list') === 'compact'" class="skills-compact">
      <span v-for="s in skills" :key="s.id" class="skill-tag">
        <strong>{{ s.category }}：</strong>{{ s.items }}
      </span>
    </div>

    <div v-else-if="(props.variant || 'list') === 'list'" class="skills-list">
      <div v-for="s in skills" :key="s.id" class="skill-row">
        <span class="skill-category">{{ s.category }}</span>
        <span class="skill-items">{{ s.items }}</span>
        <span class="skill-level">{{ s.level }}</span>
      </div>
    </div>

    <table v-else-if="props.variant === 'table'" class="skills-table">
      <tbody>
        <tr v-for="s in skills" :key="s.id">
          <td class="skill-cat-cell">{{ s.category }}</td>
          <td>{{ s.items }}</td>
          <td class="skill-level-cell">{{ s.level }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="props.variant === 'bars'" class="skills-bars">
      <div v-for="s in skills" :key="s.id" class="skill-bar-row">
        <div class="skill-bar-header">
          <span class="skill-category">{{ s.category }}</span>
          <span class="skill-level">{{ s.level }}</span>
        </div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" :style="{ width: LEVEL_WIDTH[s.level] || '50%' }" />
        </div>
        <div class="skill-items">{{ s.items }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills-compact { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag { background: #f0f5ff; padding: 4px 10px; border-radius: 12px; font-size: 13px; }
.skill-tag strong { color: #1890ff; }

.skills-list { display: flex; flex-direction: column; gap: 6px; }
.skill-row { display: flex; gap: 12px; font-size: 13px; line-height: 1.6; }
.skill-category { min-width: 100px; font-weight: 600; color: #333; }
.skill-items { flex: 1; color: #555; }
.skill-level { color: #1890ff; font-size: 12px; }

.skills-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.skills-table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
.skill-cat-cell { font-weight: 600; min-width: 100px; }
.skill-level-cell { color: #1890ff; text-align: right; }

.skills-bars { display: flex; flex-direction: column; gap: 10px; }
.skill-bar-row { font-size: 13px; }
.skill-bar-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.skill-bar-track { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.skill-bar-fill { height: 100%; background: #1890ff; transition: width 0.3s; }
.skill-items { margin-top: 4px; color: #666; font-size: 12px; }
</style>
