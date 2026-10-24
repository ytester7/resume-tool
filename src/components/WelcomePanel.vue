<script setup lang="ts">
import { computed } from 'vue';
import { SAMPLE_RESUMES } from '@/data/samples';
import type { SampleResume } from '@/data/samples';
import { useSettingsStore } from '@/stores/settings';
import AppIcon from './AppIcon.vue';

const settings = useSettingsStore();

defineEmits<{
  (e: 'new'): void;
  (e: 'open'): void;
  (e: 'sample', sample: SampleResume): void;
  /** 打开 AI 设置弹窗（App 层接线） */
  (e: 'configure-ai'): void;
}>();

const aiReady = computed(() => settings.aiReady);
</script>

<template>
  <div class="welcome">
    <section class="hero">
      <div class="brand">
        <AppIcon name="fileAlt" size="22px" />
        <span>简历制作工具</span>
      </div>
      <h1>30 秒做出一份<br />能投出去的简历</h1>
      <p class="subtitle">
        13 套模板 · 健康度评分 · 岗位匹配 · 本地优先<br />
        支持导入 PDF / Word / JSON 旧简历，也可以把文件直接拖进来。<br />
        简历只保存在你的浏览器和本地文件里，不上传任何服务器。
      </p>

      <div class="actions">
        <button class="btn primary" @click="$emit('new')">
          <AppIcon name="plus" /> 新建空白简历
        </button>
        <button class="btn" @click="$emit('open')">
          <AppIcon name="upload" /> 导入 PDF / Word
        </button>
      </div>

      <ul class="features">
        <li><strong>A4 实时预览</strong><span>所见即所得，页数心里有数</span></li>
        <li><strong>健康度 + JD 匹配</strong><span>知道哪里该改，也知道岗位差什么</span></li>
        <li><strong>可选中文字的 PDF</strong><span>打印通道导出，ATS 能读懂</span></li>
      </ul>
    </section>

    <section class="samples">
      <div class="samples-head">
        <h2>从示例开始</h2>
        <p>先用一份完整简历看看效果，再替换成你的内容</p>
      </div>
      <div class="sample-grid">
        <button
          v-for="sample in SAMPLE_RESUMES"
          :key="sample.id"
          class="sample-card"
          @click="$emit('sample', sample)"
        >
          <span class="sample-tag">{{ sample.label }}</span>
          <span class="sample-role">{{ sample.role }}</span>
          <span class="sample-desc">{{ sample.description }}</span>
          <span class="sample-cta">使用此示例 →</span>
        </button>
      </div>
      <p class="privacy">
        <AppIcon name="shield" /> 示例为虚构人物，仅用于演示排版效果
      </p>
    </section>

    <section class="ai-boost">
      <div class="ai-boost-head">
        <h2><AppIcon name="sparkles" /> AI 能力（可选，自带 Key）</h2>
        <span v-if="aiReady" class="ai-ready-badge"><AppIcon name="shield" /> AI 已启用</span>
      </div>
      <div class="ai-boost-grid">
        <div class="ai-boost-item">
          <strong>AI 解析旧简历</strong>
          <span>PDF / Word 导入识别更准，字段逐条核对后入库</span>
        </div>
        <div class="ai-boost-item">
          <strong>简历优化工程师</strong>
          <span>粘贴岗位 JD，访谈你的真实经历，产出定制提案——AI 只整理你说过的素材，绝不编造</span>
        </div>
        <div class="ai-boost-item">
          <strong>AI 聊天助手</strong>
          <span>对话式改简历：提案卡片逐条采纳，Ctrl+Z 可撤销</span>
        </div>
      </div>
      <div class="ai-boost-actions">
        <button v-if="!aiReady" class="btn primary" @click="$emit('configure-ai')">
          <AppIcon name="cogs" /> 配置 AI（DeepSeek / OpenAI 兼容 / Ollama）
        </button>
        <span class="ai-boost-hint">配置前零网络请求；Key 只存本地浏览器，按次计费在你的服务商账户</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.welcome {
  height: 100%;
  overflow: auto;
  background:
    radial-gradient(1200px 500px at 10% -10%, #e6f4ff 0%, transparent 60%),
    radial-gradient(900px 400px at 100% 0%, #f6ffed 0%, transparent 55%),
    #f7f9fc;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 48px;
  align-items: center;
  padding: 48px clamp(24px, 6vw, 96px);
}
.hero { max-width: 560px; }
.brand {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #1890ff;
  background: #e6f4ff; border-radius: 999px; padding: 6px 14px;
  margin-bottom: 22px;
}
.hero h1 {
  margin: 0 0 16px;
  font-size: clamp(28px, 3.4vw, 42px);
  line-height: 1.25;
  color: #10233b;
  letter-spacing: 1px;
}
.subtitle { margin: 0 0 26px; color: #5b6b7f; font-size: 14px; line-height: 1.9; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 30px; }
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 11px 20px; border-radius: 8px; border: 1px solid #d0d7e2;
  background: #fff; color: #24344d; font-size: 14px; cursor: pointer;
  transition: all 0.18s;
}
.btn:hover { border-color: #1890ff; color: #1890ff; transform: translateY(-1px); }
.btn.primary {
  background: #1890ff; border-color: #1890ff; color: #fff;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.25);
}
.btn.primary:hover { background: #40a9ff; border-color: #40a9ff; color: #fff; }

.features { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.features li {
  display: flex; align-items: baseline; gap: 10px;
  font-size: 13px; color: #4a5b70;
}
.features strong {
  flex-shrink: 0; color: #10233b; font-weight: 600;
  min-width: 120px;
}
.features span { color: #7b8a9c; }

.ai-boost {
  background: #faf5ff; border: 1px solid #e5d5f7; border-radius: 16px;
  padding: 26px; box-shadow: 0 12px 40px rgba(114, 46, 209, 0.08);
}
.ai-boost-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ai-boost-head h2 {
  margin: 0 0 6px; font-size: 18px; color: #4a2a7a;
  display: inline-flex; align-items: center; gap: 6px;
}
.ai-ready-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 12px;
  background: #f6ffed; color: #389e0d; font-size: 11px; font-weight: 600;
}
.ai-boost-grid { display: grid; gap: 12px; margin: 14px 0; }
.ai-boost-item {
  display: grid; gap: 2px; padding: 10px 14px;
  background: #fff; border: 1px solid #efdbff; border-radius: 10px;
}
.ai-boost-item strong { font-size: 13px; color: #10233b; }
.ai-boost-item span { font-size: 12px; color: #7b8a9c; line-height: 1.6; }
.ai-boost-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ai-boost-hint { font-size: 11px; color: #9aa7b6; line-height: 1.6; }

.samples {
  background: #fff; border: 1px solid #e6ebf2; border-radius: 16px;
  padding: 26px; box-shadow: 0 12px 40px rgba(16, 35, 59, 0.08);
}
.samples-head h2 { margin: 0 0 6px; font-size: 18px; color: #10233b; }
.samples-head p { margin: 0 0 18px; color: #7b8a9c; font-size: 12px; }
.sample-grid { display: grid; gap: 12px; }
.sample-card {
  display: grid; grid-template-columns: auto 1fr; gap: 4px 10px;
  text-align: left; padding: 14px 16px; border: 1px solid #e6ebf2;
  border-radius: 10px; background: #fbfcfe; cursor: pointer;
  transition: all 0.18s;
}
.sample-card:hover {
  border-color: #1890ff; background: #f0f8ff;
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.12);
}
.sample-tag {
  grid-row: span 2; align-self: start;
  background: #e6f4ff; color: #1677ff; border-radius: 6px;
  padding: 4px 10px; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.sample-role { font-size: 12px; color: #24344d; font-weight: 600; }
.sample-desc { grid-column: 2; font-size: 12px; color: #7b8a9c; }
.sample-cta {
  grid-column: 2; font-size: 12px; color: #1890ff; margin-top: 4px;
}
.privacy {
  display: flex; align-items: center; gap: 6px;
  margin: 18px 0 0; font-size: 11px; color: #9aa7b6;
}

@media (max-width: 900px) {
  .welcome {
    grid-template-columns: 1fr;
    padding: 28px 20px 40px;
    gap: 26px;
    align-items: start;
  }
  .hero h1 { font-size: 28px; }
  .features strong { min-width: 104px; }
}
</style>
