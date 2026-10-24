import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ApplicationsPanel from './ApplicationsPanel.vue';
import { useApplicationsStore } from '@/stores/applications';
import { useTabsStore } from '@/stores/tabs';
import { defaultResumeData } from '@/types/resume';

vi.mock('@/utils/companion', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/companion')>();
  return { ...original, detectCompanion: vi.fn(), fetchJdViaCompanion: vi.fn(), openCompanionLogin: vi.fn() };
});

import { detectCompanion, fetchJdViaCompanion } from '@/utils/companion';
const detectMock = vi.mocked(detectCompanion);
const fetchMock = vi.mocked(fetchJdViaCompanion);

describe('ApplicationsPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    detectMock.mockReset();
    fetchMock.mockReset();
    detectMock.mockResolvedValue(null);
  });

  function mountPanel() {
    const wrapper = mount(ApplicationsPanel);
    return wrapper;
  }

  it('空状态展示引导文案', () => {
    const wrapper = mountPanel();
    expect(wrapper.find('.apps-empty').text()).toContain('Boss直聘');
    wrapper.unmount();
  });

  it('新增记录：表单必填校验 + 保存后列表与漏斗更新', async () => {
    const wrapper = mountPanel();
    await wrapper.find('.apps-btn.primary').trigger('click');

    // 必填缺失：提示且不关闭表单
    await wrapper.find('.apps-btn.primary').trigger('click');
    const apps = useApplicationsStore();
    expect(apps.list).toHaveLength(0);

    await wrapper.find('input[aria-label="公司"]').setValue('云舟科技');
    await wrapper.find('input[aria-label="岗位"]').setValue('测试开发');
    await wrapper.find('textarea[aria-label="JD 内容"]').setValue('负责 Kubernetes 上的服务测试');
    await wrapper.findAll('.apps-btn.primary')[1].trigger('click');

    expect(apps.list).toHaveLength(1);
    expect(apps.list[0].company).toBe('云舟科技');
    expect(apps.list[0].jd).toContain('Kubernetes');
    expect(wrapper.find('.app-card').exists()).toBe(true);
    expect(wrapper.find('.jd-flag').exists()).toBe(true);
    // 漏斗：总计 1，意向阶段
    const nums = wrapper.findAll('.funnel-num').map((n) => n.text());
    expect(nums[0]).toBe('1');
    wrapper.unmount();
  });

  it('状态下拉变更走 setStatus 并写入时间线', async () => {
    const apps = useApplicationsStore();
    apps.addApplication({ company: 'A', position: 'P', channel: 'boss' });
    const wrapper = mountPanel();

    await wrapper.find('.status-select').setValue('约面');
    expect(apps.list[0].status).toBe('约面');
    const notes = apps.list[0].notes;
    expect(notes[notes.length - 1].text).toBe('状态：意向 → 约面');
    wrapper.unmount();
  });

  it('分析 JD：把记录里的 JD 填入当前简历的岗位匹配并关闭面板', async () => {
    const tabs = useTabsStore();
    tabs.open({ data: defaultResumeData() });
    const apps = useApplicationsStore();
    apps.addApplication({ company: 'A', position: 'P', channel: 'boss', jd: '会 Python 自动化' });

    const wrapper = mountPanel();
    const analyzeBtn = wrapper.findAll('.mini-btn').find((b) => b.text() === '分析 JD')!;
    await analyzeBtn.trigger('click');

    expect(tabs.active!.targetJd).toBe('会 Python 自动化');
    expect(wrapper.emitted('close')).toBeTruthy();
    wrapper.unmount();
  });

  it('派生简历版本：以公司·岗位为标题复制当前简历并绑定 JD', async () => {
    const tabs = useTabsStore();
    const data = defaultResumeData();
    data.name = '陈默';
    tabs.open({ data });
    const apps = useApplicationsStore();
    apps.addApplication({ company: '云舟', position: '测开', channel: 'boss', jd: 'JD 内容' });

    const wrapper = mountPanel();
    const deriveBtn = wrapper.findAll('.mini-btn').find((b) => b.text() === '派生简历版本')!;
    await deriveBtn.trigger('click');

    expect(tabs.tabs).toHaveLength(2);
    expect(tabs.active!.title).toBe('云舟·测开');
    expect(tabs.active!.targetJd).toBe('JD 内容');
    expect(tabs.active!.data.name).toBe('陈默'); // 内容来自被派生的简历
    expect(apps.list[0].resumeTitle).toBe('云舟·测开');
    // 原简历数据不受影响
    expect(tabs.tabs[0].data).not.toBe(tabs.active!.data);
    wrapper.unmount();
  });

  it('备注：添加后时间线展示', async () => {
    const apps = useApplicationsStore();
    apps.addApplication({ company: 'A', position: 'P', channel: 'boss' });
    const wrapper = mountPanel();

    const notesBtn = wrapper.findAll('.mini-btn').find((b) => b.text().includes('备注'))!;
    await notesBtn.trigger('click');
    await wrapper.find('.note-input-row input').setValue('周三下午电话面');
    await wrapper.find('.note-input-row .mini-btn').trigger('click');
    await flushPromises();

    const notes = apps.list[0].notes;
    expect(notes[notes.length - 1].text).toBe('周三下午电话面');
    expect(wrapper.find('.note-list').text()).toContain('周三下午电话面');
    wrapper.unmount();
  });

  it('伴随进程在线时展示直连状态与抓取入口，抓取结果回填表单', async () => {
    detectMock.mockResolvedValue({ service: 'resume-tool-mcp', version: '0.1.0', requestsUsed: 0, requestsLimit: 60 });
    fetchMock.mockResolvedValueOnce({
      company: '云舟科技', position: '测试开发', salary: '25-45K',
      jd: '负责自动化体系建设', url: 'https://www.zhipin.com/job_detail/x.html',
    });

    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.find('.companion-chip.online').exists()).toBe(true);
    await wrapper.find('.apps-toolbar .apps-btn.primary').trigger('click');
    expect(wrapper.find('.grab-row').exists()).toBe(true);

    await wrapper.find('input[aria-label="岗位链接"]').setValue('https://www.zhipin.com/job_detail/x.html');
    await wrapper.find('.grab-btn').trigger('click');
    await flushPromises();

    expect((wrapper.find('input[aria-label="公司"]').element as HTMLInputElement).value).toBe('云舟科技');
    expect((wrapper.find('textarea[aria-label="JD 内容"]').element as HTMLTextAreaElement).value).toContain('自动化体系');
    wrapper.unmount();
  });

  it('伴随进程不在线时不出现抓取入口，主流程不受影响', async () => {
    detectMock.mockResolvedValue(null);
    const wrapper = mountPanel();
    await flushPromises();

    expect(wrapper.find('.companion-chip.online').exists()).toBe(false);
    await wrapper.find('.apps-toolbar .apps-btn.primary').trigger('click');
    expect(wrapper.find('.grab-row').exists()).toBe(false);
    // 手动粘贴 JD 的主流程仍在
    expect(wrapper.find('textarea[aria-label="JD 内容"]').exists()).toBe(true);
    wrapper.unmount();
  });
});
