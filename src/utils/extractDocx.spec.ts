import { describe, it, expect, vi } from 'vitest';
import { extractDocxText } from './extractDocx';

const extractRawText = vi.fn();

vi.mock('mammoth/mammoth.browser.js', () => ({
  default: { extractRawText: (...args: unknown[]) => extractRawText(...args) },
}));

describe('extractDocxText', () => {
  it('返回 mammoth 抽取的文本并规范化空行', async () => {
    extractRawText.mockResolvedValue({ value: '第一段\n\n\n\n第二段  \n' });
    const text = await extractDocxText(new ArrayBuffer(8));
    expect(text).toBe('第一段\n\n第二段');
    expect(extractRawText).toHaveBeenCalledWith({ arrayBuffer: expect.any(ArrayBuffer) });
  });

  it('空文档返回空字符串', async () => {
    extractRawText.mockResolvedValue({ value: '' });
    expect(await extractDocxText(new ArrayBuffer(8))).toBe('');
  });
});
