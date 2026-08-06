import { describe, it, expect } from 'vitest';
import { ResumeError, ResumeParseError, FileHandleError, PermissionError, toErrorMessage } from './errors';

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

describe('toErrorMessage', () => {
  it('从 Error 实例提取 message', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('Error message 为空时回退到 name（非空字符串）', () => {
    const e = new Error();
    const result = toErrorMessage(e);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('从字符串 throw 值提取', () => {
    expect(toErrorMessage('string error')).toBe('string error');
  });

  it('null 返回兜底文案', () => {
    expect(toErrorMessage(null)).toBe('未知错误');
  });

  it('undefined 返回兜底文案', () => {
    expect(toErrorMessage(undefined)).toBe('未知错误');
  });

  it('从带 message 字段的对象提取', () => {
    expect(toErrorMessage({ message: 'obj msg' })).toBe('obj msg');
  });

  it('对象 message 非 string 时回退到 String(e)', () => {
    expect(toErrorMessage({ message: 123 })).toBe('[object Object]');
  });

  it('从数字提取', () => {
    expect(toErrorMessage(42)).toBe('42');
  });

  it('ResumeError 子类正常工作', () => {
    expect(toErrorMessage(new PermissionError('denied'))).toBe('denied');
  });
});
