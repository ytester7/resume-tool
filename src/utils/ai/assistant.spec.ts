import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatWithAssistant } from './assistant';
import { defaultResumeData } from '@/types/resume';
import type { AiProviderConfig } from '@/types/settings';

vi.mock('./client', async (importOriginal) => {
  const original = await importOriginal<typeof import('./client')>();
  return { ...original, chatCompletion: vi.fn() };
});

import { chatCompletion } from './client';
const chatMock = vi.mocked(chatCompletion);

const config: AiProviderConfig = {
  provider: 'deepseek', baseURL: 'https://api.example.com/v1', apiKey: 'sk-x', model: 'm',
};

function makeData() {
  const data = defaultResumeData();
  data.summary = '五年测试开发经验';
  data.experience = [{
    id: 'exp1', company: '云舟科技', role: '测试开发', time: '2023-至今',
    description: '', achievement: '', items: ['搭建自动化框架'],
  }];
  return data;
}

beforeEach(() => {
  chatMock.mockReset();
});

describe('chatWithAssistant', () => {
  it('返回 reply 与基于当前目录解析过的提案', async () => {
    const data = makeData();
    // 先取真实 passage id（用目录里的第一条工作内容）
    const { collectPassages } = await import('./proposals');
    const itemId = collectPassages(data).find(
      (p) => p.location.startsWith('工作经历 · ') && p.location.includes('第 1 条'),
    )!.id;

    chatMock.mockResolvedValueOnce(JSON.stringify({
      reply: '我把这条经历改得更量化了，请确认。',
      proposals: [{ passageId: itemId, text: '主导搭建自动化框架，用例覆盖率达 90%', why: '补充量化结果' }],
    }));

    const turn = await chatWithAssistant(config, { request: '改得更量化', history: [], data });

    expect(turn.reply).toContain('量化');
    expect(turn.proposals).toHaveLength(1);
    expect(turn.proposals[0].status).toBe('pending');
    expect(turn.proposals[0].after).toContain('90%');
  });

  it('消息结构：system + 历史 + 用户请求（含目录数据块）', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({ reply: '好的', proposals: [] }));

    await chatWithAssistant(config, {
      request: '精简概述',
      history: [
        { role: 'user', content: '第一轮请求' },
        { role: 'assistant', content: '第一轮回复' },
      ],
      data: makeData(),
    });

    const messages = chatMock.mock.calls[0][1];
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('安全规则');
    expect(messages[0].content).toContain('proposals');
    expect(messages).toHaveLength(4);
    const lastMsg = messages[3].content;
    expect(lastMsg).toContain('<<<CATALOG_START>>>');
    expect(lastMsg).toContain('<<<REQUEST_START>>>');
  });

  it('已保存的 JD 作为数据块附带', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({ reply: 'ok', proposals: [] }));
    await chatWithAssistant(config, {
      request: '按 JD 优化',
      history: [],
      data: makeData(),
      jd: '负责 Kubernetes 集群运维',
    });
    const messages = chatMock.mock.calls[0][1];
    const last = messages[messages.length - 1].content;
    expect(last).toContain('<<<JD_TEXT_START>>>');
    expect(last).toContain('Kubernetes');
  });

  it('空请求直接抛错，不发请求', async () => {
    await expect(
      chatWithAssistant(config, { request: '   ', history: [], data: makeData() }),
    ).rejects.toThrow('请输入');
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('模型虚构的 passageId 落为 stale 而不是报错', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({
      reply: '已提出修改',
      proposals: [{ passageId: 'p_not_exist', text: '任意文本' }],
    }));

    const turn = await chatWithAssistant(config, { request: '优化', history: [], data: makeData() });
    expect(turn.proposals[0].status).toBe('stale');
  });
});
