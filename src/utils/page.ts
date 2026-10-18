/** A4 页面尺寸与分页计算（CSS 像素，96dpi） */

export const MM_TO_PX = 96 / 25.4;

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

/** 210mm ≈ 793.7px，297mm ≈ 1122.5px */
export const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;
export const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX;

/** 按内容高度估算页数，至少 1 页（1e-6 容差避免刚好整页时多算一页） */
export function pageCountOf(contentHeight: number): number {
  if (!Number.isFinite(contentHeight) || contentHeight <= 0) return 1;
  return Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX - 1e-6));
}

/** 返回第 2 页起的页边界位置（px），用于在预览里画分页线 */
export function pageBreakOffsets(contentHeight: number): number[] {
  const count = pageCountOf(contentHeight);
  const offsets: number[] = [];
  for (let i = 1; i < count; i++) {
    offsets.push(i * A4_HEIGHT_PX);
  }
  return offsets;
}
