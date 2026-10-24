import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiParseResumeText } from './importParse';
import type { ResumeImportDraft } from '@/types/import';
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

const RAW = [
  '张三',
  '电话：13800138000  邮箱：zhangsan@test.com',
  '求职意向：高级测试开发工程师',
  '工作经历',
  '2020.03-至今 A公司 测试开发工程师',
  '负责搭建自动化测试平台，缺陷逃逸率降低 40%',
].join('\n');

function makeDraft(): ResumeImportDraft {
  return {
    fileName: 'resume.pdf',
    source: 'pdf',
    data: {
      name: '', title: '', phone: '', email: '', age: '',
      experienceYears: '', jobIntention: '', salary: '',
      github: '', website: '', summary: '',
      skills: [], experience: [], projects: [], education: [],
      evaluation: [{ text: '' }, { text: '' }, { text: '' }],
      customSections: [],
    },
    template: 'classic',
    sectionOrder: null,
    theme: null,
    targetJd: '',
    hiddenSections: [],
    warnings: ['本地规则解析的警告'],
    rawText: RAW,
    confidence: 30,
    structured: false,
  };
}

const AI_OUTPUT = {
  name: '张三',
  phone: '13800138000',
  email: 'zhangsan@test.com',
  jobIntention: '高级测试开发工程师',
  experience: [{
    company: 'A公司',
    role: '测试开发工程师',
    time: '2020.03-至今',
    items: ['负责搭建自动化测试平台，缺陷逃逸率降低 40%'],
  }],
};

beforeEach(() => {
  chatMock.mockReset();
});

describe('aiParseResumeText', () => {
  it('AI 输出经 normalize 后产出完整草稿，带核对警示与 aiAssisted 标记', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify(AI_OUTPUT));

    const draft = await aiParseResumeText(config, makeDraft());

    expect(draft.data.name).toBe('张三');
    expect(draft.data.experience).toHaveLength(1);
    // normalizeResumeData 为条目补 id
    expect(draft.data.experience[0].id).toBeTruthy();
    expect(draft.data.experience[0].items[0]).toContain('自动化测试平台');
    expect(draft.warnings).toHaveLength(1);
    expect(draft.warnings[0]).toContain('核对');
    expect(draft.aiAssisted).toBe(true);
    expect(draft.structured).toBe(false);
    // 元信息保持原文（文件名等不丢）
    expect(draft.fileName).toBe('resume.pdf');
    expect(draft.rawText).toBe(RAW);
  });

  it('置信度基于非空字段占比，比空草稿显著提升', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify(AI_OUTPUT));
    const draft = await aiParseResumeText(config, makeDraft());
    expect(draft.confidence).toBeGreaterThan(30);
  });

  it('原文过短直接抛错，不发请求', async () => {
    const empty = { ...makeDraft(), rawText: '太短' };
    await expect(aiParseResumeText(config, empty)).rejects.toThrow('原文内容过少');
    expect(chatMock).not.toHaveBeenCalled();
  });

  it('系统提示包含严格抽取纪律', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify(AI_OUTPUT));
    await aiParseResumeText(config, makeDraft());
    const systemMsg = chatMock.mock.calls[0][1][0].content as string;
    expect(systemMsg).toContain('绝不推断');
    expect(systemMsg).toContain('不要猜');
  });
});
