import { test, expect } from '@playwright/test';
import { startBlank, startWithSample } from './helpers';

test('应用启动并显示工具栏与欢迎页', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.toolbar')).toBeVisible();
  await expect(page.locator('.welcome')).toBeVisible();
  await expect(page.locator('.sample-card')).toHaveCount(3);
});

test('从欢迎页新建后进入编辑器', async ({ page }) => {
  await startBlank(page);
  await expect(page.locator('.tab-item')).toHaveCount(1);
  await expect(page.locator('.tab-item').first()).toContainText('未命名');
  await expect(page.locator('.app-preview')).toBeVisible();
});

test('从欢迎页载入示例并渲染预览', async ({ page }) => {
  await startWithSample(page);
  await expect(page.locator('.tab-item').first()).toContainText('陈默');
  await expect(page.locator('.preview-canvas')).toContainText('陈默');
  await expect(page.locator('.page-badge')).toContainText('页');
});

test('编辑基本信息反映到预览', async ({ page }) => {
  await startBlank(page);
  await page.fill('input[placeholder="请输入姓名"]', '自动化测试');
  await page.fill('input[placeholder="如：测试工程师"]', '高级测试工程师');
  await expect(page.locator('.preview-canvas')).toContainText('自动化测试');
  await expect(page.locator('.preview-canvas')).toContainText('高级测试工程师');
});

test('切换模板通过快捷键', async ({ page }) => {
  await startBlank(page);
  await page.waitForSelector('.preview-canvas');
  await page.keyboard.press(']');
  await expect(page.locator('.toast-item', { hasText: '切换到' })).toBeVisible();
});

test('导出菜单提供打印与兼容两条通道', async ({ page }) => {
  await startBlank(page);
  await page.locator('.export-menu summary').click();
  await expect(page.locator('.export-item', { hasText: '打印 / 另存为 PDF' })).toBeVisible();
  await expect(page.locator('.export-item', { hasText: '图片 PDF' })).toBeVisible();
});
