import { test, expect } from '@playwright/test';
import { startBlank } from './helpers';

test('新建多个 Tab 并切换', async ({ page }) => {
  await startBlank(page);
  await expect(page.locator('.tab-item')).toHaveCount(1);

  await page.click('.tab-new-btn');
  await expect(page.locator('.tab-item')).toHaveCount(2);

  await page.click('.tab-new-btn');
  await expect(page.locator('.tab-item')).toHaveCount(3);

  // 新 Tab 不应立即带上未保存标记
  await expect(page.locator('.tab-dirty-mark')).toHaveCount(0);

  // 切换到第一个 Tab
  await page.locator('.tab-item').first().click();
  await expect(page.locator('.tab-item').first()).toHaveClass(/active/);
});

test('关闭 dirty Tab 弹出确认对话框', async ({ page }) => {
  await startBlank(page);
  await page.fill('input[placeholder="请输入姓名"]', '测试');
  await expect(page.locator('.tab-dirty-mark')).toBeVisible();

  // 新建第二个 Tab
  await page.click('.tab-new-btn');
  await expect(page.locator('.tab-item')).toHaveCount(2);

  // 关闭第一个 Tab（dirty）
  await page.locator('.tab-item').first().locator('.tab-close-btn').click();
  await expect(page.locator('.confirm-dialog')).toBeVisible();
  await page.locator('.confirm-btn', { hasText: '取消' }).click();
  await expect(page.locator('.tab-item')).toHaveCount(2);
});

test('Tab 标题跟随姓名自动更新', async ({ page }) => {
  await startBlank(page);
  await page.fill('input[placeholder="请输入姓名"]', '张三');
  await expect(page.locator('.tab-item').first()).toContainText('张三');
});
