<script setup lang="ts">
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();
</script>

<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div
      v-for="t in ui.toasts"
      :key="t.id"
      :class="['toast-item', `toast-${t.type}`]"
      @click="ui.dismissToast(t.id)"
    >
      {{ t.message }}
    </div>
  </TransitionGroup>
</template>

<style scoped>
.toast-container {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 10000;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none;
}
.toast-item {
  padding: 10px 20px; border-radius: 4px; font-size: 14px; color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer; pointer-events: auto;
  min-width: 200px; text-align: center;
}
.toast-success { background: #52c41a; }
.toast-error { background: #f5222d; }
.toast-info { background: #1890ff; }
.toast-warning { background: #faad14; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from { opacity: 0; transform: translateY(-12px); }
.toast-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
