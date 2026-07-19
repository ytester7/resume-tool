import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { safeJsonParse } from '@/utils/sanitize';
import { PermissionError, FileHandleError } from '@/utils/errors';

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
      const query = await (handle as any).queryPermission(opts);
      if (query === 'granted') return true;
      const request = await (handle as any).requestPermission(opts);
      return request === 'granted';
    } catch {
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
    } catch {
      // 静默失败
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
    } catch {
      // 静默
    }
  }

  async function pickDirectory(): Promise<DirFileEntry[]> {
    if (!isSupported.value) return [];
    try {
      const handle = await (window as any).showDirectoryPicker();
      dirHandle.value = handle;
      await persistDirectoryHandle(handle);
      return await scanDirectory();
    } catch (e: any) {
      if (e.name === 'AbortError') return [];
      throw new FileHandleError('选择目录失败: ' + e.message, 'dir');
    }
  }

  async function scanDirectory(): Promise<DirFileEntry[]> {
    if (!dirHandle.value) return [];
    const entries: DirFileEntry[] = [];
    try {
      for await (const entry of dirHandle.value.values()) {
        if (entry.kind === 'file') {
          const file = await (entry as FileSystemFileHandle).getFile();
          if (file.name.endsWith('.json')) {
            entries.push({
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
            });
          }
        }
      }
    } catch {
      return [];
    }
    return entries.sort((a, b) => b.lastModified - a.lastModified);
  }

  async function readFileByName(name: string): Promise<any | null> {
    if (!dirHandle.value) return null;
    try {
      const fileHandle = await dirHandle.value.getFileHandle(name);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return safeJsonParse(text);
    } catch {
      return null;
    }
  }

  async function pickOpenFile(): Promise<{ data: any; fileName: string; handle: FileSystemFileHandle } | null> {
    if (!isSupported.value) {
      return await pickOpenFileLegacy();
    }
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON 简历', accept: { 'application/json': ['.json'] } }],
      });
      const file = await handle.getFile();
      const text = await file.text();
      const data = safeJsonParse(text);
      if (!data) throw new FileHandleError('文件内容无法解析', 'file');
      return { data, fileName: file.name, handle };
    } catch (e: any) {
      if (e.name === 'AbortError') return null;
      throw e;
    }
  }

  function pickOpenFileLegacy(): Promise<{ data: any; fileName: string; handle: FileSystemFileHandle } | null> {
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
        resolve({ data, fileName: file.name, handle: null as any });
      };
      input.click();
    });
  }

  async function pickSaveFile(suggestedName: string): Promise<FileSystemFileHandle | null> {
    if (!isSupported.value) return null;
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{ description: 'JSON 简历', accept: { 'application/json': ['.json'] } }],
      });
      return handle;
    } catch (e: any) {
      if (e.name === 'AbortError') return null;
      throw new PermissionError('保存文件失败: ' + e.message);
    }
  }

  async function writeToFile(handle: FileSystemFileHandle | null, content: string): Promise<boolean> {
    if (!handle) return false;
    try {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch {
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
