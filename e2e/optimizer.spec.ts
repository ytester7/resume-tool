import { test, expect, type Page, type Route } from '@playwright/test';
import { startWithSample } from './helpers';

const AI_CONFIG = {
  ai: { provider: 'deepseek', baseURL: 'http://ai-mock.test/v1', apiKey: 'sk-e2e', model: 'deepseek-chat' },
};

/**
 * 三阶段连续 mock：按请求顺序返回 差距分析 → 素材整理 → 提案生成。
 * 提案的 passageId 从请求体里的段落目录动态提取（专业概述），避免复刻哈希算法。
 */
async function mockOptimizerFlow(page: Page, newSummary: string): Promise<void> {
  const steps = [
    // 第一步：差距分析
    JSON.stringify({
      summary: '测试基础扎实，缺少云原生实践。',
      strengths: ['自动化测试'],
      gaps: [
        { topic: 'Kubernetes 实践', kind: 'needs-material', question: '你实际工作中接触过 K8s 吗？做过什么？' },
        { topic: '量化不足', kind: 'polish' },
      ],
    }),
    // 第二步：素材整理（用户回答 -> 足够）
    JSON.stringify({ enough: true, material: '用户在交易服务项目中用 K8s 部署过测试环境' }),
    // 第三步：提案生成（passageId 在 fulfill 时动态填充）
    '',
  ];
  let call = 0;

  await page.route('**/chat/completions', async (route: Route) => {
    const idx = Math.min(call, steps.length - 1);
    call += 1;

    if (idx === 2) {
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
                reply: '强化概述对齐 JD，并基于你的素材补充 K8s 实践。',
                proposals: [{ passageId, text: newSummary, why: '基于你的真实素材：Kubernetes 实践' }],
              }),
            },
          }],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: steps[idx] } }] }),
    });
  });
}

test('简历优化工程师：JD 匹配入口进入，访谈后生成提案并采纳', async ({ page }) => {
  await page.addInitScript((config) => {
    localStorage.setItem('resume_tool_settings_v1', JSON.stringify(config));
  }, AI_CONFIG);

  const NEW_SUMMARY = '五年测试开发经验，具备 Kubernetes 测试环境建设实践';
  await mockOptimizerFlow(page, NEW_SUMMARY);
  await startWithSample(page);

  // 入口：JD 匹配区粘贴 JD -> 打开优化工程师
  await page.locator('.jd-header').click();
  await page.locator('.jd-input').fill('负责 Kubernetes 集群上的服务端测试与 Python 自动化建设，具备量化复盘能力');
  await page.locator('.jd-btn.primary').click();
  await page.locator('.jd-btn.opt-btn').click();

  const dialog = page.locator('.opt-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#opt-jd')).toHaveValue(/Kubernetes/);

  // 第一步：差距分析
  await dialog.locator('.opt-step .opt-btn.primary').click();
  await expect(dialog.locator('.opt-summary')).toContainText('云原生');
  await expect(dialog.locator('.opt-gap')).toHaveCount(2);
  await expect(dialog.locator('.opt-question').first()).toContainText('K8s');

  // 第二步：回答访谈问题
  await dialog.locator('.opt-answer-row textarea').fill('我在交易服务项目里用 k8s 部署过测试环境');
  await dialog.locator('.opt-answer-row .opt-btn.primary').click();
  await expect(dialog.locator('.opt-material')).toContainText('交易服务');
  await expect(dialog.locator('.opt-actions-row.footer .opt-hint')).toContainText('1 条素材');

  // 第三步：生成提案并采纳
  await dialog.locator('.opt-actions-row.footer .opt-btn.primary').click();
  await expect(dialog.locator('.proposal-card')).toBeVisible();
  await expect(dialog.locator('.proposal-why')).toContainText('真实素材');

  await dialog.locator('.proposal-btn.primary').click();
  await expect(page.locator('textarea[aria-label="专业概述"]')).toHaveValue(NEW_SUMMARY);
  await expect(dialog.locator('.proposal-state.ok')).toContainText('已采纳');
});

test('简历优化工程师：投递台账入口带入岗位 JD', async ({ page }) => {
  await page.addInitScript((config) => {
    localStorage.setItem('resume_tool_settings_v1', JSON.stringify(config));
  }, AI_CONFIG);
  await startWithSample(page);

  // 建一条带 JD 的台账记录
  await page.locator('button[aria-label="投递记录"]').click();
  const apps = page.locator('.apps-dialog');
  await apps.locator('.apps-toolbar .apps-btn.primary').click();
  await apps.locator('input[aria-label="公司"]').fill('云舟科技');
  await apps.locator('input[aria-label="岗位"]').fill('测试开发');
  await apps.locator('textarea[aria-label="JD 内容"]').fill('负责 Kubernetes 服务端测试与自动化体系建设');
  await apps.locator('.form-actions .apps-btn.primary').click();

  // 行操作「优化简历」：台账收起、优化工程师带着 JD 打开
  await apps.locator('.mini-btn.optimize').click();
  await expect(apps).toBeHidden();
  const opt = page.locator('.opt-dialog');
  await expect(opt).toBeVisible();
  await expect(page.locator('#opt-jd')).toHaveValue(/Kubernetes/);
  await expect(opt.locator('.opt-sub')).toContainText('云舟科技·测试开发');
});

test('未配置 AI 时 JD 区不显示优化工程师入口', async ({ page }) => {
  await startWithSample(page);
  await page.locator('.jd-header').click();
  await expect(page.locator('.jd-btn.opt-btn')).toHaveCount(0);
});
