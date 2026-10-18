import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WelcomePanel from './WelcomePanel.vue';

describe('WelcomePanel', () => {
  it('展示三套示例简历', () => {
    const wrapper = mount(WelcomePanel);
    expect(wrapper.findAll('.sample-card')).toHaveLength(3);
    expect(wrapper.text()).toContain('测试工程师');
    expect(wrapper.text()).toContain('后端工程师');
    expect(wrapper.text()).toContain('产品经理');
  });

  it('点击示例抛出 sample 事件', async () => {
    const wrapper = mount(WelcomePanel);
    await wrapper.find('.sample-card').trigger('click');
    const emitted = wrapper.emitted('sample');
    expect(emitted).toBeTruthy();
    expect((emitted![0][0] as { id: string }).id).toBe('qa');
  });

  it('新建与打开按钮各自抛出事件', async () => {
    const wrapper = mount(WelcomePanel);
    const buttons = wrapper.findAll('.btn');
    await buttons[0].trigger('click');
    await buttons[1].trigger('click');
    expect(wrapper.emitted('new')).toBeTruthy();
    expect(wrapper.emitted('open')).toBeTruthy();
  });
});
