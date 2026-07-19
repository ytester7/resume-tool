import { describe, it, expect } from 'vitest';
import { sanitizeFilename, safeJsonParse, escapeHtml } from './sanitize';

describe('sanitizeFilename', () => {
  it('移除非法字符 / \\ : * ? " < > |', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij');
  });
  it('替换空格为下划线', () => {
    expect(sanitizeFilename('刘 用 测试')).toBe('刘_用_测试');
  });
  it('截断超长文件名到 100 字符', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeFilename(long).length).toBe(100);
  });
  it('空字符串返回 untitled', () => {
    expect(sanitizeFilename('')).toBe('untitled');
  });
  it('仅非法字符返回 untitled', () => {
    expect(sanitizeFilename('///\\\\***')).toBe('untitled');
  });
});

describe('safeJsonParse', () => {
  it('合法 JSON 返回解析值', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });
  it('非法 JSON 返回 null', () => {
    expect(safeJsonParse('{invalid}')).toBe(null);
  });
  it('null 输入返回 null', () => {
    expect(safeJsonParse(null)).toBe(null);
  });
});

describe('escapeHtml', () => {
  it('转义 < > & " ', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });
  it('普通文本不变', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
  it('转义 & 符号', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });
});
