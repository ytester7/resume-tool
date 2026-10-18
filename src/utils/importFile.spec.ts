import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectImportSource, importResumeFile } from './importFile';
import { extractPdfText } from './extractPdf';
import { extractDocxText } from './extractDocx';

vi.mock('./extractPdf', () => ({
  extractPdfText: vi.fn(async () => ({ text: '陈默\n13800138000\n工作经历\n2020.01-2022.01 某公司 测试工程师\n• 做测试', pageCount: 1 })),
}));

vi.mock('./extractDocx', () => ({
  extractDocxText: vi.fn(async () => '张三\nzhangsan@example.com\n\n工作经历\n2020.01-2022.01 某公司 开发工程师'),
}));

function makeFile(content: string | ArrayBuffer, name: string, type = ''): File {
  const bytes = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : new Uint8Array(content);
  return {
    name,
    type,
    size: bytes.byteLength,
    text: async () => typeof content === 'string'
      ? content
      : new TextDecoder().decode(bytes),
    arrayBuffer: async () => bytes.slice().buffer,
  } as unknown as File;
}

describe('detectImportSource', () => {
  it('按扩展名识别格式', () => {
    expect(detectImportSource('a.json')).toBe('json');
    expect(detectImportSource('a.PDF')).toBe('pdf');
    expect(detectImportSource('a.docx')).toBe('docx');
    expect(detectImportSource('a.md')).toBe('text');
    expect(detectImportSource('a.png')).toBe(null);
  });
});

describe('importResumeFile', () => {
  beforeEach(() => {
    vi.mocked(extractPdfText).mockClear();
    vi.mocked(extractDocxText).mockClear();
  });

  it('JSON 直接返回结构化草稿', async () => {
    const json = JSON.stringify({ name: '李四', title: '前端', skills: [], experience: [], projects: [], education: [], evaluation: [] });
    const draft = await importResumeFile(makeFile(json, 'resume.json', 'application/json'));
    expect(draft.structured).toBe(true);
    expect(draft.data.name).toBe('李四');
    expect(draft.confidence).toBe(100);
  });

  it('非法 JSON 抛错', async () => {
    await expect(importResumeFile(makeFile('{bad', 'resume.json'))).rejects.toThrow(/JSON/);
  });

  it('PDF 走文本解析', async () => {
    const draft = await importResumeFile(makeFile(new ArrayBuffer(8), 'resume.pdf', 'application/pdf'));
    expect(extractPdfText).toHaveBeenCalled();
    expect(draft.structured).toBe(false);
    expect(draft.data.name).toBe('陈默');
    expect(draft.data.experience.length).toBe(1);
  });

  it('PDF 没有文本层时给出扫描件提示', async () => {
    vi.mocked(extractPdfText).mockResolvedValueOnce({ text: '  ', pageCount: 1 });
    await expect(importResumeFile(makeFile(new ArrayBuffer(8), 'scan.pdf', 'application/pdf')))
      .rejects.toThrow(/扫描件/);
  });

  it('DOCX 走 mammoth 抽取', async () => {
    const draft = await importResumeFile(makeFile(new ArrayBuffer(8), 'resume.docx'));
    expect(extractDocxText).toHaveBeenCalled();
    expect(draft.data.name).toBe('张三');
    expect(draft.data.experience.length).toBe(1);
  });

  it('TXT 走文本解析', async () => {
    const draft = await importResumeFile(makeFile('王五\n15900159000\n教育背景\n2016.09-2020.06 某大学 本科', 'resume.txt'));
    expect(draft.data.name).toBe('王五');
    expect(draft.source).toBe('text');
  });

  it('不支持的格式抛错', async () => {
    await expect(importResumeFile(makeFile('x', 'photo.png'))).rejects.toThrow(/暂不支持/);
  });

  it('空文件抛错', async () => {
    await expect(importResumeFile(makeFile('', 'empty.txt'))).rejects.toThrow(/空的/);
  });
});
