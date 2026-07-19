import { describe, it, expect } from 'vitest';
import { ResumeError, ResumeParseError, FileHandleError, PermissionError } from './errors';

describe('errors', () => {
  it('ResumeError 携带 code', () => {
    const e = new ResumeError('msg', 'CODE_X');
    expect(e.message).toBe('msg');
    expect(e.code).toBe('CODE_X');
    expect(e.name).toBe('ResumeError');
    expect(e instanceof Error).toBe(true);
  });

  it('ResumeParseError 携带 field', () => {
    const e = new ResumeParseError('bad', 'skills');
    expect(e.code).toBe('PARSE_ERROR');
    expect(e.field).toBe('skills');
    expect(e instanceof ResumeError).toBe(true);
  });

  it('FileHandleError 携带 handleKind', () => {
    const e = new FileHandleError('fail', 'dir');
    expect(e.code).toBe('FILE_HANDLE_ERROR');
    expect(e.handleKind).toBe('dir');
  });

  it('PermissionError', () => {
    const e = new PermissionError('denied');
    expect(e.code).toBe('PERMISSION_ERROR');
    expect(e.message).toBe('denied');
  });
});
