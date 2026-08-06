<script setup lang="ts">
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();

function onAction(action: string) {
  ui.resolveConfirm(action);
}

function onBackdrop() {
  ui.resolveConfirm(null);
}
</script>

<template>
  <Transition name="dialog-fade">
    <div v-if="ui.confirmState.visible" class="confirm-backdrop" @click.self="onBackdrop">
      <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h3 id="confirm-dialog-title" class="confirm-title">{{ ui.confirmState.options.title }}</h3>
        <p class="confirm-message">{{ ui.confirmState.options.message }}</p>
        <div class="confirm-actions">
          <button
            v-for="(action, i) in ui.confirmState.options.actions"
            :key="action"
            :class="['confirm-btn', i === 0 ? 'primary' : 'secondary']"
            @click="onAction(action)"
          >
            {{ action }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.confirm-dialog {
  background: #fff; border-radius: 8px; padding: 24px;
  min-width: 320px; max-width: 480px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.16);
}
.confirm-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; }
.confirm-message { margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.5; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }
.confirm-btn {
  padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 14px;
}
.confirm-btn.primary { background: #1890ff; color: #fff; border-color: #1890ff; }
.confirm-btn.primary:hover { background: #40a9ff; }
.confirm-btn.secondary:hover { background: #f5f5f5; }
.dialog-fade-enter-active, .dialog-fade-leave-active { transition: opacity 0.2s; }
.dialog-fade-enter-from, .dialog-fade-leave-to { opacity: 0; }

/* 窄屏：对话框宽度自适应，避免超出视口 */
@media (max-width: 767px) {
  .confirm-dialog {
    min-width: auto;
    width: calc(100vw - 32px);
    padding: 16px;
  }
  .confirm-actions { flex-wrap: wrap; }
  .confirm-btn { flex: 1; }
}
</style>
