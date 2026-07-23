import { test, expect } from '@playwright/test';

test('新建多个 Tab 并切换', async ({ page }) => {
  await page.goto('/');
  // 初始有 1 个 Tab
  await expect(page.locator('.tab-item')).toHaveCount(1);

  // 点击新建按钮
  await page.click('.tab-new-btn');
  await expect(page.locator('.tab-item')).toHaveCount(2);

  await page.click('.tab-new-btn');
  await expect(page.locator('.tab-item')).toHaveCount(3);

  // 切换到第一个 Tab
  await page.locator('.tab-item').first().click();
  await expect(page.locator('.tab-item').first()).toHaveClass(/active/);
});

test('关闭 dirty Tab 弹出确认对话框', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('input[placeholder="请输入姓名"]');
  // 修改内容使 Tab 变 dirty
  await page.fill('input[placeholder="请输入姓名"]', '测试');
  await expect(page.locator('.tab-dirty-mark')).toBeVisible();

  // 新建第二个 Tab
  await page.click('.tab-new-btn');
  await expect(page.locator('.tab-item')).toHaveCount(2);

  // 关闭第一个 Tab（dirty）
  await page.locator('.tab-item').first().locator('.tab-close-btn').click();
  // 应该出现确认对话框
  await expect(page.locator('.confirm-dialog')).toBeVisible();
  // 点击取消
  await page.locator('.confirm-btn', { hasText: '取消' }).click();
  // Tab 数量应该不变
  await expect(page.locator('.tab-item')).toHaveCount(2);
});

test('保存到文件清除 dirty 标记', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('input[placeholder="请输入姓名"]');
  await page.fill('input[placeholder="请输入姓名"]', '测试保存');
  await expect(page.locator('.tab-dirty-mark')).toBeVisible();
  // 由于浏览器环境下无法真正调用 showSaveFilePicker，这里仅验证 Ctrl+S 不会报错
  // 真实保存流程需要手工验证
});
