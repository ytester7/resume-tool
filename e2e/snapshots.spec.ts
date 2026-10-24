import { test, expect } from '@playwright/test';
import { startWithSample } from './helpers';

test('历史版本：留档展示与恢复为新 Tab', async ({ page }) => {
  await startWithSample(page);

  // 空态引导
  const snapBtn = page.locator('button[aria-label="历史版本"]');
  await snapBtn.click();
  const dialog = page.locator('.snap-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.snap-empty')).toBeVisible();
  await dialog.locator('.snap-close').click();

  // 注入一份快照（模拟此前保存过；tabId 用未知值 → 归入「其他简历」折叠组，
  // 恢复链路不依赖分组）。store 在应用启动时读取 localStorage，注入后重载页面。
  await page.evaluate(() => {
    const entry = {
      id: 'snap-e2e-1',
      tabId: 'zzz-not-current',
      tabTitle: '示例简历',
      savedAt: new Date().toISOString(),
      content: JSON.stringify({
        name: '陈默',
        title: '', phone: '', email: '', age: '', experienceYears: '',
        jobIntention: '', salary: '', github: '', website: '',
        summary: '这是旧快照里的概述',
        skills: [], experience: [], projects: [], education: [],
        evaluation: [{ text: '' }], customSections: [],
        _meta: { template: 'classic', sectionOrder: null, savedAt: '', version: '2.0' },
      }),
    };
    localStorage.setItem('resume_snapshots_v1', JSON.stringify({ version: 1, entries: [entry] }));
  });

  await page.reload();
  await page.locator('.sample-card').first().click();
  await page.waitForSelector('.preview-canvas .resume');

  await snapBtn.click();
  await expect(dialog.locator('details.snap-other summary')).toContainText('示例简历（1 份快照）');
  await dialog.locator('details.snap-other summary').click();
  await expect(dialog.locator('details .snap-item')).toHaveCount(1);

  await dialog.locator('details .snap-item .snap-btn.primary').click();

  // 恢复为新 Tab：内容来自快照
  await expect(page.locator('.tab-item')).toHaveCount(2);
  await expect(page.locator('.tab-item').nth(1)).toContainText('@');
  await expect(page.locator('textarea[aria-label="专业概述"]')).toHaveValue('这是旧快照里的概述');
});
