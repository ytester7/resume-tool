import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeJdWithAi } from './jdAnalysis';
import { SAMPLE_RESUMES } from '@/data/samples';
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

const VALID_ANALYSIS = {
  summary: '整体匹配中等，后端经验扎实，缺少云原生实践。',
  missingConcepts: ['Kubernetes 运维', '可观测性建设'],
  strengths: ['Python 服务端开发', '自动化测试'],
  suggestions: [
    { section: 'experience', issue: '经历未体现容器化交付场景', rewrite: '主导服务容器化改造，镜像构建时间缩短 __%', impact: 'high' },
    { section: 'skills', issue: '技能区缺少云原生关键词', impact: 'medium' },
  ],
};

beforeEach(() => {
  chatMock.mockReset();
});

describe('analyzeJdWithAi', () => {
  it('解析合法分析结果，JD 与简历走数据块包裹', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify(VALID_ANALYSIS));

    const result = await analyzeJdWithAi(
      config,
      '负责 Kubernetes 集群运维与可观测性建设，熟悉 Python',
      SAMPLE_RESUMES[0].data,
    );

    expect(result.missingConcepts).toHaveLength(2);
    expect(result.suggestions[0].impact).toBe('high');
    const userMsg = chatMock.mock.calls[0][1][1].content as string;
    expect(userMsg).toContain('<<<JD_TEXT_START>>>');
    expect(userMsg).toContain('<<<RESUME_TEXT_START>>>');
    // 系统提示遵循「AI 不出分数」纪律
    const systemMsg = chatMock.mock.calls[0][1][0].content as string;
    expect(systemMsg).toContain('绝不输出分数');
  });

  it('JD 过短直接抛错，不发请求', async () => {
    await expect(analyzeJdWithAi(config, '太短', SAMPLE_RESUMES[0].data)).rejects.toThrow('JD 内容过少');
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('section 非法时整体校验失败', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({
      ...VALID_ANALYSIS,
      suggestions: [{ section: 'not-a-section', issue: 'x', impact: 'low' }],
    }));

    await expect(
      analyzeJdWithAi(config, '这是一个足够长的岗位描述内容用于测试校验逻辑', SAMPLE_RESUMES[0].data),
    ).rejects.toThrow();
  });
});
