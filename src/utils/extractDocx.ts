/** 从 Word（.docx）抽取纯文本 */

/**
 * docx 解析使用 mammoth 的浏览器构建，避免把 Node 版依赖带进包。
 * 复杂表格、文本框会退化为段落，这是导入初稿可以接受的损失。
 */
export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const mammoth = (await import('mammoth/mammoth.browser.js')).default;
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
