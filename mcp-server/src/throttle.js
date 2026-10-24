/**
 * 请求节流：对 zhipin.com 的导航保持最小间隔 + 随机抖动，
 * 降低请求频率特征。串行使用，由 boss.js 在每次导航前调用。
 */

export class Throttle {
  /**
   * @param {{minIntervalMs?: number, jitterMs?: number, maxPerSession?: number}} opts
   */
  constructor({ minIntervalMs = 9000, jitterMs = 6000, maxPerSession = 60 } = {}) {
    this.minIntervalMs = minIntervalMs;
    this.jitterMs = jitterMs;
    this.maxPerSession = maxPerSession;
    this.count = 0;
    this.nextAvailableAt = 0;
  }

  /** 距下次可用还需等待的毫秒数（0 = 立即可用） */
  waitMs(now = Date.now()) {
    return Math.max(0, this.nextAvailableAt - now);
  }

  /**
   * 预约一个名额：超限抛 SESSION_LIMIT；否则返回调用方需要先 sleep 的毫秒数，
   * 并把下一个名额排到「本次动作之后 + 随机间隔」。
   */
  acquire(now = Date.now()) {
    if (this.count >= this.maxPerSession) {
      const err = new Error(`本会话请求数已达上限 ${this.maxPerSession}，请重启伴随进程后再用`);
      err.code = 'SESSION_LIMIT';
      throw err;
    }
    const wait = this.waitMs(now);
    const jitter = this.minIntervalMs + Math.floor(Math.random() * this.jitterMs);
    this.nextAvailableAt = now + wait + jitter;
    this.count += 1;
    return wait;
  }
}
