import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePrintExport } from './usePrintExport';

describe('usePrintExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('预览就绪时调用浏览器打印', () => {
    const canvas = document.createElement('div');
    canvas.className = 'preview-canvas';
    document.body.appendChild(canvas);

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { printResume } = usePrintExport();

    expect(printResume()).toBe(true);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('预览未就绪时返回 false 且不打印', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { printResume } = usePrintExport();

    expect(printResume()).toBe(false);
    expect(printSpy).not.toHaveBeenCalled();
  });
});
