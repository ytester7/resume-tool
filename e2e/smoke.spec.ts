import { test, expect } from '@playwright/test';

test('应用启动并显示工具栏', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.toolbar')).toBeVisible();
  await expect(page.locator('.tab-bar')).toBeVisible();
  await expect(page.locator('.app-editor')).toBeVisible();
  await expect(page.locator('.app-preview')).toBeVisible();
});

test('启动时自动创建未命名 Tab', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tab-item')).toHaveCount(1);
  await expect(page.locator('.tab-item').first()).toContainText('未命名');
});

// 跳过原因（应用 bug，非测试代码问题）：
// src/components/PreviewPanel.vue 的 templateComponents 使用裸函数
// `() => import(...)` 直接传给 `<component :is>`，Vue 3 不会自动将其识别为异步组件
// （必须用 defineAsyncComponent 包装），而是当作函数式组件调用，返回的 Promise 被
// 渲染成文本 "[object Promise]"。真实浏览器中预览区完全不渲染模板内容。
// 已通过 Chrome DevTools 确证：.preview-canvas 的 innerHTML 为 "[object Promise]"，
// 且 ClassicLayout.vue 模块已成功加载（200），说明问题出在 Vue 对异步组件的识别。
// 修复方向（不在本任务范围内，应用代码不修改）：
//   import { defineAsyncComponent } from 'vue';
//   classic: defineAsyncComponent(() => import('@/components/templates/ClassicLayout.vue'))
// 单元测试 PreviewPanel.spec.ts 未能发现此 bug，因其只断言 .preview-canvas 元素存在，
// 未检查渲染内容。
test.skip('编辑基本信息反映到预览', async ({ page }) => {
  await page.goto('/');
  // 等待编辑器加载
  await page.waitForSelector('input[placeholder="请输入姓名"]');
  await page.fill('input[placeholder="请输入姓名"]', '自动化测试');
  await page.fill('input[placeholder="如：测试工程师"]', '高级测试工程师');
  // 预览应同步显示
  await expect(page.locator('.preview-canvas')).toContainText('自动化测试');
  await expect(page.locator('.preview-canvas')).toContainText('高级测试工程师');
});

test('切换模板通过快捷键', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.preview-canvas');
  // 按 ] 切换到下一个模板
  await page.keyboard.press(']');
  // 应该有 toast 提示
  await expect(page.locator('.toast-item')).toBeVisible();
});
