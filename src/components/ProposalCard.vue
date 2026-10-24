<script setup lang="ts">
import { computed } from 'vue';
import type { ResolvedProposal } from '@/utils/ai/proposals';

/**
 * 段落提案卡片（AI 助手与简历优化工程师共用）。
 * UI 状态由父组件持有（accepted/rejected/failed），本组件只负责展示与转发动作。
 */
export type ProposalUi = 'idle' | 'accepted' | 'rejected' | 'failed';
export type UiProposal = ResolvedProposal & { ui: ProposalUi };

const props = defineProps<{ proposal: UiProposal }>();
const emit = defineEmits<{ (e: 'accept'): void; (e: 'reject'): void }>();

const actionable = computed(() =>
  props.proposal.ui === 'idle' && props.proposal.status === 'pending',
);
</script>

<template>
  <div class="proposal-card" :class="proposal.ui">
    <div class="proposal-meta">
      <span class="proposal-loc">{{ proposal.passage?.location ?? '位置已失效' }}</span>
      <span v-if="proposal.add" class="proposal-add">新增条目</span>
    </div>
    <p v-if="proposal.passage?.text" class="proposal-before">{{ proposal.passage.text }}</p>
    <p class="proposal-after">{{ proposal.after }}</p>
    <p v-if="proposal.why" class="proposal-why">{{ proposal.why }}</p>
    <div v-if="actionable" class="proposal-actions">
      <button class="proposal-btn primary" type="button" @click="emit('accept')">采纳</button>
      <button class="proposal-btn" type="button" @click="emit('reject')">忽略</button>
    </div>
    <span v-else-if="proposal.ui === 'accepted'" class="proposal-state ok">已采纳</span>
    <span v-else-if="proposal.ui === 'rejected'" class="proposal-state">已忽略</span>
    <span v-else-if="proposal.ui === 'failed'" class="proposal-state bad">应用失败（原文已变化）</span>
    <span v-else-if="proposal.status === 'stale'" class="proposal-state bad">内容已变化，请重新提案</span>
  </div>
</template>

<style scoped>
.proposal-card {
  border: 1px solid #d9e5ff; border-radius: 8px; background: #fbfcff;
  padding: 8px 10px; display: flex; flex-direction: column; gap: 5px;
}
.proposal-card.rejected, .proposal-card.accepted { opacity: 0.6; }
.proposal-meta { display: flex; align-items: center; gap: 8px; }
.proposal-loc { font-size: 10px; color: #722ed1; font-weight: 600; }
.proposal-add {
  font-size: 10px; color: #d46b08;
  background: #fff7e6; border-radius: 8px; padding: 0 6px;
}
.proposal-before {
  margin: 0; font-size: 11px; color: #999;
  text-decoration: line-through; line-height: 1.6;
}
.proposal-after {
  margin: 0; font-size: 12px; color: #262626; line-height: 1.6;
  background: #f0f9ff; border-radius: 4px; padding: 5px 8px;
}
.proposal-why { margin: 0; font-size: 10px; color: #8c8c8c; }
.proposal-actions { display: flex; gap: 6px; margin-top: 2px; }
.proposal-btn {
  padding: 4px 14px; border: 1px solid #d9d9d9; border-radius: 4px;
  background: #fff; color: #555; font-size: 11px; cursor: pointer;
}
.proposal-btn.primary { background: #722ed1; border-color: #722ed1; color: #fff; }
.proposal-btn.primary:hover { background: #9254de; }
.proposal-state { font-size: 10px; color: #999; }
.proposal-state.ok { color: #52c41a; }
.proposal-state.bad { color: #fa541c; }
</style>
