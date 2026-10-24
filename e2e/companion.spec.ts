import { test, expect, type Route } from '@playwright/test';

const COMPANION = 'http://127.0.0.1:41722';

async function mockCompanion(page: import('@playwright/test').Page): Promise<void> {
  await page.route(`${COMPANION}/**`, async (route: Route) => {
    const url = route.request().url();
    if (url.endsWith('/health')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { service: 'resume-tool-mcp', version: '0.1.0', requestsUsed: 0, requestsLimit: 60 } }),
      });
      return;
    }
    if (url.endsWith('/api/fetch-jd')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            company: '云舟科技',
            position: '测试开发工程师',
            salary: '25-45K',
            jd: '负责服务端测试与自动化体系建设，熟悉 Python 与 Kubernetes',
            url: 'https://www.zhipin.com/job_detail/mock.html',
          },
        }),
      });
      return;
    }
    await route.fulfill({ status: 404, body: '{}' });
  });
}

test('Boss直聘直连：伴随进程在线时从链接抓取 JD 并回填表单', async ({ page }) => {
  await mockCompanion(page);
  await page.goto('/');
  await page.locator('.btn.primary').click(); // 新建空白简历进入编辑器
  await page.waitForSelector('.app-editor');

  await page.locator('button[aria-label="投递记录"]').click();
  const dialog = page.locator('.apps-dialog');
  await expect(dialog).toBeVisible();

  // 在线状态点亮
  await expect(dialog.locator('.companion-chip.online')).toBeVisible();

  // 打开表单 → 粘贴链接 → 抓取
  await dialog.locator('.apps-toolbar .apps-btn.primary').click();
  await dialog.locator('input[aria-label="岗位链接"]').fill('https://www.zhipin.com/job_detail/mock.html');
  await dialog.locator('.grab-btn').click();

  await expect(dialog.locator('input[aria-label="公司"]')).toHaveValue('云舟科技');
  await expect(dialog.locator('input[aria-label="岗位"]')).toHaveValue('测试开发工程师');
  await expect(dialog.locator('textarea[aria-label="JD 内容"]')).toHaveValue(/自动化体系/);

  // 保存后进入台账，可继续走分析/派生流程
  await dialog.locator('.form-actions .apps-btn.primary').click();
  await expect(dialog.locator('.app-card')).toHaveCount(1);
  await expect(dialog.locator('.jd-flag')).toBeVisible();
});

test('Boss直聘直连：伴随进程不在线时无抓取入口，手动粘贴不受影响', async ({ page }) => {
  await page.route(`${COMPANION}/**`, (route: Route) => route.abort());
  await page.goto('/');
  await page.locator('.btn.primary').click();
  await page.waitForSelector('.app-editor');

  await page.locator('button[aria-label="投递记录"]').click();
  const dialog = page.locator('.apps-dialog');
  await expect(dialog.locator('.companion-chip.online')).toHaveCount(0);

  await dialog.locator('.apps-toolbar .apps-btn.primary').click();
  await expect(dialog.locator('.grab-row')).toHaveCount(0);
  await dialog.locator('input[aria-label="公司"]').fill('手动公司');
  await dialog.locator('input[aria-label="岗位"]').fill('手动岗位');
  await dialog.locator('.form-actions .apps-btn.primary').click();
  await expect(dialog.locator('.app-card')).toHaveCount(1);
});
