import { test, expect, type Page, type Route } from '@playwright/test';
import { startBlank, startWithSample } from './helpers';

const AI_CONFIG = {
  ai: {
    provider: 'deepseek',
    baseURL: 'http://ai-mock.test/v1',
    apiKey: 'sk-e2e-test-key',
    model: 'deepseek-chat',
  },
};

/** 预置 AI 配置，跳过设置弹窗流程（设置流程单独测） */
async function enableAi(page: Page): Promise<void> {
  await page.addInitScript((config) => {
    localStorage.setItem('resume_tool_settings_v1', JSON.stringify(config));
  }, AI_CONFIG);
}

/** 拦截 chat/completions，按场景返回假模型输出 */
async function mockChat(page: Page, payload: unknown): Promise<void> {
  await page.route('**/chat/completions', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }),
    }),
  );
}

async function dropTextFile(page: Page, name: string, content: string): Promise<void> {
  await page.evaluate(({ name, content }) => {
    const file = new File([content], name, { type: 'text/plain' });
    const dt = new DataTransfer();
    dt.items.add(file);
    document.querySelector('.app-root')
      ?.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, { name, content });
}

const TEXT_RESUME = `林岸
Java 后端工程师
13900139000 | linan@example.com

工作经历
2022.03-至今  潮汐网络  高级后端工程师
• 负责交易履约域服务设计

教育背景
2016.09-2020.06  华中科技大学  软件工程  本科
`;

test('未配置 AI 时：所有 AI 入口隐藏，界面无网络泄漏', async ({ page }) => {
  await startWithSample(page);

  await expect(page.locator('.improve-btn')).toHaveCount(0);
  await expect(page.locator('.ai-btn')).toHaveCount(0);
  await expect(page.locator('.toolbar-shortcuts .ai-active')).toHaveCount(0);
});

test('设置弹窗：配置 -> 连接测试 -> 保存后入口出现', async ({ page }) => {
  await page.route('**/chat/completions', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: '1' } }] }),
    }),
  );
  await startBlank(page);

  await page.locator('.toolbar-shortcuts button[aria-label="AI 设置"]').click();
  const dialog = page.locator('.settings-dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('.form-input[type="password"]').fill('sk-e2e-test-key');
  await dialog.locator('.test-btn').click();
  await expect(dialog.locator('.test-message.ok')).toBeVisible();

  await dialog.locator('.btn-primary').click();
  await expect(dialog).toBeHidden();
  // 保存后：工具栏齿轮点亮，配置已写入 localStorage
  await expect(page.locator('.toolbar-shortcuts .ai-active')).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('resume_tool_settings_v1'));
  expect(stored).toContain('deepseek-chat');
});

test('单条润色：AI 改写后替换原文', async ({ page }) => {
  await enableAi(page);
  await mockChat(page, { text: '主导交易履约域服务设计，支撑日均百万订单', why: '动词更有力并补充规模', addsFacts: false });
  await startWithSample(page);

  const firstImprove = page.locator('.improve-btn').first();
  await firstImprove.click();
  await page.locator('.option-btn', { hasText: '强化动词' }).click();

  const resultText = page.locator('.result-text');
  await expect(resultText).toContainText('主导交易履约域');
  await page.locator('.result-btn.primary').click();

  // 替换写入编辑器：对应 textarea 的值更新
  await expect(page.locator('.exp-item-input').first()).toHaveValue('主导交易履约域服务设计，支撑日均百万订单');
});

test('JD 深度分析：展示建议并可点击定位', async ({ page }) => {
  await enableAi(page);
  await mockChat(page, {
    summary: '后端经验匹配良好，缺少云原生实践。',
    missingConcepts: ['Kubernetes'],
    strengths: ['Java 服务端'],
    suggestions: [
      { section: 'experience', issue: '经历未体现容器化交付', impact: 'high' },
    ],
  });
  await startWithSample(page);

  await page.locator('.jd-header').click();
  await page.locator('.jd-input').fill('负责 Kubernetes 集群上的微服务研发，熟悉 Java 与高并发架构设计');
  await page.locator('.jd-btn.primary').click();
  await expect(page.locator('.jd-score')).toBeVisible();

  await page.locator('.jd-btn.ai-btn').click();
  await expect(page.locator('.ai-result')).toBeVisible();
  await expect(page.locator('.ai-suggestion').first()).toContainText('容器化');
  await expect(page.locator('.ai-result .chip.missing', { hasText: 'Kubernetes' })).toBeVisible();
});

test('AI 导入：弹窗内重解析并核对后导入', async ({ page }) => {
  await enableAi(page);
  await mockChat(page, {
    name: '林岸',
    title: 'Java 后端工程师',
    phone: '13900139000',
    email: 'linan@example.com',
    experience: [{
      company: '潮汐网络',
      role: '高级后端工程师',
      time: '2022.03-至今',
      items: ['负责交易履约域服务设计'],
    }],
    education: [{ school: '华中科技大学', major: '软件工程', degree: '本科', time: '2016.09-2020.06' }],
  });

  await page.goto('/');
  await dropTextFile(page, 'resume.txt', TEXT_RESUME);

  const dialog = page.locator('.import-dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('.btn-ai').click();
  await expect(dialog.locator('.ai-badge')).toBeVisible();
  await expect(dialog.locator('.warnings')).toContainText('核对');

  await dialog.locator('.btn-primary').click();
  await expect(page.locator('input[placeholder="请输入姓名"]')).toHaveValue('林岸');
  // AI 抽取的工作经历条目进入编辑器
  await expect(page.locator('.exp-item-input').first()).toHaveValue('负责交易履约域服务设计');
});
