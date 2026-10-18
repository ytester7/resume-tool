<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import { useUiStore } from '@/stores/ui';
import { fileToPhotoDataUrl } from '@/utils/image';
import type { ResumeData } from '@/types/resume';

const tabs = useTabsStore();
const ui = useUiStore();
const data = computed(() => tabs.active!.data);

// 仅允许 string 类型的字段，避免传入 skills/experience 等数组字段
type StringTextField = keyof {
  [K in keyof ResumeData as ResumeData[K] extends string ? K : never]: never
};

function update(field: StringTextField, value: string) {
  // 计算属性名 TS 推断为索引签名，无法直接赋给 Partial<ResumeData>，
  // 这里显式断言到 Partial<ResumeData>（比 as any 安全，shape 不兼容会被拒绝）。
  tabs.patchActive({ [field]: value } as Partial<ResumeData>);
}

const photoInput = ref<HTMLInputElement | null>(null);
const processing = ref(false);

async function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    ui.toastError('请选择图片文件');
    input.value = '';
    return;
  }
  processing.value = true;
  try {
    const photo = await fileToPhotoDataUrl(file);
    tabs.patchActive({ photo });
    ui.toastSuccess('照片已添加，可随时移除');
  } catch (err) {
    ui.toastError('照片处理失败：' + (err instanceof Error ? err.message : '未知错误'));
  } finally {
    processing.value = false;
    input.value = '';
  }
}

function removePhoto() {
  tabs.patchActive({ photo: '' });
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">基本信息</h3>

    <div class="photo-row">
      <div class="photo-preview" :class="{ empty: !data.photo }">
        <img v-if="data.photo" :src="data.photo" alt="证件照预览" />
        <span v-else>暂无照片</span>
      </div>
      <div class="photo-actions">
        <button type="button" class="photo-btn" :disabled="processing" @click="photoInput?.click()">
          {{ processing ? '处理中…' : (data.photo ? '更换照片' : '上传照片') }}
        </button>
        <button v-if="data.photo" type="button" class="photo-btn ghost" @click="removePhoto">
          移除
        </button>
        <p class="photo-hint">3:4 竖版证件照，自动裁剪压缩</p>
      </div>
      <input
        ref="photoInput"
        type="file"
        accept="image/*"
        class="photo-input"
        aria-label="上传证件照"
        @change="onPhotoChange"
      />
    </div>

    <div class="form-grid">
      <label class="form-item">
        <span class="form-label">姓名</span>
        <input :value="data.name" placeholder="请输入姓名" @input="update('name', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item wide">
        <span class="form-label">职位</span>
        <input :value="data.title" :title="data.title" placeholder="如：测试工程师" @input="update('title', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">电话</span>
        <input :value="data.phone" placeholder="请输入电话" @input="update('phone', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">邮箱</span>
        <input :value="data.email" :title="data.email" placeholder="请输入邮箱" @input="update('email', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">年龄</span>
        <input :value="data.age" placeholder="请输入年龄" @input="update('age', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">工作年限</span>
        <input :value="data.experienceYears" placeholder="如：5" @input="update('experienceYears', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item wide">
        <span class="form-label">求职意向</span>
        <input :value="data.jobIntention" :title="data.jobIntention" placeholder="如：高级测试工程师" @input="update('jobIntention', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">期望薪资</span>
        <input :value="data.salary" placeholder="如：20k-30k" @input="update('salary', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item wide">
        <span class="form-label">GitHub</span>
        <input :value="data.github" :title="data.github" placeholder="GitHub 用户名或链接" @input="update('github', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item wide">
        <span class="form-label">个人网站</span>
        <input :value="data.website" :title="data.website" placeholder="个人网站链接" @input="update('website', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.photo-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; margin-bottom: 12px;
  background: #fafafa; border: 1px dashed #e0e0e0; border-radius: 6px;
}
.photo-preview {
  width: 54px; height: 72px; flex-shrink: 0;
  border-radius: 4px; overflow: hidden; background: #fff;
  border: 1px solid #e8e8e8;
  display: flex; align-items: center; justify-content: center;
  color: #bbb; font-size: 10px;
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.photo-btn {
  padding: 4px 10px; border: 1px solid #1890ff; border-radius: 4px;
  background: #fff; color: #1890ff; font-size: 12px; cursor: pointer;
}
.photo-btn:disabled { opacity: 0.6; cursor: wait; }
.photo-btn.ghost { border-color: #d9d9d9; color: #888; }
.photo-hint { flex-basis: 100%; margin: 2px 0 0; font-size: 11px; color: #999; }
.photo-input { display: none; }

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px;
}
.form-item { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
/* 长文本字段（职位 / 求职意向 / 链接）整行铺满，避免在 380px 编辑栏里被截断 */
.form-item.wide { grid-column: 1 / -1; }
.form-label { font-size: 12px; color: #666; }
.form-item input {
  width: 100%; min-width: 0;
  padding: 6px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 13px; outline: none; transition: border-color 0.2s;
}
.form-item input:focus { border-color: #1890ff; }

/* 窄屏：表单单列布局 */
@media (max-width: 767px) {
  .form-grid { grid-template-columns: 1fr; gap: 8px; }
}
</style>
