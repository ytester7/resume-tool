import { describe, it, expect } from 'vitest';
import { ICONS, getIcon } from './icons';

describe('icons', () => {
  it('ICONS 字典非空', () => {
    expect(Object.keys(ICONS).length).toBeGreaterThan(30);
  });

  it('包含新增的 drag 图标', () => {
    expect(ICONS.drag).toContain('<svg');
    expect(ICONS.drag).toContain('</svg>');
  });

  it('getIcon 返回已知图标的 SVG', () => {
    const svg = getIcon('phone');
    expect(svg).toBe(ICONS.phone);
    expect(svg).toContain('<svg');
  });

  it('getIcon 未知图标返回空字符串', () => {
    expect(getIcon('not-exist')).toBe('');
  });
});
