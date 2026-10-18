import type { Page } from '@playwright/test';

/** 打开应用并确保进入编辑器（欢迎页 -> 新建空白简历） */
export async function startBlank(page: Page): Promise<void> {
  await page.goto('/');
  const welcome = page.locator('.welcome');
  if (await welcome.count()) {
    await page.locator('.btn.primary').click();
  }
  await page.waitForSelector('.app-editor');
  await page.waitForSelector('input[placeholder="请输入姓名"]');
}

/** 打开应用并载入第一套示例简历 */
export async function startWithSample(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('.sample-card').first().click();
  await page.waitForSelector('.preview-canvas .resume');
}
