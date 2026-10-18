import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinPdfTextItems, extractPdfText } from './extractPdf';

const getDocumentMock = vi.fn();

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'mock-worker.mjs' }));

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => getDocumentMock(...args),
}));

function fakeDoc(pages: string[][], numPages = pages.length) {
  return {
    numPages,
    getPage: async (n: number) => ({
      getTextContent: async () => ({
        items: pages[n - 1].map(str => ({ str })),
      }),
      cleanup: () => {},
    }),
    destroy: async () => {},
  };
}

describe('joinPdfTextItems', () => {
  it('中文片段直接拼接，不额外加空格', () => {
    expect(joinPdfTextItems([{ str: '软件' }, { str: '测试' }])).toBe('软件测试');
  });

  it('英文片段之间补空格', () => {
    expect(joinPdfTextItems([{ str: 'Hello' }, { str: 'World' }])).toBe('Hello World');
  });

  it('hasEOL 产生换行，并压缩多余空行', () => {
    const text = joinPdfTextItems([{ str: '第一行', hasEOL: true }, { str: '第二行' }]);
    expect(text).toBe('第一行\n第二行');
  });
});

describe('extractPdfText', () => {
  beforeEach(() => {
    getDocumentMock.mockReset();
  });

  it('按页拼接文本并返回页数', async () => {
    getDocumentMock.mockReturnValue({ promise: Promise.resolve(fakeDoc([['第一页'], ['第二页']])) });
    const result = await extractPdfText(new ArrayBuffer(8));
    expect(result.pageCount).toBe(2);
    expect(result.text).toContain('第一页');
    expect(result.text).toContain('第二页');
  });

  it('超过 20 页拒绝导入', async () => {
    getDocumentMock.mockReturnValue({ promise: Promise.resolve(fakeDoc([[]], 21)) });
    await expect(extractPdfText(new ArrayBuffer(8))).rejects.toThrow(/20 页/);
  });
});
