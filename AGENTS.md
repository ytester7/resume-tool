# AGENTS.md

本文件是给所有 AI 编码助手（Claude Code / Cursor / Windsurf / Trae / Codex 等）的入口。
项目内挂载了 [mattpocock/skills](https://github.com/mattpocock/skills) 的精选子集，适用于 **vibe coding** 场景：续命、救火、定期治理。

## 如何使用这些 skills

- 每个 skill 是 `skills/` 下的一个 `.md` 文件，里面是该 skill 的完整执行脚本。
- **何时调用哪个 skill，由你（agent）按下方表格主动判断**；不需要用户输入 `/command`。
- 调用时，**先 Read 对应的 skill 文件**，然后严格按其步骤执行。
- 不要在没有匹配场景时强行调用 skill —— 它们是工具，不是流程。

## Skill 索引

| Skill | 文件 | 何时调用 | 一句话描述 |
|------|------|---------|----------|
| handoff | skills/handoff.md | 上下文接近上限、要切到新会话、用户要求交接时 | 把当前对话压成交接文档，让新 agent 无缝接手 |
| diagnosing-bugs | skills/diagnosing-bugs.md | Bug 修了 2 次没好、复现困难、性能回归时 | 系统化诊断循环：复现->最小化->假设->注入->修复->回归 |
| improve-codebase-architecture | skills/improve-codebase-architecture.md | 每隔几天定期跑、代码开始变乱、用户要求治理时 | 扫描代码深模块化机会，出 HTML 报告，挑一个修 |
| grill-me | skills/grill-me.md | 用户提新功能/新想法但需求模糊时（依赖 grilling） | 轻量盘问 3-5 轮对齐需求，避免 agent 跑偏 |
| grilling | skills/grilling.md | 被 grill-me 调用，一般不直接触发 | grill-me 的底层盘问循环实现 |
| ask-matt | skills/ask-matt.md | 用户问"我该用哪个 skill"、不确定走哪条流程时 | 路由器，根据任务推荐合适的 skill |
| prototype | skills/prototype.md | 需求不清、想试两种 UI 方案、需要验证业务逻辑时 | 抛弃式原型：terminal app 或多个可切换 UI 变体 |

## Vibe Coding 工作流（参考）

```
新功能/新想法 -> [需求模糊? -> grill-me] -> 直接开写
                                          |
                            +-------------+-------------+
                            |             |             |
                       上下文要爆      Bug 修不动    每 3-5 天
                       handoff      diagnosing-bugs  improve-codebase-architecture
```

## Git 工作流

项目采用 **GitHub Flow**，完整规范见 [.github/GIT_WORKFLOW.md](./.github/GIT_WORKFLOW.md)；
agent 的执行步骤与红线见 [.github/GIT_AGENT.md](./.github/GIT_AGENT.md)（动手前先读它）。
以下是 agent 执行 git 操作时必须遵守的要点：

### 何时动手

- **只在用户明确要求时**执行 commit / push / 建分支 / 开 PR，不要主动提交。
- 用户说"提交"时：先 `git status` + `git diff` 确认改动范围，再按下方规范提交；不确定的部分先问。

### Commit 规范（Conventional Commits）

- 格式：`<type>(<scope>): <subject>`，如 `feat(templates): 新增主题设置`
- type 清单：`feat` / `fix` / `test` / `docs` / `refactor` / `chore` / `style` / `perf` / `ci` / `build`
- subject 用祈使句、不超过 50 字符、首字母小写、不加句号
- 提交前先看 `git log` 最近几条，保持与仓库历史风格一致
- body 说明"为什么"而非"做了什么"（diff 已展示做了什么）

### 分支规范

- 从 `main` 拉分支，命名 `feat/<描述>` / `fix/<描述>` / `docs/<描述>` / `refactor/<描述>` / `chore/<描述>`
- 分支名小写短横线；功能分支生命周期尽量短（≤ 3 天），合并后删除

### 红线（禁止操作）

- 禁止 `push --force` 到 `main`；其他分支 force push 也需用户明确授权
- 禁止修改 git config
- 禁止 `git add -A` / `git add .`（可能误加 .env / 密钥 / 大文件）——按文件名精确添加
- 不直接 push 到 `main`（除非用户明确要求），默认走 PR 合并

### PR 流程

- 用户要求开 PR 时：按 [.github/GIT_WORKFLOW.md](./.github/GIT_WORKFLOW.md) 与 [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) 执行
- 合并默认 **Squash and merge**，PR 标题与最终 commit message 一致
- Review 通过前必须跑通：`npx vue-tsc --noEmit` / `npx vitest run` / `npm run build` / `npm run lint`（覆盖 src、e2e 与 mcp-server）；改到 mcp-server 时另跑 `npm run mcp:test`

### 版本与发布

- 发版前更新 `CHANGELOG.md`，然后 `git tag -a vX.Y.Z -m "Release vX.Y.Z"` 并 `git push origin vX.Y.Z`
- 版本号遵循 SemVer：新增功能 MINOR、Bug 修复 PATCH、破坏性变更 MAJOR

## 升级 skills

skills 仓库缓存在 `C:\Users\lyle\skills-repo`。升级步骤：

```powershell
cd C:\Users\lyle\skills-repo
git pull
# 然后重新拷贝需要的 skill 文件到 D:\code_study\resume-tool\skills\
```

## 不在本项目的 skills（按需再装）

以下 skills 属于工程纪律型，与 vibe coding 心智冲突，**未安装**：

- `tdd` —— 红绿重构，会打断 vibe 节奏
- `grill-with-docs` / `domain-modeling` —— 重工程纪律，建 CONTEXT.md / ADR
- `to-prd` / `to-issues` / `triage` —— 需 issue tracker，单人 vibe 用不上
- `setup-matt-pocock-skills` —— 配置 issue tracker，无 tracker 就不用跑

需要时按同样方式拷到 `skills/` 并在本表格补一行即可。
