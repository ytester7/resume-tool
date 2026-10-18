import { describe, it, expect } from 'vitest';
import { A4_HEIGHT_PX, pageCountOf, pageBreakOffsets } from './page';

describe('pageCountOf', () => {
  it('空内容 / 非法高度按 1 页处理', () => {
    expect(pageCountOf(0)).toBe(1);
    expect(pageCountOf(-10)).toBe(1);
    expect(pageCountOf(Number.NaN)).toBe(1);
  });

  it('刚好一页仍是 1 页，超出 1px 变 2 页', () => {
    expect(pageCountOf(A4_HEIGHT_PX)).toBe(1);
    expect(pageCountOf(A4_HEIGHT_PX + 1)).toBe(2);
  });

  it('两页整仍为 2 页', () => {
    expect(pageCountOf(A4_HEIGHT_PX * 2)).toBe(2);
    expect(pageCountOf(A4_HEIGHT_PX * 2 + 1)).toBe(3);
  });
});

describe('pageBreakOffsets', () => {
  it('单页没有分页线', () => {
    expect(pageBreakOffsets(A4_HEIGHT_PX)).toEqual([]);
  });

  it('两页在 297mm 处有一条分页线', () => {
    expect(pageBreakOffsets(A4_HEIGHT_PX * 2)).toEqual([A4_HEIGHT_PX]);
  });

  it('三页有两条分页线', () => {
    const offsets = pageBreakOffsets(A4_HEIGHT_PX * 3 - 10);
    expect(offsets).toHaveLength(2);
    expect(offsets[0]).toBeCloseTo(A4_HEIGHT_PX);
    expect(offsets[1]).toBeCloseTo(A4_HEIGHT_PX * 2);
  });
});
