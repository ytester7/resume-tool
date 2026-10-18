import { test, expect } from '@playwright/test';
import { startBlank } from './helpers';

test('技能列表添加与编辑', async ({ page }) => {
  await startBlank(page);
  await page.waitForSelector('text=专业技能');
  await page.click('button:has-text("添加技能")');
  await expect(page.locator('.skill-edit-row')).toHaveCount(1);
  await page.fill('.skill-cat-input', '自动化测试');
  await page.fill('.skill-items-input', 'Selenium, Playwright');
  await expect(page.locator('.preview-canvas')).toContainText('自动化测试');
  await expect(page.locator('.preview-canvas')).toContainText('Selenium');
});

test('区块顺序面板存在', async ({ page }) => {
  await startBlank(page);
  await expect(page.locator('.section-order-panel')).toBeVisible();
});

test('工作经历卡片内子项独立排序', async ({ page }) => {
  await startBlank(page);
  await page.waitForSelector('text=工作经历');
  await page.click('button:has-text("添加工作经历")');
  await expect(page.locator('.exp-edit-card')).toHaveCount(1);
  await page.click('button:has-text("添加工作内容")');
  await page.click('button:has-text("添加工作内容")');
  await expect(page.locator('.exp-item-row')).toHaveCount(2);
  await page.locator('.exp-item-input').first().fill('第一项工作内容');
  await page.locator('.exp-item-input').nth(1).fill('第二项工作内容');
  await expect(page.locator('.preview-canvas')).toContainText('第一项工作内容');
  await expect(page.locator('.preview-canvas')).toContainText('第二项工作内容');
});
