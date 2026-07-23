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

test('编辑基本信息反映到预览', async ({ page }) => {
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
