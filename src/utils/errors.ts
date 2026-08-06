export class ResumeError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ResumeError';
  }
}

export class ResumeParseError extends ResumeError {
  constructor(message: string, public field?: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'ResumeParseError';
  }
}

export class FileHandleError extends ResumeError {
  constructor(message: string, public handleKind: 'file' | 'dir') {
    super(message, 'FILE_HANDLE_ERROR');
    this.name = 'FileHandleError';
  }
}

export class PermissionError extends ResumeError {
  constructor(message: string) {
    super(message, 'PERMISSION_ERROR');
    this.name = 'PermissionError';
  }
}

/**
 * 从任意被 catch 的值中提取可靠的错误消息字符串。
 *
 * 防御 throw 非 Error 值（如 `throw 'foo'`、`throw { code: 1 }`、
 * DOMException 子类、跨 realm 错误等）导致直接读 `e.message` 时
 * 触发二次异常或拿到 `undefined`。
 */
export function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message || e.name || 'Error';
  if (typeof e === 'string') return e;
  if (e === null || e === undefined) return '未知错误';
  if (typeof e === 'object' && 'message' in e) {
    const msg = (e as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  try {
    return String(e);
  } catch {
    return '未知错误';
  }
}
