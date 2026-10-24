import type { ResumeData, SectionId, TemplateName, ThemeConfig } from './resume';

export type ImportSource = 'json' | 'pdf' | 'docx' | 'text';

/** 一次导入的完整草稿，供导入确认弹窗展示与 App 创建 Tab */
export interface ResumeImportDraft {
  fileName: string;
  source: ImportSource;
  data: ResumeData;
  template: TemplateName;
  sectionOrder: SectionId[] | null;
  theme: ThemeConfig | null;
  targetJd: string;
  /** 文件中保存的隐藏区块（文本导入为空数组） */
  hiddenSections: SectionId[];
  warnings: string[];
  rawText: string;
  /** 0–100 的字段识别完整度 */
  confidence: number;
  /** JSON 是结构化数据，可直接打开；PDF/Word/文本需要确认 */
  structured: boolean;
  /** 本草稿由 AI 解析生成（隐私文案与核对提示据此展示） */
  aiAssisted?: boolean;
}
