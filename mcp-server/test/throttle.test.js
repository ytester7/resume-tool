import { describe, it, expect } from 'vitest';
import { Throttle } from '../src/throttle.js';

describe('Throttle 节流器', () => {
  it('首次立即可用，返回等待 0', () => {
    const t = new Throttle({ minIntervalMs: 1000, jitterMs: 0, maxPerSession: 10 });
    expect(t.acquire(0)).toBe(0);
  });

  it('第二次需要等待最小间隔', () => {
    const t = new Throttle({ minIntervalMs: 9000, jitterMs: 0, maxPerSession: 10 });
    t.acquire(0);
    const wait = t.acquire(1000);
    expect(wait).toBeGreaterThanOrEqual(8000); // 9000 - 1000
    expect(wait).toBeLessThanOrEqual(9000);
  });

  it('超过间隔后恢复可用，未到点仍需等待', () => {
    const t = new Throttle({ minIntervalMs: 5000, jitterMs: 0, maxPerSession: 10 });
    t.acquire(0); // 动作发生在 0，下一名额 5000
    expect(t.acquire(6000)).toBe(0); // 已过 5000，立即可用
    expect(t.acquire(8000)).toBe(3000); // 下一名额 11000
  });

  it('超过会话上限抛 SESSION_LIMIT', () => {
    const t = new Throttle({ minIntervalMs: 0, jitterMs: 0, maxPerSession: 2 });
    t.acquire(0);
    t.acquire(0);
    expect(() => t.acquire(0)).toThrowError(/上限/);
  });
});
