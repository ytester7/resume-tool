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

  // ===== mock 浏览器 API 路径 =====

  function makeMockDirHandle(files: Array<{ name: string; content: string; lastModified?: number }>) {
    const fileHandles = files.map(f => ({
      kind: 'file' as const,
      getFile: async () => ({
        name: f.name,
        size: f.content.length,
        lastModified: f.lastModified ?? Date.now(),
        text: async () => f.content,
      }),
    }));
    return {
      kind: 'directory' as const,
      values: async function* () {
        for (const fh of fileHandles) yield fh;
      },
      getFileHandle: async (name: string) => fileHandles.find(f => {
        const fh = f as any;
        return fh.getFile().then((file: any) => file.name === name).catch(() => false);
      }) ?? fileHandles[0],
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
    } as unknown as FileSystemDirectoryHandle;
  }

  function makeMockFileHandle(content: string, writeShouldFail = false) {
    const chunks: string[] = [];
    return {
      getFile: async () => ({ name: 'test.json', size: content.length, text: async () => content }),
      createWritable: async () => ({
        write: async (data: string) => {
          if (writeShouldFail) throw new Error('write failed');
          chunks.push(data);
        },
        close: async () => {},
      }),
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
    } as unknown as FileSystemFileHandle;
  }

  it('verifyPermission 已授权 handle 返回 true', async () => {
    const fs = useFileSystemStore();
    const handle = { queryPermission: async () => 'granted' } as any;
    const ok = await fs.verifyPermission(handle, 'read');
    expect(ok).toBe(true);
  });

  it('verifyPermission 未授权时请求授权', async () => {
    const fs = useFileSystemStore();
    const handle = {
      queryPermission: async () => 'prompt',
      requestPermission: async () => 'granted',
    } as any;
    const ok = await fs.verifyPermission(handle, 'readwrite');
    expect(ok).toBe(true);
  });

  it('verifyPermission 请求被拒绝返回 false', async () => {
    const fs = useFileSystemStore();
    const handle = {
      queryPermission: async () => 'prompt',
      requestPermission: async () => 'denied',
    } as any;
    const ok = await fs.verifyPermission(handle, 'read');
    expect(ok).toBe(false);
  });

  it('verifyPermission 抛异常返回 false', async () => {
    const fs = useFileSystemStore();
    const handle = {
      queryPermission: async () => { throw new Error('fail'); },
    } as any;
    const ok = await fs.verifyPermission(handle, 'read');
    expect(ok).toBe(false);
  });

  it('scanDirectory 扫描目录返回 json 文件（按修改时间倒序）', async () => {
    const fs = useFileSystemStore();
    const dir = makeMockDirHandle([
      { name: 'a.json', content: '{"a":1}', lastModified: 1000 },
      { name: 'b.json', content: '{"b":2}', lastModified: 2000 },
      { name: 'c.txt', content: 'not json' },
    ]);
    (fs as any).dirHandle = dir;
    const entries = await fs.scanDirectory();
    expect(entries.length).toBe(2);
    expect(entries[0].name).toBe('b.json');
    expect(entries[1].name).toBe('a.json');
  });

  it('scanDirectory 扫描异常返回空数组', async () => {
    const fs = useFileSystemStore();
    const dir = {
      kind: 'directory',
      values: async function* () { throw new Error('scan fail'); },
    } as any;
    (fs as any).dirHandle = dir;
    const entries = await fs.scanDirectory();
    expect(entries).toEqual([]);
  });

  it('readFileByName 读取并解析 JSON', async () => {
    const fs = useFileSystemStore();
    const dir = makeMockDirHandle([{ name: 'test.json', content: '{"name":"张三"}' }]);
    (fs as any).dirHandle = dir;
    const data = await fs.readFileByName('test.json');
    expect(data).toEqual({ name: '张三' });
  });

  it('readFileByName 文件不存在返回 null', async () => {
    const fs = useFileSystemStore();
    const dir = {
      kind: 'directory',
      getFileHandle: async () => { throw new Error('not found'); },
    } as any;
    (fs as any).dirHandle = dir;
    const data = await fs.readFileByName('missing.json');
    expect(data).toBe(null);
  });

  it('writeToFile 成功写入返回 true', async () => {
    const fs = useFileSystemStore();
    const handle = makeMockFileHandle('');
    const ok = await fs.writeToFile(handle, 'content');
    expect(ok).toBe(true);
  });

  it('writeToFile 写入失败返回 false', async () => {
    const fs = useFileSystemStore();
    const handle = makeMockFileHandle('', true);
    const ok = await fs.writeToFile(handle, 'content');
    expect(ok).toBe(false);
  });

  it('pickOpenFileLegacy 解析文件成功', async () => {
    const fs = useFileSystemStore();
    // mock input element
    const fakeInput = {
      type: '', accept: '', files: [{ name: 'a.json', text: async () => '{"a":1}' }],
      onchange: null as any, click: () => setTimeout(() => fakeInput.onchange(), 0),
    };
    const origCreate = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'input') return fakeInput as any;
      return origCreate.call(document, tag);
    });
    const result = await fs.pickOpenFile();
    expect(result?.data).toEqual({ a: 1 });
    expect(result?.fileName).toBe('a.json');
    vi.restoreAllMocks();
  });
});
