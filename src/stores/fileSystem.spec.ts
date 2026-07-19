import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useFileSystemStore } from './fileSystem';

describe('useFileSystemStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // jsdom 未实现 URL.createObjectURL / revokeObjectURL，stub 之
    if (!URL.createObjectURL) {
      (URL as any).createObjectURL = () => 'blob:mock';
    }
    if (!URL.revokeObjectURL) {
      (URL as any).revokeObjectURL = () => {};
    }
  });

  it('初始状态 dirHandle 为 null', () => {
    const fs = useFileSystemStore();
    expect(fs.dirHandle).toBe(null);
  });

  it('verifyPermission 无 handle 返回 false', async () => {
    const fs = useFileSystemStore();
    const ok = await fs.verifyPermission(null as any, 'read');
    expect(ok).toBe(false);
  });

  it('scanDirectory 无 dirHandle 返回空数组', async () => {
    const fs = useFileSystemStore();
    const entries = await fs.scanDirectory();
    expect(entries).toEqual([]);
  });

  it('readFileByName 无 dirHandle 返回 null', async () => {
    const fs = useFileSystemStore();
    const data = await fs.readFileByName('test.json');
    expect(data).toBe(null);
  });

  it('writeToFile handle 为 null 返回 false', async () => {
    const fs = useFileSystemStore();
    const ok = await fs.writeToFile(null as any, 'content');
    expect(ok).toBe(false);
  });

  it('downloadAsBlob 创建 a 标签并触发点击', () => {
    const fs = useFileSystemStore();
    const createSpy = vi.spyOn(document, 'createElement');
    fs.downloadAsBlob('content', 'test.json');
    expect(createSpy).toHaveBeenCalledWith('a');
    createSpy.mockRestore();
  });
});
