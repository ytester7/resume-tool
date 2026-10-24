import { describe, it, expect, vi, beforeEach } from 'vitest';
import { improveLine } from './improve';
import type { AiProviderConfig } from '@/types/settings';
import { AiRequestError } from '@/utils/errors';

vi.mock('./client', async (importOriginal) => {
  const original = await importOriginal<typeof import('./client')>();
  return { ...original, chatCompletion: vi.fn() };
});

import { chatCompletion } from './client';
const chatMock = vi.mocked(chatCompletion);

const config: AiProviderConfig = {
  provider: 'deepseek',
  baseURL: 'https://api.example.com/v1',
  apiKey: 'sk-x',
  model: 'm',
};

function mockReply(payload: unknown): void {
  chatMock.mockResolvedValueOnce(JSON.stringify(payload));
}

beforeEach(() => {
  chatMock.mockReset();
});

describe('improveLine', () => {
  it('返回契约结果，消息包含安全前缀与数据块', async () => {
    mockReply({ text: '主导搭建 CI 流水线，交付效率提升 30%', why: '动词更有力', addsFacts: false });

    const result = await improveLine(config, '负责搭建 CI', 'strong-verb', { owner: 'A 公司 · 后端' });

    expect(result.text).toBe('主导搭建 CI 流水线，交付效率提升 30%');
    expect(result.addsFacts).toBe(false);
    const [ , userMsg ] = chatMock.mock.calls[0][1];
    expect(userMsg.content).toContain('<<<LINE_START>>>');
    expect(chatMock.mock.calls[0][1][0].content).toContain('安全规则');
  });

  it('模型输出的多行结果被压成单行', async () => {
    mockReply({ text: '第一行\n第二行', why: 'r', addsFacts: false });
    const result = await improveLine(config, '负责搭建 CI', 'shorten', { owner: 'A' });
    expect(result.text).toBe('第一行 第二行');
  });

  it('空行直接抛错，不发请求', async () => {
    await expect(improveLine(config, '   ', 'shorten', { owner: 'A' })).rejects.toThrow('内容为空');
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('custom 模式缺少指令时抛错', async () => {
    await expect(
      improveLine(config, '负责搭建 CI', 'custom', { owner: 'A' }),
    ).rejects.toThrow('自定义');
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('custom 模式把用户指令写进消息', async () => {
    mockReply({ text: '更贴合测试岗的表述', why: 'r', addsFacts: false });
    await improveLine(config, '负责搭建 CI', 'custom', { owner: 'A', instruction: '更贴合测试岗' });
    const userMsg = chatMock.mock.calls[0][1][1].content as string;
    expect(userMsg).toContain('更贴合测试岗');
  });

  it('结构不符的输出抛统一错误', async () => {
    chatMock.mockResolvedValueOnce('{"unexpected": true}');
    await expect(
      improveLine(config, '负责搭建 CI', 'shorten', { owner: 'A' }),
    ).rejects.toBeInstanceOf(AiRequestError);
  });
});
