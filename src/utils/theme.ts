import type { ThemeConfig } from '@/types/resume';

/**
 * 将主题配置转换为 CSS 变量对象（空字符串字段不注入，
 * 保证未设置的主题保持模板默认样式，视觉零回归）。
 */
export function toCssVars(theme: ThemeConfig | null | undefined): Record<string, string> {
  if (!theme) return {};
  const vars: Record<string, string> = {};
  if (theme.primaryColor) vars['--c-primary'] = theme.primaryColor;
  if (theme.fontFamily) vars['--font-family'] = theme.fontFamily;
  return vars;
}

/** 主色预设色板（编辑器侧快捷选择） */
export const COLOR_PRESETS: string[] = [
  '#1890ff', '#c0392b', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16',
];

export interface FontPreset {
  label: string;
  /** CSS font-family 值，'' 表示系统默认（不注入变量） */
  value: string;
}

export const FONT_PRESETS: FontPreset[] = [
  { label: '系统默认', value: '' },
  { label: '黑体', value: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { label: '楷体', value: "'KaiTi', '楷体', 'STKaiti', serif" },
  { label: '宋体', value: "'SimSun', '宋体', 'Songti SC', serif" },
  { label: '等宽', value: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace" },
];
