import type { ResumeImportDraft, ImportSource } from '@/types/import';
import { parseResumeFile } from './parseResume';
import { parseResumeText } from './importText';
import { extractPdfText } from './extractPdf';
import { extractDocxText } from './extractDocx';
import { ResumeParseError } from './errors';

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export function detectImportSource(fileName: string): ImportSource | null {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (ext === 'json') return 'json';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt' || ext === 'md' || ext === 'text') return 'text';
  return null;
}

function ensureReadable(file: File): ImportSource {
  const source = detectImportSource(file.name);
  if (!source) {
    throw new Error('暂不支持该文件格式，请选择 PDF / Word（.docx）/ JSON / TXT');
  }
  if (file.size === 0) throw new Error('文件是空的');
  if (file.size > MAX_FILE_SIZE) throw new Error('文件超过 15MB，请压缩后再导入');
  return source;
}

function draftFromText(
  fileName: string,
  source: ImportSource,
  text: string,
): ResumeImportDraft {
  const result = parseResumeText(text);
  return {
    fileName,
    source,
    data: result.data,
    template: 'classic',
    sectionOrder: null,
    theme: null,
    targetJd: '',
    hiddenSections: [],
    warnings: result.warnings,
    rawText: text,
    confidence: result.confidence,
    structured: false,
  };
}

/**
 * 读取用户选择的文件，转换成可确认的简历草稿。
 *
 * JSON 走已有的结构化解析（向后兼容旧格式）；
 * PDF / Word / 文本先抽文本，再用本地规则解析成 ResumeData。
 */
export async function importResumeFile(file: File): Promise<ResumeImportDraft> {
  const source = ensureReadable(file);

  if (source === 'json') {
    const text = await file.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ResumeParseError('文件内容不是合法 JSON');
    }
    const parsed = parseResumeFile(raw);
    return {
      fileName: file.name,
      source,
      data: parsed.data,
      template: parsed.template,
      sectionOrder: parsed.sectionOrder,
      theme: parsed.theme,
      targetJd: parsed.targetJd,
      hiddenSections: parsed.hiddenSections,
      warnings: [],
      rawText: text.slice(0, 4000),
      confidence: 100,
      structured: true,
    };
  }

  if (source === 'pdf') {
    const { text } = await extractPdfText(await file.arrayBuffer());
    if (text.trim().length < 20) {
      throw new Error('这个 PDF 没有可提取的文字（可能是扫描件），暂不支持图片型 PDF');
    }
    return draftFromText(file.name, source, text);
  }

  if (source === 'docx') {
    const text = await extractDocxText(await file.arrayBuffer());
    if (text.trim().length < 20) {
      throw new Error('Word 文档里没有读到文字，请检查文件是否为空');
    }
    return draftFromText(file.name, source, text);
  }

  const text = await file.text();
  if (text.trim().length < 10) throw new Error('文本内容过少，无法导入');
  return draftFromText(file.name, source, text);
}
