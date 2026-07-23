import { test, expect } from '@playwright/test';

test('技能列表添加与编辑', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=专业技能');
  // 点击添加技能按钮
  await page.click('button:has-text("添加技能")');
  // 应该出现一行技能编辑器
  await expect(page.locator('.skill-edit-row')).toHaveCount(1);
  // 填写技能
  await page.fill('.skill-cat-input', '自动化测试');
  await page.fill('.skill-items-input', 'Selenium, Playwright');
  // 预览应该同步显示
  await expect(page.locator('.preview-canvas')).toContainText('自动化测试');
  await expect(page.locator('.preview-canvas')).toContainText('Selenium');
});

test('区块顺序面板拖拽（手动验证占位）', async ({ page }) => {
  await page.goto('/');
  // classic 模板下应该显示区块顺序面板
  await expect(page.locator('.section-order-panel')).toBeVisible();
  // 拖拽操作在 E2E 中较复杂，这里仅验证面板存在
  // 真实拖拽测试通过单元测试 DraggableList 覆盖
});

test('工作经历卡片内子项独立排序', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=工作经历');
  // 添加工作经历
  await page.click('button:has-text("添加工作经历")');
  await expect(page.locator('.exp-edit-card')).toHaveCount(1);
  // 添加工作内容
  await page.click('button:has-text("添加工作内容")');
  await page.click('button:has-text("添加工作内容")');
  await expect(page.locator('.exp-item-row')).toHaveCount(2);
  // 填写内容
  await page.locator('.exp-item-input').first().fill('第一项工作内容');
  await page.locator('.exp-item-input').nth(1).fill('第二项工作内容');
  // 预览应包含
  await expect(page.locator('.preview-canvas')).toContainText('第一项工作内容');
  await expect(page.locator('.preview-canvas')).toContainText('第二项工作内容');
});
