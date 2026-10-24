import { describe, it, expect } from 'vitest';
import { parseJobDetail, parseSearchResults } from '../src/extract.js';

const DETAIL_HTML = `
<html><head><title>测试开发工程师-云舟科技-Boss直聘</title></head>
<body>
  <h1 class="name">测试开发工程师<em>25-45K·14薪</em></h1>
  <h3 class="company-name"><a>云舟科技</a></h3>
  <span class="salary">25-45K·14薪</span>
  <div class="job-sec-text">
    岗位职责：<br/>
    1. 负责服务端功能测试与自动化建设；<br/>
    2. 参与需求评审，设计测试用例；<br/><br/>
    任职要求：<br/>
    1. 三年以上测试经验，熟悉 Python；
  </div>
</body></html>
`;

const SEARCH_HTML = `
<div class="job-card-wrapper">
  <span class="job-name">测试开发工程师</span>
  <span class="salary">20-35K</span>
  <a class="company-name" href="/job_detail/aaa.html">云舟科技</a>
</div>
<div class="job-card-wrapper">
  <span class="job-name">高级测试工程师</span>
  <span class="salary">25-40K</span>
  <a class="company-name" href="/job_detail/bbb.html">潮汐网络</a>
</div>
`;

const JSON_SEARCH_HTML = `
<script>window.__INITIAL_STATE__ = {"jobList": [
  {"jobName":"后端工程师","brandName":"字节跳动","salaryDesc":"30-50K","jobHref":"/job_detail/ccc.html"},
  {"jobName":"后端工程师","brandName":"字节跳动","salaryDesc":"30-50K","jobHref":"/job_detail/ccc.html"},
  {"jobName":"测试开发工程师","brandName":"字节跳动","salaryDesc":"25-40K","jobHref":"/job_detail/ddd.html"}
]}</script>
`;

describe('parseJobDetail', () => {
  it('解析职位名、公司、薪资与保留换行的 JD', () => {
    const d = parseJobDetail(DETAIL_HTML);
    expect(d.position).toBe('测试开发工程师');
    expect(d.company).toBe('云舟科技');
    expect(d.salary).toContain('25-45K');
    expect(d.jd).toContain('岗位职责');
    expect(d.jd).toContain('自动化建设');
    expect(d.jd).toContain('三年以上测试经验');
    expect(d.jd).toMatch(/\n/);
  });

  it('job-sec-text 缺失时回退到内嵌 JSON 的 description', () => {
    const html = `<script>{"description":"这是来自JSON的职责描述<br/>第二行"}</script>`;
    const d = parseJobDetail(html);
    expect(d.jd).toContain('来自JSON的职责描述');
    expect(d.jd).toContain('第二行');
  });

  it('无法解析时返回空字段而不是猜测', () => {
    const d = parseJobDetail('<html><body>空页面</body></html>');
    expect(d.jd).toBe('');
    expect(d.company).toBe('');
  });
});

describe('parseSearchResults', () => {
  it('从 DOM 卡片解析职位列表', () => {
    const jobs = parseSearchResults(SEARCH_HTML);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      position: '测试开发工程师',
      company: '云舟科技',
      salary: '20-35K',
    });
    expect(jobs[0].link).toBe('https://www.zhipin.com/job_detail/aaa.html');
  });

  it('DOM 不可用时回退到内嵌 JSON 并按 公司|职位 去重', () => {
    const jobs = parseSearchResults(JSON_SEARCH_HTML);
    expect(jobs).toHaveLength(2);
    expect(jobs[0].company).toBe('字节跳动');
    expect(jobs[1].position).toBe('测试开发工程师');
    expect(jobs[1].link).toContain('ddd.html');
  });

  it('两种来源都没有时返回空数组', () => {
    expect(parseSearchResults('<html></html>')).toEqual([]);
  });
});
