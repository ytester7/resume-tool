import { test, expect } from '@playwright/test';
import { startBlank, startWithSample } from './helpers';

test('撤销与重做恢复编辑内容', async ({ page }) => {
  await startBlank(page);
  const nameInput = page.locator('input[placeholder="请输入姓名"]');
  await nameInput.fill('张三');
  // 等待历史快照落盘（450ms 防抖）
  await page.waitForTimeout(700);

  await page.locator('button[aria-label="撤销"]').click();
  await expect(nameInput).toHaveValue('');

  await page.locator('button[aria-label="重做"]').click();
  await expect(nameInput).toHaveValue('张三');
});

test('岗位匹配能列出 JD 中缺失的关键词', async ({ page }) => {
  await startWithSample(page);
  await page.locator('.jd-header').click();
  const jd = page.locator('.jd-input');
  await expect(jd).toBeVisible();
  await jd.fill('岗位要求：熟悉 Python、pytest、Selenium、Kubernetes、Docker，有自动化测试经验。');
  await page.locator('.jd-btn.primary').click();

  await expect(page.locator('.jd-summary')).toContainText('关键词');
  await expect(page.locator('.chip.missing', { hasText: 'Kubernetes' })).toBeVisible();
  await expect(page.locator('.chip.missing', { hasText: 'Docker' })).toBeVisible();
});

test('照片上传入口存在且可移除', async ({ page }) => {
  await startBlank(page);
  await expect(page.locator('.photo-preview')).toBeVisible();
  await expect(page.locator('.photo-btn').first()).toHaveText('上传照片');
});

test('导出菜单包含 A4 提示与三种导出方式', async ({ page }) => {
  await startWithSample(page);
  await expect(page.locator('.page-badge')).toContainText('A4');
  await page.locator('.export-menu summary').click();
  await expect(page.locator('.export-item')).toHaveCount(3);
});

test('Word 导出能下载 .docx 文件', async ({ page }) => {
  await startWithSample(page);
  await page.locator('.export-menu summary').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.export-item', { hasText: 'Word 文档' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.docx');
});
