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
