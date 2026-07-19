export function sanitizeFilename(name: string): string {
  if (!name) return 'untitled';
  const cleaned = name
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100);
  return cleaned || 'untitled';
}

export function safeJsonParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
