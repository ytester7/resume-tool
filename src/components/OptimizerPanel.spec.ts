import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import OptimizerPanel from './OptimizerPanel.vue';
import { useTabsStore } from '@/stores/tabs';
import { useMaterialsStore } from '@/stores/materials';
import { SETTINGS_STORAGE_KEY } from '@/types/settings';
import { defaultResumeData } from '@/types/resume';
import type { ResumeData } from '@/types/resume';

vi.mock('@/utils/ai/optimizer', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/ai/optimizer')>();
  return {
    ...original,
    analyzeGaps: vi.fn(),
    collectMaterial: vi.fn(),
    generateOptimizerProposals: vi.fn(),
  };
});

import { analyzeGaps, collectMaterial, generateOptimizerProposals } from '@/utils/ai/optimizer';
import { collectPassages, resolveProposals } from '@/utils/ai/proposals';
const gapsMock = vi.mocked(analyzeGaps);
const materialMock = vi.mocked(collectMaterial);
const generateMock = vi.mocked(generateOptimizerProposals);

const JD = '负责 Kubernetes 集群上的服务端测试与 Python 自动化建设，具备量化复盘能力';

function makeData(): ResumeData {
  const data = defaultResumeData();
  data.name = '陈默';
  data.summary = '五年测试开发经验';
  data.experience = [{
    id: 'exp1', company: '云舟科技', role: '测试开发', time: '2023-至今',
    description: '', achievement: '', items: ['搭建自动化框架'],
  }];
  return data;
}

function enableAi(): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    ai: { provider: 'deepseek', baseURL: 'https://api.example.com/v1', apiKey: 'sk-x', model: 'deepseek-chat' },
  }));
}

function mountPanel(props: { presetJd?: string; presetLabel?: string } = {}) {
  const tabs = useTabsStore();
  tabs.open({ data: makeData() });
  return mount(OptimizerPanel, { props });
}

/** 让提案 mock 返回针对当前数据的真实 pending 提案（改写概述） */
function mockProposalTurn(data: ResumeData, after: string) {
  const passage = collectPassages(data).find((p) => p.location === '专业概述')!;
  generateMock.mockResolvedValueOnce({
    reply: '强化概述并补充 K8s 素材',
    proposals: resolveProposals(collectPassages(data), [{ passageId: passage.id, text: after, why: '基于你的真实素材：K8s' }]),
  });
}

describe('OptimizerPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    enableAi();
    setActivePinia(createPinia());
    gapsMock.mockReset();
    materialMock.mockReset();
    generateMock.mockReset();
  });

  it('预置 JD 时进入确认步，开始分析后展示差距与访谈问题', async () => {
    gapsMock.mockResolvedValueOnce({
      summary: '测试基础扎实，云原生缺失。',
      strengths: ['Python 自动化'],
      gaps: [
        { id: 'g1', topic: 'Kubernetes 实践', kind: 'needs-material', question: '你实际用过 K8s 吗？' },
        { id: 'g2', topic: '量化不足', kind: 'polish' },
      ],
    });

    const wrapper = mountPanel({ presetJd: JD, presetLabel: '云舟科技·测开' });
    expect(wrapper.find('.opt-sub').text()).toContain('云舟科技·测开');
    expect((wrapper.find('#opt-jd').element as HTMLTextAreaElement).value).toContain('Kubernetes');

    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();

    expect(wrapper.find('.opt-summary').text()).toContain('云原生');
    expect(wrapper.findAll('.opt-gap')).toHaveLength(2);
    expect(wrapper.find('.opt-question').text()).toContain('K8s');
    // polish 类不出现提问输入框
    const textareas = wrapper.findAll('.opt-answer-row textarea');
    expect(textareas).toHaveLength(1);
  });

  it('JD 过短时不发请求并提示', async () => {
    const wrapper = mountPanel({ presetJd: '太短' });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();
    expect(gapsMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('访谈：提交素材足够后记录；跳过的差距不参与提案', async () => {
    gapsMock.mockResolvedValueOnce({
      summary: 's', strengths: [],
      gaps: [{ id: 'g1', topic: 'K8s', kind: 'needs-material', question: '用过吗？' }],
    });
    materialMock.mockResolvedValueOnce({ enough: true, material: '用户在 A 项目用 K8s 部署过服务' });

    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();

    await wrapper.find('.opt-answer-row textarea').setValue('在 A 项目用过 k8s 部署');
    const submitBtn = wrapper.findAll('.opt-btn').find((b) => b.text() === '提交')!;
    await submitBtn.trigger('click');
    await flushPromises();

    expect(wrapper.find('.opt-material').text()).toContain('A 项目');
    expect(wrapper.find('.opt-actions-row.footer .opt-hint').text()).toContain('1 条素材');

    // 生成提案：素材随调用传递
    const data = useTabsStore().active!.data;
    mockProposalTurn(data, '五年测试开发与质量体系建设经验');
    const genBtn = wrapper.findAll('.opt-btn').find((b) => b.text().includes('生成优化提案'))!;
    await genBtn.trigger('click');
    await flushPromises();

    expect(generateMock.mock.calls[0][1].materials).toEqual([
      { topic: 'K8s', material: '用户在 A 项目用 K8s 部署过服务' },
    ]);
    expect(wrapper.find('.proposal-card').exists()).toBe(true);
  });

  it('素材不足时追问一轮，再答后收敛', async () => {
    gapsMock.mockResolvedValueOnce({
      summary: 's', strengths: [],
      gaps: [{ id: 'g1', topic: 'K8s', kind: 'needs-material', question: '用过吗？' }],
    });
    materialMock
      .mockResolvedValueOnce({ enough: false, followUp: '管理过几个节点？', material: '' })
      .mockResolvedValueOnce({ enough: true, material: '管理过 3 节点集群' });

    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();

    await wrapper.find('.opt-answer-row textarea').setValue('用过一点');
    await wrapper.findAll('.opt-btn').find((b) => b.text() === '提交')!.trigger('click');
    await flushPromises();

    // 问题切换为追问
    expect(wrapper.find('.opt-question').text()).toContain('几个节点');

    await wrapper.find('.opt-answer-row textarea').setValue('3 个节点');
    await wrapper.findAll('.opt-btn').find((b) => b.text() === '提交')!.trigger('click');
    await flushPromises();

    expect(wrapper.find('.opt-material').text()).toContain('3 节点');
  });

  it('采纳提案写入简历并可撤销语义（replaceActive 路径）', async () => {
    gapsMock.mockResolvedValueOnce({ summary: 's', strengths: [], gaps: [] });
    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();

    mockProposalTurn(useTabsStore().active!.data, '五年测试开发与质量体系建设经验');
    await wrapper.findAll('.opt-btn').find((b) => b.text().includes('生成优化提案'))!.trigger('click');
    await flushPromises();

    await wrapper.find('.proposal-btn.primary').trigger('click');
    expect(useTabsStore().active!.data.summary).toBe('五年测试开发与质量体系建设经验');
    expect(useTabsStore().active!.dirty).toBe(true);
    expect(wrapper.find('.proposal-state.ok').text()).toBe('已采纳');
  });

  it('跳过差距后可直接生成提案，素材为空集', async () => {
    gapsMock.mockResolvedValueOnce({
      summary: 's', strengths: [],
      gaps: [{ id: 'g1', topic: 'K8s', kind: 'needs-material', question: '用过吗？' }],
    });

    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();

    await wrapper.findAll('.opt-btn').find((b) => b.text() === '跳过此差距')!.trigger('click');
    expect(wrapper.find('.opt-material').text()).toContain('已跳过');

    mockProposalTurn(useTabsStore().active!.data, '新概述');
    await wrapper.findAll('.opt-btn').find((b) => b.text().includes('生成优化提案'))!.trigger('click');
    await flushPromises();

    expect(generateMock.mock.calls[0][1].materials).toEqual([]);
    expect(wrapper.find('.proposal-card').exists()).toBe(true);
  });

  it('访谈成功的素材自动沉淀进素材库；可带入到相近差距的回答框', async () => {
    gapsMock.mockResolvedValueOnce({
      summary: 's', strengths: [],
      gaps: [{ id: 'g1', topic: 'Kubernetes 实践', kind: 'needs-material', question: '用过吗？' }],
    });
    materialMock.mockResolvedValueOnce({ enough: true, material: '在 A 项目用 K8s 部署 3 个服务' });

    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();

    await wrapper.find('.opt-answer-row textarea').setValue('在 A 项目用过');
    await wrapper.findAll('.opt-btn').find((b) => b.text() === '提交')!.trigger('click');
    await flushPromises();

    // 自动入库
    const materials = useMaterialsStore();
    expect(materials.entries).toHaveLength(1);
    expect(materials.entries[0].topic).toBe('Kubernetes 实践');
    expect(wrapper.find('.opt-library-head').text()).toContain('1');

    // 第二次访谈相近差距：出现「从素材库带入」，点击填入回答框
    gapsMock.mockResolvedValueOnce({
      summary: 's2', strengths: [],
      gaps: [{ id: 'g1', topic: 'Kubernetes 集群运维', kind: 'needs-material', question: '接触过吗？' }],
    });
    await wrapper.findAll('.opt-btn').find((b) => b.text() === '重新分析')!.trigger('click');
    await wrapper.findAll('.opt-btn').find((b) => b.text().includes('开始差距分析'))!.trigger('click');
    await flushPromises();

    const fillBtn = wrapper.findAll('.opt-btn').find((b) => b.text() === '从素材库带入')!;
    expect(fillBtn.exists()).toBe(true);
    await fillBtn.trigger('click');

    const textarea = wrapper.find('.opt-answer-row textarea').element as HTMLTextAreaElement;
    expect(textarea.value).toContain('K8s 部署 3 个服务');
    wrapper.unmount();
  });

  it('「用户无相关经验」的素材不入库', async () => {
    gapsMock.mockResolvedValueOnce({
      summary: 's', strengths: [],
      gaps: [{ id: 'g1', topic: '性能测试', kind: 'needs-material', question: 'q' }],
    });
    materialMock.mockResolvedValueOnce({ enough: true, material: '（用户无相关经验）' });

    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();
    await wrapper.find('.opt-answer-row textarea').setValue('没接触过');
    await wrapper.findAll('.opt-btn').find((b) => b.text() === '提交')!.trigger('click');
    await flushPromises();

    expect(useMaterialsStore().entries).toHaveLength(0);
    wrapper.unmount();
  });

  it('未配置 AI 时（aiReady=false）各 AI 调用直接返回不崩', async () => {
    localStorage.clear();
    setActivePinia(createPinia());
    const wrapper = mountPanel({ presetJd: JD });
    await wrapper.find('.opt-btn.primary').trigger('click');
    await flushPromises();
    expect(gapsMock).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
