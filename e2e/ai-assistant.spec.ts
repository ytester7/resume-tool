import { test, expect, type Page, type Route } from '@playwright/test';
import { startWithSample } from './helpers';

const AI_CONFIG = {
  ai: { provider: 'deepseek', baseURL: 'http://ai-mock.test/v1', apiKey: 'sk-e2e', model: 'deepseek-chat' },
};

/**
 * 拦截 chat/completions：从请求体里的段落目录动态取出「专业概述」的真实
 * passageId（避免在测试里复刻内容哈希算法），回一条改概述的提案。
 */
async function mockAssistantProposal(page: Page, newSummary: string): Promise<void> {
  await page.route('**/chat/completions', async (route: Route) => {
    const body = route.request().postDataJSON() as { messages: { content: string }[] };
    const userMsg = body.messages.at(-1)?.content ?? '';
    const catalogBlock = userMsg.split('<<<CATALOG_START>>>')[1]?.split('<<<CATALOG_END>>>')[0] ?? '';
    const summaryLine = catalogBlock.split('\n').find((l) => l.includes('专业概述')) ?? '';
    const passageId = summaryLine.split(' | ')[0];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              reply: '我把专业概述改得更聚焦了，请确认。',
              proposals: [{ passageId, text: newSummary, why: '更聚焦测试开发方向' }],
            }),
          },
        }],
      }),
    });
  });
}

test('AI 助手：对话 -> 提案卡片 -> 采纳写入 -> 撤销', async ({ page }) => {
  await page.addInitScript((config) => {
    localStorage.setItem('resume_tool_settings_v1', JSON.stringify(config));
  }, AI_CONFIG);

  const NEW_SUMMARY = '五年测试开发经验，主导自动化体系从零到一建设';
  await mockAssistantProposal(page, NEW_SUMMARY);
  await startWithSample(page);

  // 打开助手面板
  await page.locator('.assistant-fab').click();
  await expect(page.locator('.assistant-panel')).toBeVisible();

  // 发送请求（走快捷建议芯片即可）
  await page.locator('.suggestion-chip').first().click();
  await expect(page.locator('.proposal-card')).toBeVisible();
  await expect(page.locator('.proposal-after')).toContainText(NEW_SUMMARY.slice(0, 8));
  await expect(page.locator('.proposal-loc')).toContainText('专业概述');

  // 采纳前：编辑器概述还是原文
  const summaryInput = page.locator('textarea[aria-label="专业概述"]');
  await expect(summaryInput).not.toHaveValue(NEW_SUMMARY);

  // 采纳：写入编辑器与预览
  await page.locator('.proposal-btn.primary').click();
  await expect(page.locator('.proposal-state.ok')).toContainText('已采纳');
  await expect(summaryInput).toHaveValue(NEW_SUMMARY);

  // 等待撤销快照入栈（编辑器对连续修改有 450ms 合并窗口），再 Ctrl+Z 撤销这次采纳
  await page.waitForTimeout(700);
  await page.keyboard.press('Control+z');
  await expect(summaryInput).not.toHaveValue(NEW_SUMMARY);
});

test('AI 助手：忽略提案不改数据', async ({ page }) => {
  await page.addInitScript((config) => {
    localStorage.setItem('resume_tool_settings_v1', JSON.stringify(config));
  }, AI_CONFIG);

  await mockAssistantProposal(page, '不该出现的概述');
  await startWithSample(page);

  await page.locator('.assistant-fab').click();
  await page.locator('.suggestion-chip').first().click();
  await expect(page.locator('.proposal-card')).toBeVisible();

  await page.locator('.proposal-btn:not(.primary)').click();
  await expect(page.locator('.proposal-state')).toContainText('已忽略');
  await expect(page.locator('textarea[aria-label="专业概述"]')).not.toHaveValue('不该出现的概述');
});

test('未配置 AI 时不渲染助手入口', async ({ page }) => {
  await startWithSample(page);
  await expect(page.locator('.assistant-fab, .assistant-panel')).toHaveCount(0);
});

test('AI 助手：流式响应逐步上屏并附提案', async ({ page }) => {
  await page.addInitScript((config) => {
    localStorage.setItem('resume_tool_settings_v1', JSON.stringify(config));
  }, AI_CONFIG);

  // SSE 流：reply 分三块到达，最后附 proposals 并闭合 JSON
  await page.route('**/chat/completions', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        'data: {"choices":[{"delta":{"content":"{\\"reply\\":\\"我来"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"帮你强化这段经历"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"，请确认。\\""}}]}\n\n',
        'data: {"choices":[{"delta":{"content":",\\"proposals\\":[]}"}}]}\n\n',
        'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n',
      ].join(''),
    });
  });
  await startWithSample(page);

  await page.locator('.assistant-fab').click();
  await page.locator('.panel-input').fill('帮我强化经历');
  await page.locator('.send-btn').click();

  // 最终消息 = 完整 reply（流式期间为增量文本，结束后覆盖为权威值）
  const lastMsg = page.locator('.msg.assistant .msg-text').last();
  await expect(lastMsg).toHaveText('我来帮你强化这段经历，请确认。');
  // 流式结束后不再显示光标
  await expect(page.locator('.msg.streaming')).toHaveCount(0);
});
