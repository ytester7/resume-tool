import { describe, it, expect } from 'vitest';
import { detectPageState, riskError } from '../src/detect.js';

describe('detectPageState 风控探测', () => {
  it('正常页面返回 none', () => {
    expect(detectPageState({ url: 'https://www.zhipin.com/job_detail/abc.html', title: '某岗位', html: '<div>岗位职责</div>' }))
      .toEqual({ kind: 'none' });
  });

  it('安全检查 URL 判定 risk', () => {
    expect(detectPageState({ url: 'https://www.zhipin.com/web/common/security-check.html?x=1' }).kind).toBe('risk');
    expect(detectPageState({ url: 'https://www.zhipin.com/captcha' }).kind).toBe('risk');
  });

  it('验证码特征 HTML 判定 risk', () => {
    expect(detectPageState({ url: 'https://www.zhipin.com/x', html: '<div>请输入验证码后继续访问</div>' }).kind).toBe('risk');
    expect(detectPageState({ url: 'https://www.zhipin.com/x', html: '<div>滑动验证拼图</div>' }).kind).toBe('risk');
    expect(detectPageState({ url: 'https://www.zhipin.com/x', html: '<div>访问异常，请稍后再试</div>' }).kind).toBe('risk');
  });

  it('登录墙判定 login', () => {
    expect(detectPageState({ url: 'https://www.zhipin.com/x', html: '<span>请使用微信扫码登录</span>' }).kind).toBe('login');
  });
});

describe('riskError', () => {
  it('login 与 risk 生成不同的结构化错误码', () => {
    expect(riskError('login').code).toBe('NEED_LOGIN');
    expect(riskError('risk').code).toBe('RISK_CONTROL');
    expect(riskError('risk').message).toContain('停止');
  });
});
