import { describe, it, expect } from 'vitest';
import { toCssVars, COLOR_PRESETS, FONT_PRESETS } from './theme';

describe('toCssVars', () => {
  it('null / undefined 返回空对象', () => {
    expect(toCssVars(null)).toEqual({});
    expect(toCssVars(undefined)).toEqual({});
  });

  it('空字符串字段不注入', () => {
    expect(toCssVars({ primaryColor: '', fontFamily: '' })).toEqual({});
  });

  it('仅注入非空字段', () => {
    expect(toCssVars({ primaryColor: '#ff0000', fontFamily: '' }))
      .toEqual({ '--c-primary': '#ff0000' });
    expect(toCssVars({ primaryColor: '', fontFamily: 'serif' }))
      .toEqual({ '--font-family': 'serif' });
  });

  it('完整映射', () => {
    expect(toCssVars({ primaryColor: '#ff0000', fontFamily: 'serif' })).toEqual({
      '--c-primary': '#ff0000',
      '--font-family': 'serif',
    });
  });
});

describe('主题预设', () => {
  it('主色预设非空且为 hex 字符串', () => {
    expect(COLOR_PRESETS.length).toBeGreaterThan(0);
    COLOR_PRESETS.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it('字体预设 label/value 成对，首个为系统默认空值', () => {
    expect(FONT_PRESETS[0]).toEqual({ label: '系统默认', value: '' });
    FONT_PRESETS.forEach(f => {
      expect(typeof f.label).toBe('string');
      expect(typeof f.value).toBe('string');
    });
  });
});
