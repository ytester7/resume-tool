# PR · resume-tool v3.0.0：AI 求职工作台

**分支**：`feat/ai-foundation` → `dev`
**提交**：`f0f735f` `dc9861b` `e486737` `d47d945` `a02600e` `c38d3e3` `1c4b1e0` `9ac759f` `61b59a1` `5732480` `8a20356`
**规模**：约 90 files，+11k / −250（含 mcp-server 独立包）

**创建链接**：https://github.com/ytester7/resume-tool/pull/new/feat/ai-foundation
**建议标题**：`feat: v3.0.0 — AI 求职工作台（BYOK / 优化工程师 / 投递台账 / MCP）`

> 复制下面 `---` 之间的全部内容粘贴到 PR 描述框即可。

---

## 变更说明

v3.0.0 把工具从「本地简历编辑器」升级为「**本地优先的 AI 求职工作台**」：
AI 全部 BYOK（自带 Key、未配置时零网络）、写简历必经人工采纳、投递台账纯本地、
Boss直聘直连是独立可选的只读伴随进程。从 Reactive Resume 迁移了七项架构优点
（BYOK 服务商体系、段落提案协议、提示词工程、防御式 JSON 解析、投递域模型、
润色交互契约、多岗位版本矩阵），并补齐项目 P1 路线图的「版本快照」欠账。

## 变更类型

- [x] feat: 新功能
- [x] fix: Bug 修复
- [x] docs: 文档
- [x] chore: CI/构建

## 核心新增

### 1. AI 基础设施（BYOK）
- `utils/ai/client.ts`：OpenAI 兼容 fetch 客户端（非流式 + SSE 流式双通道），
  错误翻译成人话且 Key 脱敏，防御式 JSON 解析（剥围栏 + zod 校验）
- `stores/settings.ts` + `SettingsDialog.vue`：5 类服务商、连接测试通过才可保存、
  Key 脱敏回显；配置只存 localStorage
- 提示词公共件：安全前缀 + `<<<数据块>>>` 防注入 + 输出契约约束

### 2. AI 读简历
- 导入弹窗「AI 智能解析」（严格抽取、缺信息留空、结果带核对警示）
- JD 深度分析（AI 不出分数——数字结论只归本地规则；建议可点击定位区块）
- 单条润色（`{text, why, addsFacts}` 契约、应用前校验原文未变）

### 3. AI 写简历（段落提案协议）
- 段落 id = 目标路径 + 内容哈希，文本一变 id 即失效；采纳前二次校验「当前文本 === 提案时文本」
- `AssistantPanel.vue` 聊天助手：SSE 流式上屏、提案卡片逐条采纳/忽略、Ctrl+Z 可撤销、
  对话按 Tab 持久化
- `OptimizerPanel.vue` 简历优化工程师：差距分析 → 素材访谈（只整理用户说的素材，
  绝不编造）→ 定制提案

### 4. 求职管理
- 投递记录台账：状态流转 + 漏斗统计（历史口径）+ 备注时间线 + JSON 导入导出
- 按岗位派生简历版本（多岗位版本矩阵）
- 个人素材库：访谈素材跨岗位沉淀复用，AI 助手可直接引用
- 版本快照：保存即留档（每 Tab 5 份/全局 30 份/4MB LRU），恢复为新 Tab 零覆盖风险

### 5. Boss直聘直连（可选伴随进程 `mcp-server/`）
- 只读红线：仅搜索与抓 JD，代码层面不存在投递等写入接口
- 安全：zhipin.com 白名单、9–15s 随机限速、单会话 60 次上限、
  风控/登录墙探测即停、仅绑定 127.0.0.1 + 来源校验、
  登录态/浏览器/日志全部收敛在仓库 `.mcp/`（gitignore 已排除）
- MCP 工具层（stdio）：search_jobs / fetch_jd / open_login_browser

### 6. 工程与发布
- CI 触发 dev 分支、新增 lint 步骤与 mcp-server 测试 job
- 欢迎页 AI 能力引导卡片（未配置时不出现 AI 入口的问题已解决）
- 版本号 2.3.0 → 3.0.0（隐私承诺语义变化，升级须知见 CHANGELOG）

## 质量证据

- 单测 **674** 全绿（+179）；E2E **40** 全绿（+13，AI 全部走 route mock 保持离线）
- mcp-server 独立 vitest **25** 全绿；`vue-tsc` / `eslint` / `vite build` 零错误
- 全量 vitest 需 `--no-file-parallelism`（既有共享状态问题，另立 issue）
- 两轴代码审查（仓库标准 + 迭代规格）已执行并整改（`a9fd7dc`）：
  stdio 接通、来源校验、漏斗历史口径、死代码清理、类型收窄等

## 自查清单

- [x] 未配置 AI 时零网络（e2e 断言 AI 入口不渲染）
- [x] AI 写数据必经人工采纳（提案协议测试覆盖 stale/竞态路径）
- [x] API Key 不出现在任何错误信息（redactKey 测试覆盖）
- [x] 伴随进程只读 + 限速 + 数据收敛项目内（paths 收敛断言测试）
- [x] CHANGELOG 升级须知 + localStorage 键清单
- [x] 文档与实现一致（mcp-server/README、README 功能表复核）

## 已知取舍

- Boss直聘解析选择器基于公开页面知识 + 双路兜底，真实页面可能需微调（`PARSE_EMPTY` 时按 README 更新）
- 全量单测串行运行（既有测试隔离问题，与本次变更无关）
- 移动端适配未做（P1 遗留，本轮范围外）
