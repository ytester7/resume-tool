import type { TemplateName } from '@/types/resume';

/**
 * 模板缩略图：由 `npm run thumbs` 生成到 src/assets/template-thumbs/。
 * 使用 import.meta.glob 让 Vite 在构建时建立静态资源映射。
 */
const modules = import.meta.glob('../assets/template-thumbs/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const thumbs: Partial<Record<TemplateName, string>> = {};

for (const [path, url] of Object.entries(modules)) {
  const file = path.split('/').pop() ?? '';
  const name = file.replace(/\.(jpg|jpeg|png|webp)$/i, '') as TemplateName;
  if (name) thumbs[name] = url;
}

export function templateThumb(name: TemplateName): string {
  return thumbs[name] ?? '';
}
