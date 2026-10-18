import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/** PDF 文本层抽取结果 */
export interface PdfExtractResult {
  text: string;
  pageCount: number;
}

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
}

function toTextItems(items: readonly unknown[]): PdfTextItem[] {
  return items
    .map(item => item as { str?: unknown; hasEOL?: boolean })
    .filter(item => typeof item.str === 'string')
    .map(item => ({ str: item.str as string, hasEOL: item.hasEOL }));
}

/**
 * 把 pdf.js 的文本片段拼成可读文本。
 *
 * pdf.js 不会返回空格，英文单词容易粘连；这里在「前一个字符和后一个字符
 * 都是 ASCII 字母/数字」时补一个空格，中文之间保持原样。
 */
export function joinPdfTextItems(items: PdfTextItem[]): string {
  let out = '';
  for (const item of items) {
    const str = item.str ?? '';
    if (str) {
      const prev = out.slice(-1);
      if (prev && /[A-Za-z0-9]/.test(prev) && /^[A-Za-z0-9]/.test(str)) {
        out += ' ';
      }
      out += str;
    }
    if (item.hasEOL) out += '\n';
  }
  return out
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 抽取 PDF 文本层。
 *
 * 扫描件/图片型 PDF 没有文本层，会得到空字符串，由调用方提示用户。
 */
export async function extractPdfText(buffer: ArrayBuffer): Promise<PdfExtractResult> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
  }).promise;

  try {
    if (doc.numPages > 20) {
      throw new Error('PDF 页数超过 20 页，请截取简历部分后再导入');
    }
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(joinPdfTextItems(toTextItems(content.items)));
      page.cleanup();
    }
    return { text: pages.filter(Boolean).join('\n\n'), pageCount: doc.numPages };
  } finally {
    await doc.destroy();
  }
}
