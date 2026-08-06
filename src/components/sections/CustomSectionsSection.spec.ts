import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import CustomSectionsSection from './CustomSectionsSection.vue';
import { useTabsStore } from '@/stores/tabs';

describe('CustomSectionsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('渲染已有自定义区块', () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addCustomSection();
    const sec = tabs.active!.data.customSections[0];
    sec.title = '证书资质';
    sec.content = 'PMP';
    const wrapper = mount(CustomSectionsSection);
    expect(wrapper.findAll('.custom-item').length).toBe(1);
    expect((wrapper.find('.custom-title').element as HTMLInputElement).value).toBe('证书资质');
    expect((wrapper.find('.custom-content').element as HTMLTextAreaElement).value).toBe('PMP');
  });

  it('点击添加按钮新增自定义区块并加入顺序', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    const wrapper = mount(CustomSectionsSection);
    await wrapper.find('.add-btn').trigger('click');
    expect(tabs.active?.data.customSections.length).toBe(1);
    expect(tabs.active?.sectionOrder).toContain(`custom:${tabs.active!.data.customSections[0].id}`);
  });

  it('输入标题/内容后更新数据并标记 dirty', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addCustomSection();
    tabs.markClean();
    const wrapper = mount(CustomSectionsSection);
    await wrapper.find('.custom-title').setValue('语言能力');
    expect(tabs.active?.data.customSections[0].title).toBe('语言能力');
    expect(tabs.active?.dirty).toBe(true);
    tabs.markClean();
    await wrapper.find('.custom-content').setValue('英语 CET-6');
    expect(tabs.active?.data.customSections[0].content).toBe('英语 CET-6');
    expect(tabs.active?.dirty).toBe(true);
  });

  it('点击删除按钮移除区块', async () => {
    const tabs = useTabsStore();
    tabs.open({ title: 'A' });
    tabs.addCustomSection();
    const wrapper = mount(CustomSectionsSection);
    await wrapper.find('.remove-btn').trigger('click');
    expect(tabs.active?.data.customSections.length).toBe(0);
  });
});
