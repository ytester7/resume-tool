import { test, expect } from '@playwright/test';

const TEXT_RESUME = `林岸
Java 后端工程师 | 5年经验
13900139000 | linan@example.com

工作经历
2022.03-至今  潮汐网络  高级后端工程师
• 负责交易履约域服务设计
• 核心接口 P99 降低 78%
关键成果：大促零 P0 故障

教育背景
2016.09-2020.06  华中科技大学  软件工程  本科
`;

async function dropFile(page: import('@playwright/test').Page, name: string, type: string, content: string) {
  await page.evaluate(({ name, type, content }) => {
    const file = new File([content], name, { type });
    const dt = new DataTransfer();
    dt.items.add(file);
    const root = document.querySelector('.app-root');
    root?.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, { name, type, content });
}

test('拖拽 TXT 导入：确认弹窗 -> 创建简历 Tab', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.welcome')).toBeVisible();

  await dropFile(page, 'resume.txt', 'text/plain', TEXT_RESUME);

  const dialog = page.locator('.import-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('林岸');
  await expect(dialog).toContainText('工作经历');
  await expect(dialog.locator('.count-chip').first()).toContainText('1');

  await dialog.locator('.btn-primary').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.tab-item').first()).toContainText('林岸');
  await expect(page.locator('input[placeholder="请输入姓名"]')).toHaveValue('林岸');
  await expect(page.locator('.preview-canvas')).toContainText('高级后端工程师');
});

test('拖拽 JSON 直接打开，不弹确认框', async ({ page }) => {
  await page.goto('/');
  const json = JSON.stringify({
    name: '赵六',
    title: '产品经理',
    skills: [],
    experience: [],
    projects: [],
    education: [],
    evaluation: [],
  });
  await dropFile(page, 'resume.json', 'application/json', json);

  await expect(page.locator('.import-dialog')).toHaveCount(0);
  await expect(page.locator('.tab-item').first()).toContainText('赵六');
  await expect(page.locator('input[placeholder="请输入姓名"]')).toHaveValue('赵六');
});

test('不支持的文件格式给出错误提示', async ({ page }) => {
  await page.goto('/');
  await dropFile(page, 'photo.png', 'image/png', 'not-a-resume');
  await expect(page.locator('.toast-item', { hasText: '导入失败' })).toBeVisible();
});
