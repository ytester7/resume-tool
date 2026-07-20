<script setup lang="ts">
import { computed } from 'vue';
import { useTabsStore } from '@/stores/tabs';

const tabs = useTabsStore();
const data = computed(() => tabs.active!.data);

function update(field: keyof typeof data.value, value: string) {
  tabs.patchActive({ [field]: value } as any);
}
</script>

<template>
  <section class="editor-section">
    <h3 class="section-heading">基本信息</h3>
    <div class="form-grid">
      <label class="form-item">
        <span class="form-label">姓名</span>
        <input :value="data.name" @input="update('name', ($event.target as HTMLInputElement).value)" placeholder="请输入姓名" />
      </label>
      <label class="form-item">
        <span class="form-label">职位</span>
        <input :value="data.title" @input="update('title', ($event.target as HTMLInputElement).value)" placeholder="如：测试工程师" />
      </label>
      <label class="form-item">
        <span class="form-label">电话</span>
        <input :value="data.phone" @input="update('phone', ($event.target as HTMLInputElement).value)" placeholder="请输入电话" />
      </label>
      <label class="form-item">
        <span class="form-label">邮箱</span>
        <input :value="data.email" @input="update('email', ($event.target as HTMLInputElement).value)" placeholder="请输入邮箱" />
      </label>
      <label class="form-item">
        <span class="form-label">年龄</span>
        <input :value="data.age" @input="update('age', ($event.target as HTMLInputElement).value)" placeholder="请输入年龄" />
      </label>
      <label class="form-item">
        <span class="form-label">工作年限</span>
        <input :value="data.experienceYears" @input="update('experienceYears', ($event.target as HTMLInputElement).value)" placeholder="如：5" />
      </label>
      <label class="form-item">
        <span class="form-label">求职意向</span>
        <input :value="data.jobIntention" @input="update('jobIntention', ($event.target as HTMLInputElement).value)" placeholder="如：高级测试工程师" />
      </label>
      <label class="form-item">
        <span class="form-label">期望薪资</span>
        <input :value="data.salary" @input="update('salary', ($event.target as HTMLInputElement).value)" placeholder="如：20k-30k" />
      </label>
      <label class="form-item">
        <span class="form-label">GitHub</span>
        <input :value="data.github" @input="update('github', ($event.target as HTMLInputElement).value)" placeholder="GitHub 用户名或链接" />
      </label>
      <label class="form-item">
        <span class="form-label">个人网站</span>
        <input :value="data.website" @input="update('website', ($event.target as HTMLInputElement).value)" placeholder="个人网站链接" />
      </label>
    </div>
  </section>
</template>

<style scoped>
.editor-section { margin-bottom: 24px; }
.section-heading {
  margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1890ff;
  padding-bottom: 6px; border-bottom: 1px solid #e8e8e8;
}
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
</style>
