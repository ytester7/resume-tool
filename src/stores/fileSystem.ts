import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { safeJsonParse } from '@/utils/sanitize';
import { PermissionError, FileHandleError, ResumeParseError, toErrorMessage } from '@/utils/errors';

export interface DirFileEntry {
  name: string;
  size: number;
  lastModified: number;
}

const DB_NAME = 'ResumeToolDB';
const DB_VERSION = 1;
const DIR_HANDLE_STORE = 'dirHandle';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DIR_HANDLE_STORE)) {
        db.createObjectStore(DIR_HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === 'AbortError' || e.name === 'DOMException' && e.message.includes('abort'));
}

export const useFileSystemStore = defineStore('fileSystem', () => {
  const dirHandle = ref<FileSystemDirectoryHandle | null>(null);
  const isSupported = computed(
    () => typeof window !== 'undefined' && 'showOpenFilePicker' in window,
  );

  async function verifyPermission(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle | null,
    mode: 'read' | 'readwrite',
  ): Promise<boolean> {
    if (!handle) return false;
    try {
      const opts = { mode };
      const query = await handle.queryPermission(opts);
      if (query === 'granted') return true;
      const request = await handle.requestPermission(opts);
      return request === 'granted';
    } catch (e) {
      // queryPermission / requestPermission 失败通常意味着句柄失效或权限被拒，
      // 上层调用方期望布尔结果，这里降级返回 false 但记录原因便于排查。
      console.warn('[fileSystem] verifyPermission failed', e);
      return false;
    }
  }

  async function persistDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const db = await openDb();
      const tx = db.transaction(DIR_HANDLE_STORE, 'readwrite');
      tx.objectStore(DIR_HANDLE_STORE).put(handle, 'dir');
      return new Promise((resolve) => {
        tx.oncomplete = () => { db.close(); resolve(); };
      });
    } catch (e) {
      // IndexedDB 在隐私模式 / 配额满时会失败，目录句柄持久化为非关键功能，
      // 静默降级（每次启动需重新选择目录）即可。
      console.warn('[fileSystem] persistDirectoryHandle failed', e);
    }
  }

  async function restoreDirectoryHandle(): Promise<void> {
    try {
      const db = await openDb();
      const tx = db.transaction(DIR_HANDLE_STORE, 'readonly');
      const req = tx.objectStore(DIR_HANDLE_STORE).get('dir');
      return new Promise((resolve) => {
        req.onsuccess = async () => {
          db.close();
          const handle = req.result as FileSystemDirectoryHandle | undefined;
          if (handle) {
            const ok = await verifyPermission(handle, 'read');
            if (ok) dirHandle.value = handle;
          }
          resolve();
        };
        req.onerror = () => { db.close(); resolve(); };
      });
    } catch (e) {
      console.warn('[fileSystem] restoreDirectoryHandle failed', e);
    }
  }

  async function pickDirectory(): Promise<DirFileEntry[]> {
    if (!isSupported.value || !window.showDirectoryPicker) return [];
    try {
      const handle = await window.showDirectoryPicker();
      dirHandle.value = handle;
      await persistDirectoryHandle(handle);
      return await scanDirectory();
    } catch (e) {
      if (isAbortError(e)) return [];
      throw new FileHandleError('选择目录失败: ' + toErrorMessage(e), 'dir');
    }
  }

  async function scanDirectory(): Promise<DirFileEntry[]> {
    if (!dirHandle.value) return [];
    const entries: DirFileEntry[] = [];
    try {
      for await (const entry of dirHandle.value.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.name.endsWith('.json')) {
            entries.push({
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
            });
          }
        }
      }
    } catch (e) {
      // 扫描目录失败可能是权限被吊销或句柄失效，保留兜底 [] 行为（与历史测试一致），
      // 但记录原因便于排查。
      console.warn('[fileSystem] scanDirectory failed', e);
      return [];
    }
    return entries.sort((a, b) => b.lastModified - a.lastModified);
  }

  async function readFileByName<T = unknown>(name: string): Promise<T | null> {
    if (!dirHandle.value) return null;
    try {
      const fileHandle = await dirHandle.value.getFileHandle(name);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return safeJsonParse<T>(text);
    } catch (e) {
      console.warn('[fileSystem] readFileByName failed', e);
      return null;
    }
  }

  async function pickOpenFile(): Promise<{ data: unknown; fileName: string; handle: FileSystemFileHandle | null } | null> {
    if (!isSupported.value || !window.showOpenFilePicker) {
      return await pickOpenFileLegacy();
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON 简历', accept: { 'application/json': ['.json'] } }],
      });
      const file = await handle.getFile();
      const text = await file.text();
      const data = safeJsonParse(text);
      if (!data) throw new ResumeParseError('文件内容无法解析为 JSON');
      return { data, fileName: file.name, handle };
    } catch (e) {
      if (isAbortError(e)) return null;
      throw e;
    }
  }

  function pickOpenFileLegacy(): Promise<{ data: unknown; fileName: string; handle: FileSystemFileHandle | null } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const text = await file.text();
        const data = safeJsonParse(text);
        if (!data) { resolve(null); return; }
        // Legacy 降级路径无 File System Access API 句柄，handle 显式为 null。
        resolve({ data, fileName: file.name, handle: null });
      };
      input.click();
    });
  }

  async function pickSaveFile(suggestedName: string): Promise<FileSystemFileHandle | null> {
    if (!isSupported.value || !window.showSaveFilePicker) return null;
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'JSON 简历', accept: { 'application/json': ['.json'] } }],
      });
      return handle;
    } catch (e) {
      if (isAbortError(e)) return null;
      throw new PermissionError('保存文件失败: ' + toErrorMessage(e));
    }
  }

  async function writeToFile(handle: FileSystemFileHandle | null, content: string): Promise<boolean> {
    if (!handle) return false;
    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (e) {
      // 写入失败常见于：磁盘满、句柄失效、用户在权限提示中取消。
      // 保留兜底 false 行为（与历史测试一致），同时记录原因。
      console.warn('[fileSystem] writeToFile failed', e);
      return false;
    }
  }

  function downloadAsBlob(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    dirHandle, isSupported,
    verifyPermission, persistDirectoryHandle, restoreDirectoryHandle,
    pickDirectory, scanDirectory, readFileByName,
    pickOpenFile, pickSaveFile, writeToFile, downloadAsBlob,
  };
});
