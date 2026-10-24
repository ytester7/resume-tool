# PR · dev → main · v3.0.0 发布

**分支**：`dev` → `main`
**规模**：20 commits，122 files，+13424 / −318
**创建链接**：https://github.com/ytester7/resume-tool/compare/main...dev
**建议标题**：`release: v3.0.0 — AI 求职工作台上线（含 v2.3 模板适配收尾）`

> 复制下面 `---` 之间的全部内容粘贴到 PR 描述框即可。

---

## 变更说明

这是一次**发布合并**：把 dev 上的 v3.0.0（AI 求职工作台）带上 main，同时捎带两个 v2.3 收尾提交（模板缺失字段适配 + PR 描述文档）。

**合并前请把合并方式选为「Create a merge commit」而不是 Squash**——本仓库的默认 Squash 会把 20 个提交压成一个，导致已打在 dev 合并点的 `v3.0.0` tag 无法对应 main 上的历史；merge commit 则天然包含该提交，tag 继续有效。

## 变更类型

- [x] feat: 新功能（v3.0.0 主体）
- [x] fix: Bug 修复（模板缺失字段适配、CI 环境差异）
- [x] docs: 文档
- [x] chore: CI/构建与发布

## 上线内容

### 1. v3.0.0 主体（AI 求职工作台，14 个提交）

详见 [PR #3 描述](https://github.com/ytester7/resume-tool/pull/3)（已合并，含完整变更说明与自查清单）。摘要：

| 模块 | 内容 |
|---|---|
| AI 基础设施 | BYOK 配置（DeepSeek/OpenAI 兼容/OpenRouter/OpenAI/Ollama）、OpenAI 兼容客户端（流式+非流式）、防御式 JSON 解析 |
| AI 读简历 | 导入 AI 解析、JD 深度分析（AI 不出分数）、单条润色 |
| AI 写简历 | 段落提案协议（内容哈希防打偏 + 人工采纳 + 可撤销）、聊天助手（SSE 流式） |
| 简历优化工程师 | 差距分析 → 素材访谈（绝不编造）→ 定制提案 |
| 求职管理 | 投递台账（漏斗历史口径）、按岗位派生版本、个人素材库、版本快照 |
| Boss直聘直连 | 可选独立伴随进程 `mcp-server/`，只读 + 限速 + 风控即停 + 数据收敛项目内 `.mcp/` |

### 2. v2.3 收尾（搭车提交）

- `fix(templates)`：缺失字段适配与多数据源展示——新增 `resumeView` 展示层过滤，13 套模板统一隐藏空标题/空侧栏/半页空白/重复单位，`parseResume` 深层归一化兼容缺失数组与两种 items 形态
- `docs`：PR 描述文档

## ⚠️ 部署注意（合并前必读）

1. **GitHub Pages 尚未启用**：`Deploy to GitHub Pages` 在 main 上最近一次运行失败（`configure-pages` 报 `Get Pages site failed: Not Found`，PR #2 合并时就存在）。合并本 PR 前/后需要在 **Settings → Pages → Source 选 "GitHub Actions"**，然后在 Actions 页 Re-run deploy，否则线上站点不会更新。
2. **隐私承诺变化随本 PR 上线**：由「零网络请求」变为「**未配置 AI 时零网络请求**」，站点访客可见的升级须知见 CHANGELOG 3.0.0 头部。
3. 合并后 `v3.0.0` tag 无需重打（merge commit 方式下 main 历史包含 tag 所指的 dev 合并点）。

## 质量证据

- PR #3 的 CI：test ✅ / mcp ✅ / e2e ✅；合入 dev 后 dev 分支 CI 同样三 job 全绿（`458e01e`）
- 本地全量：单测 649（根套件）+ 25（mcp-server）+ E2E 40 全绿；`vue-tsc` / `eslint` / `vite build` 零错误
- 两轴代码审查（仓库标准 + 迭代规格）已执行并整改

## 发布步骤

1. 确认 Settings → Pages → Source = GitHub Actions
2. 合并方式选 **Create a merge commit**，合并本 PR
3. Actions 页确认 deploy 成功，打开线上地址抽查：欢迎页 AI 引导卡片、新建简历、导出 PDF
4. 线上验证通过后，GitHub Releases 基于 `v3.0.0` tag 发布 Release Notes（可引用 CHANGELOG 3.0.0 段落）

## 自查清单

- [x] dev 分支 CI 全绿（test/mcp/e2e）
- [x] CHANGELOG 3.0.0 定稿，含升级须知与 localStorage 键清单
- [x] README 功能表与 AI 快速上手册节与实现一致
- [x] 未配置 AI 零网络、AI 写入必经人工采纳、伴随进程只读限速三红线复核
- [x] 本 PR 描述与实际 diff 核对（20 commits / 122 files）
