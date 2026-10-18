import { describe, it, expect } from 'vitest';
import { computeCropRect } from './image';

describe('computeCropRect', () => {
  it('横图按高度裁出 3:4，左右居中', () => {
    const rect = computeCropRect(1600, 800);
    expect(rect).toEqual({ sx: 500, sy: 0, sw: 600, sh: 800 });
  });

  it('竖图按宽度裁出 3:4，上下居中', () => {
    const rect = computeCropRect(600, 1200);
    expect(rect).toEqual({ sx: 0, sy: 200, sw: 600, sh: 800 });
  });

  it('已经是 3:4 时不裁剪', () => {
    const rect = computeCropRect(300, 400);
    expect(rect).toEqual({ sx: 0, sy: 0, sw: 300, sh: 400 });
  });

  it('支持自定义比例', () => {
    const rect = computeCropRect(1000, 1000, 1);
    expect(rect).toEqual({ sx: 0, sy: 0, sw: 1000, sh: 1000 });
  });

  it('非法尺寸抛错', () => {
    expect(() => computeCropRect(0, 100)).toThrow(/不合法/);
  });
});
