<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { useSettingsStore } from '@/stores/settings';
import { analyzeJdMatch } from '@/utils/jdMatch';
import { analyzeJdWithAi } from '@/utils/ai/jdAnalysis';
import type { JdAiAnalysis } from '@/utils/ai/jdAnalysis';
import { SECTION_LABELS } from '@/types/resume';
import type { SectionKey } from '@/types/resume';
import { toErrorMessage } from '@/utils/errors';

const tabs = useTabsStore();
const ui = useUiStore();
const settings = useSettingsStore();

const expanded = ref(false);
const draft = ref('');

const savedJd = computed(() => tabs.active?.targetJd ?? '');
const result = computed(() => {
  if (!tabs.active || !savedJd.value.trim()) return null;
  return analyzeJdMatch(savedJd.value, tabs.active.data);
});

// —— AI 深度分析（可选，未配置 AI 时不出现任何入口） ——
const aiAnalysis = ref<JdAiAnalysis | null>(null);
const aiLoading = ref(false);

watch(
  () => tabs.active?.id,
  () => {
    draft.value = savedJd.value;
    aiAnalysis.value = null;
  },
  { immediate: true },
);

function analyze() {
  if (!tabs.active) return;
  const jd = draft.value.trim();
  if (!jd) {
    ui.toastWarning('请先粘贴岗位 JD');
    return;
  }
  tabs.setTargetJd(jd);
  if (result.value && result.value.total === 0) {
    ui.toastWarning('没有识别到明确技能关键词，可以补充更具体的 JD 描述');
  }
}

async function runAiAnalysis() {
  const config = settings.requireAiConfig();
  if (!config || !tabs.active || !savedJd.value.trim()) return;
  aiLoading.value = true;
  try {
    aiAnalysis.value = await analyzeJdWithAi(config, savedJd.value, tabs.active.data);
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  } finally {
    aiLoading.value = false;
  }
}

function clear() {
  draft.value = '';
  tabs.setTargetJd('');
  aiAnalysis.value = null;
}

function scoreGrade(score: number): string {
  if (score >= 80) return 'good';
  if (score >= 60) return 'ok';
  return 'low';
}

const IMPACT_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };

/** 复用健康度建议的定位机制：滚动并闪烁对应编辑区块 */
function focusSection(target: SectionKey) {
  const el = document.querySelector<HTMLElement>(`[data-health-target="${target}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('health-flash');
    window.setTimeout(() => el.classList.remove('health-flash'), 1200);
  }
}
</script>

<template>
  <section class="jd-card">
    <button class="jd-header" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="jd-title">
        <span class="jd-icon">◎</span>
        岗位匹配
        <span v-if="result" class="jd-score" :class="scoreGrade(result.score)">{{ result.score }}</span>
      </span>
      <span class="jd-sub">
        {{ result ? `${result.matched.length}/${result.total} 个关键词命中` : '粘贴 JD，看看还差什么' }}
      </span>
      <span class="jd-toggle" :class="{ collapsed: !expanded }" aria-hidden="true" />
    </button>

    <div v-show="expanded" class="jd-body">
      <textarea
        v-model="draft"
        class="jd-input"
        rows="4"
        placeholder="粘贴目标岗位的 JD / 职位描述（可只保留职责与要求部分）"
        aria-label="目标岗位 JD"
      />
      <div class="jd-actions">
        <button class="jd-btn primary" :disabled="!draft.trim()" @click="analyze">分析匹配度</button>
        <button
          v-if="settings.aiReady"
          class="jd-btn ai-btn"
          :disabled="!savedJd.trim() || aiLoading"
          title="AI 语义分析：缺什么能力、建议怎么改（本地关键词匹配保持免费）"
          @click="runAiAnalysis"
        >
          {{ aiLoading ? 'AI 分析中…' : 'AI 深度分析' }}
        </button>
        <button v-if="savedJd" class="jd-btn" @click="clear">清空</button>
        <span class="jd-hint">{{ settings.aiReady ? '关键词匹配仅本地计算；AI 分析会把 JD 与简历发给你配置的服务商' : '仅本地计算，不会上传' }}</span>
      </div>

      <div v-if="result" class="jd-result">
        <div class="jd-bar">
          <div class="jd-bar-fill" :class="scoreGrade(result.score)" :style="{ width: result.score + '%' }" />
        </div>

        <p v-if="result.total === 0" class="jd-empty">
          JD 里没有识别到明确技能关键词，试试补充更具体的描述。
        </p>
        <template v-else>
          <p class="jd-summary">
            JD 共识别 <strong>{{ result.total }}</strong> 个关键词，简历覆盖
            <strong>{{ result.matched.length }}</strong> 个。
            <span v-if="result.score < 60">建议优先补齐下方缺失项，或在经历中补充对应场景。</span>
            <span v-else-if="result.score < 80">再补 2–3 个关键词，匹配度会明显提升。</span>
            <span v-else>匹配度不错，重点检查关键词是否写在具体经历里。</span>
          </p>

          <div v-if="result.missing.length" class="jd-group">
            <span class="jd-label">JD 提到、简历没写</span>
            <div class="jd-chips">
              <span v-for="k in result.missing" :key="k" class="chip missing">{{ k }}</span>
            </div>
          </div>

          <div v-if="result.matched.length" class="jd-group">
            <span class="jd-label">已覆盖</span>
            <div class="jd-chips">
              <span v-for="k in result.matched" :key="k" class="chip matched">{{ k }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- AI 语义分析结果：与本地分数互补，不给数字结论 -->
      <div v-if="aiAnalysis" class="ai-result">
        <div class="ai-result-head">
          <span class="ai-badge">AI</span>
          <span class="ai-summary">{{ aiAnalysis.summary }}</span>
        </div>

        <div v-if="aiAnalysis.missingConcepts.length" class="jd-group">
          <span class="jd-label">JD 要求、简历语义上缺失</span>
          <div class="jd-chips">
            <span v-for="k in aiAnalysis.missingConcepts" :key="k" class="chip missing">{{ k }}</span>
          </div>
        </div>

        <div v-if="aiAnalysis.strengths.length" class="jd-group">
          <span class="jd-label">已对齐的优势</span>
          <div class="jd-chips">
            <span v-for="k in aiAnalysis.strengths" :key="k" class="chip matched">{{ k }}</span>
          </div>
        </div>

        <div v-if="aiAnalysis.suggestions.length" class="jd-group">
          <span class="jd-label">修改建议（点击定位到区块）</span>
          <ul class="ai-suggestions">
            <li
              v-for="(s, i) in aiAnalysis.suggestions"
              :key="i"
              class="ai-suggestion"
              role="button"
              tabindex="0"
              @click="focusSection(s.section)"
              @keydown.enter.prevent="focusSection(s.section)"
            >
              <span class="ai-sug-meta">
                <span class="ai-sug-section">{{ SECTION_LABELS[s.section] }}</span>
                <span class="ai-sug-impact" :class="s.impact">{{ IMPACT_LABELS[s.impact] }}优先</span>
              </span>
              <span class="ai-sug-issue">{{ s.issue }}</span>
              <span v-if="s.rewrite" class="ai-sug-rewrite">示例：{{ s.rewrite }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.jd-card {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8; border-radius: 6px; overflow: hidden;
  background: #fff;
}
.jd-header {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 12px;
  background: transparent; border: none; cursor: pointer;
  font: inherit; text-align: left;
}
.jd-header:hover { background: #fafafa; }
.jd-title {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #333;
  white-space: nowrap;
}
.jd-icon { color: #722ed1; }
.jd-score {
  padding: 1px 8px; border-radius: 10px; color: #fff; font-size: 11px;
}
.jd-score.good { background: #52c41a; }
.jd-score.ok { background: #1890ff; }
.jd-score.low { background: #fa8c16; }
.jd-sub { flex: 1; font-size: 11px; color: #999; text-align: right; }
.jd-toggle {
  width: 0; height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #999;
  transition: transform 0.2s ease;
}
.jd-toggle.collapsed { transform: rotate(-90deg); }

.jd-body { padding: 0 12px 12px; }
.jd-input {
  width: 100%; box-sizing: border-box; resize: vertical;
  padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 12px; line-height: 1.6; font-family: inherit; outline: none;
}
.jd-input:focus { border-color: #722ed1; }
.jd-actions {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
}
.jd-btn {
  padding: 5px 12px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; font-size: 12px; color: #555; cursor: pointer;
}
.jd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.jd-btn.primary { background: #722ed1; border-color: #722ed1; color: #fff; }
.jd-btn.primary:hover:not(:disabled) { background: #9254de; }
.jd-btn.ai-btn { border-color: #d3adf7; color: #722ed1; }
.jd-btn.ai-btn:hover:not(:disabled) { background: #f9f0ff; }
.jd-hint { margin-left: auto; font-size: 10px; color: #bbb; max-width: 46%; text-align: right; }

.jd-result { margin-top: 12px; }
.jd-bar { height: 6px; background: #f0f0f0; border-radius: 3px; overflow: hidden; }
.jd-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
.jd-bar-fill.good { background: #52c41a; }
.jd-bar-fill.ok { background: #1890ff; }
.jd-bar-fill.low { background: #fa8c16; }
.jd-summary { margin: 8px 0 10px; font-size: 11px; line-height: 1.7; color: #666; }
.jd-summary strong { color: #333; }
.jd-group { margin-bottom: 8px; }
.jd-label { display: block; font-size: 10px; color: #999; margin-bottom: 4px; }
.jd-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  padding: 1px 7px; border-radius: 10px; font-size: 10px; line-height: 18px;
}
.chip.missing { background: #fff2e8; color: #d4380d; }
.chip.matched { background: #f6ffed; color: #389e0d; }
.jd-empty { margin: 8px 0 0; font-size: 11px; color: #999; }

/* —— AI 分析结果 —— */
.ai-result {
  margin-top: 12px; padding: 10px;
  border: 1px dashed #d3adf7; border-radius: 6px; background: #faf5ff;
}
.ai-result-head { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px; }
.ai-badge {
  flex-shrink: 0; padding: 1px 7px; border-radius: 10px;
  background: #722ed1; color: #fff; font-size: 10px; font-weight: 700;
}
.ai-summary { font-size: 11px; line-height: 1.7; color: #4a3a66; }
.ai-suggestions { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.ai-suggestion {
  display: flex; flex-direction: column; gap: 3px;
  padding: 6px 8px; background: #fff; border: 1px solid #efdbff; border-radius: 5px;
  cursor: pointer; font-size: 11px; line-height: 1.6;
}
.ai-suggestion:hover { border-color: #b37feb; }
.ai-sug-meta { display: flex; align-items: center; gap: 6px; }
.ai-sug-section {
  padding: 0 6px; border-radius: 2px; background: #f5f0fa; color: #722ed1;
  font-size: 10px;
}
.ai-sug-impact { font-size: 10px; color: #999; }
.ai-sug-impact.high { color: #d4380d; }
.ai-sug-impact.medium { color: #d46b08; }
.ai-sug-impact.low { color: #8c8c8c; }
.ai-sug-issue { color: #444; }
.ai-sug-rewrite { color: #722ed1; }
</style>
