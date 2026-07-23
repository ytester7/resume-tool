import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTabsStore } from '@/stores/tabs';
import { usePdfExport } from './usePdfExport';

// mock html2pdf 与 URL.createObjectURL
// html2pdf.js 是 CommonJS 模块，且 API 为链式：html2pdf().set(opt).from(el).save()
vi.mock('html2pdf.js', () => {
  const worker = {
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    save: vi.fn().mockResolvedValue(undefined),
  };
  return { default: vi.fn(() => worker) };
});

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('blob:mock'),
  revokeObjectURL: vi.fn(),
});

describe('usePdfExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('无 active Tab 返回 false', async () => {
    const { exportActiveToPdf } = usePdfExport();
    const result = await exportActiveToPdf(document.createElement('div'));
    expect(result).toBe(false);
  });

  it('有 active Tab 调用 html2pdf', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A', data: { name: '张三' } as any });
    const { exportActiveToPdf } = usePdfExport();
    const element = document.createElement('div');
    element.innerHTML = '<div class="resume">张三</div>';
    document.body.appendChild(element);
    const result = await exportActiveToPdf(element);
    expect(result).toBe(true);
    document.body.removeChild(element);
  });
});
