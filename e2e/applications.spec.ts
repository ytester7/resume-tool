import { test, expect } from '@playwright/test';
import { startWithSample } from './helpers';

test('投递记录：记录岗位 -> 状态流转 -> 漏斗联动', async ({ page }) => {
  await startWithSample(page);

  await page.locator('button[aria-label="投递记录"]').click();
  const dialog = page.locator('.apps-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.apps-empty')).toBeVisible();

  // 新增一条带 JD 的 Boss直聘记录
  await dialog.locator('.apps-toolbar .apps-btn.primary').click();
  await dialog.locator('input[aria-label="公司"]').fill('云舟科技');
  await dialog.locator('input[aria-label="岗位"]').fill('测试开发工程师');
  await dialog.locator('textarea[aria-label="JD 内容"]').fill('负责服务端测试，熟悉 Python 与 Kubernetes');
  await dialog.locator('.form-actions .apps-btn.primary').click();

  await expect(dialog.locator('.app-card')).toHaveCount(1);
  await expect(dialog.locator('.channel-badge')).toContainText('Boss直聘');
  await expect(dialog.locator('.funnel-num').first()).toHaveText('1');

  // 状态推进：意向 -> 已投递
  await dialog.locator('.status-select').selectOption('已投递');
  await expect(dialog.locator('.funnel-num').nth(1)).toHaveText('1');
  // 时间线自动记录流转
  await dialog.locator('.mini-btn', { hasText: '备注' }).click();
  await expect(dialog.locator('.note-list')).toContainText('状态：意向 → 已投递');

  // 刷新后台账仍在（localStorage 持久化）
  await page.reload();
  await page.locator('button[aria-label="投递记录"]').click();
  await expect(page.locator('.app-card')).toHaveCount(1);
  await expect(page.locator('.status-select')).toHaveValue('已投递');
});

test('投递记录：分析 JD 填入岗位匹配、派生版本创建新 Tab', async ({ page }) => {
  await startWithSample(page);

  await page.locator('button[aria-label="投递记录"]').click();
  const dialog = page.locator('.apps-dialog');
  await dialog.locator('.apps-toolbar .apps-btn.primary').click();
  await dialog.locator('input[aria-label="公司"]').fill('潮汐网络');
  await dialog.locator('input[aria-label="岗位"]').fill('后端工程师');
  await dialog.locator('textarea[aria-label="JD 内容"]').fill('熟悉 Java 高并发与分布式架构');
  await dialog.locator('.form-actions .apps-btn.primary').click();

  // 分析 JD：面板关闭、JD 进入岗位匹配
  await dialog.locator('.mini-btn', { hasText: '分析 JD' }).click();
  await expect(dialog).toBeHidden();
  await page.locator('.jd-header').click();
  await expect(page.locator('.jd-input')).toHaveValue(/Java 高并发/);

  // 派生版本：新 Tab 以 公司·岗位 命名，JD 跟随
  await page.locator('button[aria-label="投递记录"]').click();
  await page.locator('.mini-btn', { hasText: '派生简历版本' }).click();
  await expect(page.locator('.tab-item')).toHaveCount(2);
  await expect(page.locator('.tab-item').nth(1)).toContainText('潮汐网络·后端工程师');
});

test('投递记录入口在欢迎页也可用', async ({ page }) => {
  await page.goto('/');
  await page.locator('button[aria-label="投递记录"]').click();
  await expect(page.locator('.apps-dialog')).toBeVisible();
});
