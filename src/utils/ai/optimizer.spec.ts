import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeGaps, collectMaterial, generateOptimizerProposals } from './optimizer';
import { defaultResumeData } from '@/types/resume';
import type { AiProviderConfig } from '@/types/settings';

vi.mock('./client', async (importOriginal) => {
  const original = await importOriginal<typeof import('./client')>();
  return { ...original, chatCompletion: vi.fn() };
});

import { chatCompletion } from './client';
const chatMock = vi.mocked(chatCompletion);

const config: AiProviderConfig = {
  provider: 'deepseek', baseURL: 'https://api.example.com/v1', apiKey: 'sk-x', model: 'm',
};

function makeData() {
  const data = defaultResumeData();
  data.summary = '五年测试开发经验';
  data.experience = [{
    id: 'exp1', company: '云舟科技', role: '测试开发', time: '2023-至今',
    description: '', achievement: '', items: ['搭建自动化框架'],
  }];
  return data;
}

const JD = '负责 Kubernetes 集群上的服务端测试，熟悉 Python 自动化与性能测试，具备量化复盘能力';

beforeEach(() => {
  chatMock.mockReset();
});

describe('analyzeGaps', () => {
  it('解析差距并分配稳定 id；polish 类不保留问题', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({
      summary: '测试基础扎实，云原生实践缺失。',
      strengths: ['Python 自动化', 'CI 经验'],
      gaps: [
        { topic: 'Kubernetes 实践', kind: 'needs-material', question: '你实际工作中是否接触过 K8s？做过什么？' },
        { topic: '量化复盘不足', kind: 'polish', question: '多余的问题应被丢弃' },
      ],
    }));

    const result = await analyzeGaps(config, { jd: JD, data: makeData() });

    expect(result.gaps[0]).toMatchObject({ id: 'g1', kind: 'needs-material' });
    expect(result.gaps[0].question).toContain('K8s');
    expect(result.gaps[1]).toMatchObject({ id: 'g2', kind: 'polish' });
    expect(result.gaps[1].question).toBeUndefined();

    const systemMsg = chatMock.mock.calls[0][1][0].content;
    expect(systemMsg).toContain('绝不假设用户具备该经验');
    expect(systemMsg).toContain('不输出分数');
  });

  it('JD 过短直接抛错不发请求', async () => {
    await expect(analyzeGaps(config, { jd: '太短', data: makeData() })).rejects.toThrow('JD 内容过少');
    expect(chatMock).not.toHaveBeenCalled();
  });
});

describe('collectMaterial', () => {
  it('素材足够时返回浓缩素材', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({
      enough: true,
      material: '用户在 A 项目中用 K8s 部署过 3 个服务，编写了 Helm Chart',
    }));

    const result = await collectMaterial(config, {
      jd: JD, topic: 'Kubernetes 实践',
      question: '你接触过 K8s 吗？', answer: '接触过，我在 A 项目里用 k8s 部署服务，还写了 helm chart',
      allowFollowUp: true,
    });

    expect(result.enough).toBe(true);
    expect(result.material).toContain('Helm');
  });

  it('素材不足且还有追问额度时返回追问', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({ enough: false, followUp: '具体管理过几个节点？', material: '' }));

    const result = await collectMaterial(config, {
      jd: JD, topic: 'K8s', question: 'q', answer: '用过一点', allowFollowUp: true,
    });

    expect(result.enough).toBe(false);
    expect(result.followUp).toContain('节点');
  });

  it('追问额度用尽时强制收敛为可用素材，不卡流程', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({ enough: false, followUp: '还想问', material: '' }));

    const result = await collectMaterial(config, {
      jd: JD, topic: 'K8s', question: 'q', answer: '用户最后的回答', allowFollowUp: false,
    });

    expect(result.enough).toBe(true);
    expect(result.material).toBe('用户最后的回答');
  });

  it('空回答直接抛错', async () => {
    await expect(collectMaterial(config, {
      jd: JD, topic: 't', question: 'q', answer: '  ', allowFollowUp: true,
    })).rejects.toThrow('请先填写');
    expect(chatMock).not.toHaveBeenCalled();
  });
});

describe('generateOptimizerProposals', () => {
  it('素材随请求发送；提案基于当前目录解析；无有效素材时不带 MATERIALS 块', async () => {
    const data = makeData();
    const { collectPassages } = await import('./proposals');
    const itemId = collectPassages(data).find(
      (p) => p.location.startsWith('工作经历 · ') && p.location.includes('第 1 条'),
    )!.id;

    chatMock.mockResolvedValueOnce(JSON.stringify({
      reply: '强化量化并补充 K8s 素材。',
      proposals: [
        { passageId: itemId, text: '主导搭建自动化框架，覆盖率 90%', why: '补量化' },
        { passageId: itemId, text: '在 A 项目用 K8s 部署 3 个服务并编写 Helm Chart', why: '基于你的真实素材：Kubernetes 实践', add: true },
      ],
    }));

    const turn = await generateOptimizerProposals(config, {
      jd: JD,
      data,
      materials: [{ topic: 'Kubernetes 实践', material: '用户在 A 项目中用 K8s 部署过 3 个服务' }],
    });

    expect(turn.proposals).toHaveLength(2);
    expect(turn.proposals[0].status).toBe('pending');
    expect(turn.proposals[1].add).toBe(true);

    const userMsg = chatMock.mock.calls[0][1][1].content;
    expect(userMsg).toContain('<<<MATERIALS_START>>>');
    expect(userMsg).toContain('Kubernetes 实践');
    const systemMsg = chatMock.mock.calls[0][1][0].content;
    expect(systemMsg).toContain('绝不编造');
  });

  it('「用户无相关经验」的素材被过滤，不进提案上下文', async () => {
    chatMock.mockResolvedValueOnce(JSON.stringify({ reply: 'ok', proposals: [] }));

    await generateOptimizerProposals(config, {
      jd: JD, data: makeData(),
      materials: [{ topic: '性能测试', material: '（用户无相关经验）' }],
    });

    expect(chatMock.mock.calls[0][1][1].content).not.toContain('MATERIALS_START');
  });
});
