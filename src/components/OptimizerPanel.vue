<script lang="ts">
import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

/** 打开简历优化工程师的注入键（App 提供；JdMatchSection 等深层组件消费） */
export const OPEN_OPTIMIZER_KEY: InjectionKey<(jd: string, label: string) => void> = Symbol('open-optimizer');
export const useOpenOptimizer = () => inject(OPEN_OPTIMIZER_KEY, () => undefined, false);
export const provideOpenOptimizer = (fn: (jd: string, label: string) => void) => provide(OPEN_OPTIMIZER_KEY, fn);
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { useMaterialsStore } from '@/stores/materials';
import { analyzeGaps, collectMaterial, generateOptimizerProposals } from '@/utils/ai/optimizer';
import type { OptimizerAnalysis, OptimizerGap, OptimizerMaterial } from '@/utils/ai/optimizer';
import { applyProposal } from '@/utils/ai/proposals';
import { toErrorMessage } from '@/utils/errors';
import AppIcon from './AppIcon.vue';
import ProposalCard from './ProposalCard.vue';
import type { UiProposal } from './ProposalCard.vue';

/**
 * 简历优化工程师（向导式）：
 * 差距分析 → 素材访谈（向用户提问真实工作情况，绝不编造）→ 优化提案（逐条采纳）。
 * 会话保存在内存中，关闭即丢弃；所有 AI 调用均由用户显式点击触发。
 */

const props = defineProps<{
  /** 预置岗位（从投递台账/JD 匹配进入时携带） */
  presetJd?: string;
  presetLabel?: string;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const settings = useSettingsStore();
const tabs = useTabsStore();
const ui = useUiStore();
const materials = useMaterialsStore();

/** 素材库折叠区开关 */
const libraryOpen = ref(false);

type Step = 'confirm' | 'analysis' | 'interview' | 'proposals';

const step = ref<Step>('confirm');
const jdText = ref(props.presetJd ?? '');
const label = ref(props.presetLabel ?? '');

const analyzing = ref(false);
const analysis = ref<OptimizerAnalysis | null>(null);

interface GapState {
  answer: string;
  followUp?: string;
  followUpAnswer: string;
  material?: string;
  enough?: boolean;
  submitting: boolean;
  skipped: boolean;
}

const gapStates = ref<Record<string, GapState>>({});

const generating = ref(false);
const optimizerReply = ref('');
const proposals = ref<UiProposal[]>([]);

const GAP_KIND_LABELS: Record<OptimizerGap['kind'], string> = {
  polish: '可直接强化',
  'needs-material': '需补充真实素材',
};

const needsMaterialGaps = computed(() =>
  (analysis.value?.gaps ?? []).filter((g) => g.kind === 'needs-material' && g.question),
);

const readyToGenerate = computed(() => step.value === 'interview'
  && needsMaterialGaps.value.every((g) => {
    const s = gapStates.value[g.id];
    return !s || s.enough || s.skipped;
  }),
);

const answeredMaterials = computed<OptimizerMaterial[]>(() => {
  const out: OptimizerMaterial[] = [];
  for (const g of analysis.value?.gaps ?? []) {
    const s = gapStates.value[g.id];
    if (s?.material && s.enough && !s.skipped) out.push({ topic: g.topic, material: s.material });
  }
  return out;
});

function gapState(gap: OptimizerGap): GapState {
  if (!gapStates.value[gap.id]) {
    gapStates.value[gap.id] = { answer: '', followUpAnswer: '', submitting: false, skipped: false };
  }
  return gapStates.value[gap.id];
}

/** 第一步：差距分析（显式点击触发） */
async function runAnalysis(): Promise<void> {
  const config = settings.requireAiConfig();
  const tab = tabs.active;
  if (!config || !tab) return;
  if (jdText.value.trim().length < 20) {
    ui.toastWarning('JD 内容过少，请补充岗位描述');
    return;
  }
  analyzing.value = true;
  try {
    analysis.value = await analyzeGaps(config, { jd: jdText.value, data: tab.data });
    step.value = 'interview';
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  } finally {
    analyzing.value = false;
  }
}

/** 第二步：提交某个差距的真实情况回答 */
async function submitAnswer(gap: OptimizerGap): Promise<void> {
  const config = settings.requireAiConfig();
  if (!config || !gap.question) return;
  const s = gapState(gap);

  const isFirstRound = !s.followUp;
  const answer = isFirstRound ? s.answer : s.followUpAnswer;
  if (!answer.trim()) {
    ui.toastWarning('请先描述你的实际情况');
    return;
  }
  s.submitting = true;
  try {
    const result = await collectMaterial(config, {
      jd: jdText.value,
      topic: gap.topic,
      question: isFirstRound ? gap.question : s.followUp ?? gap.question,
      answer,
      // 追问额度：首轮答完还剩一次追问机会
      allowFollowUp: isFirstRound,
    });
    if (result.enough) {
      s.enough = true;
      s.material = result.material;
      s.followUp = undefined;
      // 沉淀进个人素材库：换岗位可直接带入，不必重答
      if (!result.material.includes('（用户无相关经验）')) {
        materials.upsert(gap.topic, result.material);
      }
    } else if (result.followUp) {
      s.followUp = result.followUp;
      s.followUpAnswer = '';
    } else {
      // 不够又没追问（异常路径）：保留原文兜底
      s.enough = true;
      s.material = answer.slice(0, 300);
    }
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  } finally {
    s.submitting = false;
  }
}

/** 从素材库带入：把既有素材填进回答框（用户过目后仍需手动提交，保持人在环） */
function fillFromLibrary(gap: OptimizerGap): void {
  const hit = materials.findByTopic(gap.topic);
  if (!hit) return;
  const s = gapState(gap);
  if (s.followUp) s.followUpAnswer = hit.material;
  else s.answer = hit.material;
  ui.toastInfo(`已带入「${hit.topic}」的素材，请核对后提交`);
}

function skipGap(gap: OptimizerGap): void {
  const s = gapState(gap);
  s.skipped = true;
  s.enough = true;
  s.material = undefined;
}

/** 第三步：生成提案 */
async function runGenerate(): Promise<void> {
  const config = settings.requireAiConfig();
  const tab = tabs.active;
  if (!config || !tab || !readyToGenerate.value) return;
  generating.value = true;
  try {
    const turn = await generateOptimizerProposals(config, {
      jd: jdText.value,
      data: tab.data,
      materials: answeredMaterials.value,
    });
    optimizerReply.value = turn.reply;
    proposals.value = turn.proposals
      .filter((p) => p.status !== 'duplicate' && p.status !== 'no-change')
      .map((p) => ({ ...p, ui: 'idle' as const }));
    step.value = 'proposals';
  } catch (e) {
    ui.toastError(toErrorMessage(e));
  } finally {
    generating.value = false;
  }
}

/** 采纳提案：与 AI 助手同一机制（内容校验 + 整体替换 = 独立撤销步） */
function acceptProposal(index: number): void {
  const proposal = proposals.value[index];
  const tab = tabs.active;
  if (!proposal || !tab) return;
  const result = applyProposal(tab.data, proposal);
  if (result.ok) {
    tabs.replaceActive({ data: result.data });
    proposal.ui = 'accepted';
    ui.toastSuccess('已应用，可 Ctrl+Z 撤销');
  } else {
    proposal.ui = 'failed';
    ui.toastWarning(result.reason === 'stale' ? '原文已变化，请重新生成提案' : '该提案无法应用');
  }
}

function rejectProposal(index: number): void {
  const proposal = proposals.value[index];
  if (proposal) proposal.ui = 'rejected';
}

function restart(): void {
  step.value = 'confirm';
  analysis.value = null;
  gapStates.value = {};
  proposals.value = [];
  optimizerReply.value = '';
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="opt-backdrop" @click.self="emit('close')">
    <div class="opt-dialog" role="dialog" aria-modal="true" aria-labelledby="opt-title">
      <header class="opt-head">
        <div>
          <h3 id="opt-title"><AppIcon name="target" /> 简历优化工程师</h3>
          <p class="opt-sub">
            {{ label ? `目标岗位：${label} · ` : '' }}结合 JD 差距与你的真实工作情况定制简历；AI 只整理你说过的素材，绝不编造经历
          </p>
        </div>
        <button class="opt-close" type="button" aria-label="关闭" @click="emit('close')">×</button>
      </header>

      <div class="opt-body">
        <!-- 第一步：确认 JD 并开始分析 -->
        <section v-if="step === 'confirm'" class="opt-step">
          <label class="opt-label" for="opt-jd">目标岗位 JD</label>
          <textarea
            id="opt-jd"
            v-model="jdText"
            class="opt-textarea"
            rows="6"
            placeholder="粘贴目标岗位的 JD（也可从投递记录一键带入）"
          />
          <div class="opt-actions-row">
            <span class="opt-hint">点击开始后，JD 与简历将发送给你配置的 AI 服务商</span>
            <button class="opt-btn primary" type="button" :disabled="analyzing" @click="runAnalysis">
              <AppIcon v-if="analyzing" name="spinner" class="spin" />
              {{ analyzing ? '分析中…' : '开始差距分析' }}
            </button>
          </div>
        </section>

        <!-- 差距分析结果 -->
        <template v-if="step === 'interview' || step === 'proposals'">
          <section class="opt-card">
            <h4 class="opt-card-title">差距分析</h4>
            <p class="opt-summary">{{ analysis?.summary }}</p>
            <div v-if="analysis?.strengths.length" class="opt-chip-row">
              <span v-for="s in analysis.strengths" :key="s" class="chip matched">{{ s }}</span>
            </div>
          </section>

          <!-- 第二步：素材访谈 -->
          <section v-if="step === 'interview'" class="opt-step">
            <h4 class="opt-card-title">补充你的真实情况</h4>
            <p class="opt-hint">对简历缺失的差距点，用你的真实经历回答提问；AI 只会基于你的回答和简历原文生成内容。</p>

            <div v-for="gap in analysis?.gaps ?? []" :key="gap.id" class="opt-gap" :class="{ done: gapState(gap).enough }">
              <div class="opt-gap-head">
                <span class="opt-gap-topic">{{ gap.topic }}</span>
                <span class="opt-gap-kind" :class="gap.kind">{{ GAP_KIND_LABELS[gap.kind] }}</span>
              </div>

              <template v-if="gap.kind === 'polish'">
                <p class="opt-hint">简历里已有素材，生成提案时会直接强化表达。</p>
              </template>

              <template v-else-if="gap.question">
                <p class="opt-question">问：{{ gapState(gap).followUp ?? gap.question }}</p>

                <div v-if="!gapState(gap).enough" class="opt-answer-row">
                  <textarea
                    v-if="!gapState(gap).followUp"
                    v-model="gapState(gap).answer"
                    class="opt-textarea small"
                    rows="3"
                    placeholder="按你的实际情况回答，如：我在 XX 项目里做过…（没接触过也可以直说）"
                    :aria-label="`${gap.topic} 的真实情况`"
                  />
                  <textarea
                    v-else
                    v-model="gapState(gap).followUpAnswer"
                    class="opt-textarea small"
                    rows="3"
                    :placeholder="`补充回答追问：${gapState(gap).followUp}`"
                    :aria-label="`${gap.topic} 的追问回答`"
                  />
                  <div class="opt-actions-row">
                    <button
                      v-if="materials.findByTopic(gap.topic)"
                      class="opt-btn library-btn"
                      type="button"
                      :title="`素材库里有「${materials.findByTopic(gap.topic)!.topic}」的记录，点击带入后仍需你核对提交`"
                      @click="fillFromLibrary(gap)"
                    >从素材库带入</button>
                    <button
                      class="opt-btn primary"
                      type="button"
                      :disabled="gapState(gap).submitting"
                      @click="submitAnswer(gap)"
                    >
                      {{ gapState(gap).submitting ? '整理素材中…' : '提交' }}
                    </button>
                    <button class="opt-btn" type="button" @click="skipGap(gap)">跳过此差距</button>
                  </div>
                </div>

                <p v-else class="opt-material">
                  已记录素材：{{ gapState(gap).skipped ? '（已跳过，不参与提案）' : gapState(gap).material }}
                </p>
              </template>
            </div>

            <!-- 个人素材库：跨岗位复用的真实经历 -->
            <details class="opt-library" :open="libraryOpen" @toggle="libraryOpen = ($event.target as HTMLDetailsElement).open">
              <summary class="opt-library-head">我的素材库（{{ materials.entries.length }}）<span class="opt-hint inline">访谈沉淀的真实经历，新岗位可直接带入</span></summary>
              <div v-if="materials.entries.length" class="opt-library-list">
                <div v-for="m in materials.entries" :key="m.id" class="opt-library-item">
                  <div class="opt-library-meta">
                    <span class="opt-library-topic">{{ m.topic }}</span>
                    <button class="opt-btn tiny danger" type="button" :aria-label="`删除素材 ${m.topic}`" @click="materials.remove(m.id)">删除</button>
                  </div>
                  <p class="opt-library-text">{{ m.material }}</p>
                </div>
              </div>
              <p v-else class="opt-hint inline">暂无素材；完成一次访谈后会自动沉淀到这里。</p>
            </details>

            <div class="opt-actions-row footer">
              <span class="opt-hint">{{ answeredMaterials.length }} 条素材已就绪</span>
              <button class="opt-btn" type="button" @click="restart">重新分析</button>
              <button class="opt-btn primary" type="button" :disabled="!readyToGenerate || generating" @click="runGenerate">
                <AppIcon v-if="generating" name="spinner" class="spin" />
                {{ generating ? '生成提案中…' : '生成优化提案' }}
              </button>
            </div>
          </section>

          <!-- 第三步：提案 -->
          <section v-if="step === 'proposals'" class="opt-step">
            <h4 class="opt-card-title">优化提案</h4>
            <p class="opt-summary">{{ optimizerReply }}</p>
            <div v-if="proposals.length" class="proposal-list">
              <ProposalCard
                v-for="(p, i) in proposals"
                :key="i"
                :proposal="p"
                @accept="acceptProposal(i)"
                @reject="rejectProposal(i)"
              />
            </div>
            <p v-else class="opt-hint">这次没有可应用的提案：素材与简历内容可能已覆盖，或差距需要先补充经历再优化。</p>
            <div class="opt-actions-row footer">
              <button class="opt-btn" type="button" @click="restart">换个岗位再来</button>
              <button class="opt-btn primary" type="button" @click="emit('close')">完成</button>
            </div>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.opt-backdrop {
  position: fixed; inset: 0; z-index: 9995;
  background: rgba(16, 35, 59, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.opt-dialog {
  width: min(680px, 100%); max-height: 90vh;
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; overflow: hidden;
}
.opt-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 12px; border-bottom: 1px solid #f0f0f0;
}
.opt-head h3 {
  margin: 0 0 4px; font-size: 17px; color: #10233b;
  display: inline-flex; align-items: center; gap: 6px;
}
.opt-sub { margin: 0; font-size: 12px; color: #7b8a9c; line-height: 1.5; }
.opt-close {
  border: none; background: transparent; font-size: 22px; line-height: 1;
  color: #999; cursor: pointer; padding: 0 4px;
}
.opt-close:hover { color: #333; }

.opt-body { flex: 1; overflow: auto; padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 12px; }
.opt-step { display: flex; flex-direction: column; gap: 8px; }
.opt-label { font-size: 12px; color: #5b6b7f; }
.opt-textarea {
  width: 100%; box-sizing: border-box; resize: vertical;
  padding: 8px 10px; border: 1px solid #d9d9d9; border-radius: 6px;
  font-size: 12px; line-height: 1.6; font-family: inherit; outline: none;
}
.opt-textarea.small { font-size: 12px; }
.opt-textarea:focus { border-color: #1890ff; }
.opt-actions-row { display: flex; align-items: center; gap: 8px; }
.opt-actions-row.footer { margin-top: 6px; justify-content: flex-end; }
.opt-hint { flex: 1; font-size: 11px; color: #9aa7b6; line-height: 1.5; }
.opt-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border: 1px solid #d9d9d9; border-radius: 6px;
  background: #fff; color: #333; font-size: 12px; cursor: pointer;
}
.opt-btn:hover:not(:disabled) { border-color: #1890ff; color: #1890ff; }
.opt-btn.primary { background: #1890ff; border-color: #1890ff; color: #fff; }
.opt-btn.primary:hover:not(:disabled) { background: #40a9ff; color: #fff; }
.opt-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.opt-card {
  padding: 10px 12px; border: 1px solid #e8e8e8; border-radius: 8px; background: #fbfcfe;
}
.opt-card-title { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #10233b; }
.opt-summary { margin: 0; font-size: 12px; color: #4a5b70; line-height: 1.7; }
.opt-chip-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.chip { padding: 1px 8px; border-radius: 10px; font-size: 10px; line-height: 18px; }
.chip.matched { background: #f6ffed; color: #389e0d; }

.opt-gap {
  padding: 10px 12px; border: 1px solid #eef1f5; border-radius: 8px;
  display: flex; flex-direction: column; gap: 6px;
}
.opt-gap.done { background: #fafcff; }
.opt-gap-head { display: flex; align-items: center; gap: 8px; }
.opt-gap-topic { font-size: 13px; font-weight: 600; color: #10233b; }
.opt-gap-kind {
  padding: 0 7px; border-radius: 10px; font-size: 10px; line-height: 18px;
}
.opt-gap-kind.polish { background: #e6f4ff; color: #1677ff; }
.opt-gap-kind.needs-material { background: #fff7e6; color: #d46b08; }
.opt-question { margin: 0; font-size: 12px; color: #5b6b7f; line-height: 1.6; }
.opt-answer-row { display: flex; flex-direction: column; gap: 6px; }
.opt-material {
  margin: 0; padding: 6px 8px; border-radius: 4px;
  background: #f6ffed; color: #389e0d; font-size: 11px; line-height: 1.6;
}
.library-btn { border-color: #b37feb; color: #722ed1; }
.library-btn:hover { background: #f9f0ff; }
.opt-library { border: 1px dashed #d3adf7; border-radius: 8px; padding: 8px 12px; }
.opt-library-head {
  cursor: pointer; font-size: 12px; font-weight: 600; color: #5a3a8a;
  list-style: none; user-select: none; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.opt-library-head::-webkit-details-marker { display: none; }
.opt-library-head::before { content: '▸'; font-size: 10px; }
.opt-library[open] .opt-library-head::before { content: '▾'; }
.opt-hint.inline { flex: 1; font-weight: 400; }
.opt-library-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.opt-library-item { padding: 6px 8px; background: #faf5ff; border-radius: 6px; }
.opt-library-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.opt-library-topic { font-size: 11px; font-weight: 600; color: #722ed1; }
.opt-library-text { margin: 4px 0 0; font-size: 11px; color: #4a3a66; line-height: 1.6; }
.opt-btn.tiny { padding: 2px 8px; font-size: 10px; }
.opt-btn.tiny.danger { color: #ff4d4f; border-color: #ffccc7; }
.opt-btn.tiny.danger:hover { background: #fff2f0; }
.proposal-list { display: flex; flex-direction: column; gap: 8px; }

@media (max-width: 767px) {
  .opt-backdrop { padding: 10px; }
  .opt-dialog { max-height: 94vh; }
}
</style>
