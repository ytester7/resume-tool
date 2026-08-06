<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';
import type { ResumeData } from '@/types/resume';

const tabs = useTabsStore();
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
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">基本信息</h3>
    <div class="form-grid">
      <label class="form-item">
        <span class="form-label">姓名</span>
        <input :value="data.name" placeholder="请输入姓名" @input="update('name', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">职位</span>
        <input :value="data.title" placeholder="如：测试工程师" @input="update('title', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">电话</span>
        <input :value="data.phone" placeholder="请输入电话" @input="update('phone', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">邮箱</span>
        <input :value="data.email" placeholder="请输入邮箱" @input="update('email', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">年龄</span>
        <input :value="data.age" placeholder="请输入年龄" @input="update('age', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">工作年限</span>
        <input :value="data.experienceYears" placeholder="如：5" @input="update('experienceYears', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">求职意向</span>
        <input :value="data.jobIntention" placeholder="如：高级测试工程师" @input="update('jobIntention', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">期望薪资</span>
        <input :value="data.salary" placeholder="如：20k-30k" @input="update('salary', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">GitHub</span>
        <input :value="data.github" placeholder="GitHub 用户名或链接" @input="update('github', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-item">
        <span class="form-label">个人网站</span>
        <input :value="data.website" placeholder="个人网站链接" @input="update('website', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px;
}
.form-item { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 12px; color: #666; }
.form-item input {
  padding: 6px 8px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 13px; outline: none; transition: border-color 0.2s;
}
.form-item input:focus { border-color: #1890ff; }

/* 窄屏：表单单列布局 */
@media (max-width: 767px) {
  .form-grid { grid-template-columns: 1fr; gap: 8px; }
}
</style>
