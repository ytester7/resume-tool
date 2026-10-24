import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  PROJECT_ROOT, MCP_DATA_ROOT, BROWSER_PROFILE_DIR, BROWSERS_DIR, LOGS_DIR,
  ensureDataDirs, isAllowedZhipinUrl,
} from '../src/paths.js';
import fs from 'node:fs';

describe('paths 数据收敛红线', () => {
  it('项目根 = 仓库根目录（mcp-server 的上一级）', () => {
    expect(path.basename(PROJECT_ROOT)).toBe('resume-tool');
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))).toBe(true);
  });

  it('所有可写路径都在 .mcp/ 下且位于项目内', () => {
    for (const dir of [MCP_DATA_ROOT, BROWSER_PROFILE_DIR, BROWSERS_DIR, LOGS_DIR]) {
      expect(dir.startsWith(MCP_DATA_ROOT)).toBe(true);
      expect(dir.startsWith(PROJECT_ROOT)).toBe(true);
      expect(dir).not.toContain('AppData');
      expect(dir).not.toContain(process.env.HOME ?? '/home/');
    }
  });

  it('ensureDataDirs 创建全部目录（幂等）', () => {
    ensureDataDirs();
    ensureDataDirs();
    for (const dir of [MCP_DATA_ROOT, BROWSER_PROFILE_DIR, BROWSERS_DIR, LOGS_DIR]) {
      expect(fs.statSync(dir).isDirectory()).toBe(true);
    }
  });
});

describe('isAllowedZhipinUrl 白名单', () => {
  it('只放行 https 的 zhipin 域名', () => {
    expect(isAllowedZhipinUrl('https://www.zhipin.com/job_detail/abc.html')).toBe(true);
    expect(isAllowedZhipinUrl('https://zhipin.com/job_detail/abc.html')).toBe(true);
    expect(isAllowedZhipinUrl('http://www.zhipin.com/job_detail/abc.html')).toBe(false);
    expect(isAllowedZhipinUrl('https://evil.com/job_detail/abc.html')).toBe(false);
    expect(isAllowedZhipinUrl('https://www.zhipin.com.evil.com/x')).toBe(false);
    expect(isAllowedZhipinUrl('not a url')).toBe(false);
  });
});
