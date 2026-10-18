# Git 执行手册（Agent 版）

> 面向 AI 编码代理（Claude Code / Cursor / Codex / Trae 等）。
> 人读的完整规范见 [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)；本文件只回答一件事：**agent 动手时按什么步骤、守什么红线**。

## 0. 何时才动手

| 用户说 | 你做什么 |
|---|---|
| 「提交」「commit」 | 只 `git add` + `git commit`，**不 push** |
| 「推送」「push」 | 在已有 commit 基础上 push 当前分支 |
| 「开 PR」 | push 分支 + 按模板写 PR 描述 |
| 「发版」 | 更新 CHANGELOG + 打 tag + push tag |
| 其他任何情况 | **不要提交**，哪怕你刚改完代码 |

没有明确指令就提交，是本项目最容易踩的协作事故。

## 1. 动手前：先看清工作区（必做）

```bash
git status --short          # 改了哪些文件
git diff --stat             # 改动规模
git diff <关键文件>          # 至少读一遍核心 diff
git log --oneline -5        # 对齐历史 message 风格
```

判读顺序：

1. **改动属于几个逻辑？** 一个逻辑一次提交；能按文件拆就拆。
2. **有没有混入不该提交的东西？** `my-resume/`、`resume-docs/`、`.env*`、`dist/`、截图等临时产物。
3. **能不能构建？** 先跑第 5 节的验证，再提交。
4. **拆不开怎么办？** 多个功能的改动交织在同一文件（如 `App.vue`）时，按文件拆分会导致中间提交不可构建——此时合并为一次提交，用 body 分条列出，不要硬拆。

## 2. 红线（任何情况都不做）

- ❌ `git add -A` / `git add .` / `git commit -am` —— 必须按路径精确暂存
- ❌ `git push --force`（含 `--force-with-lease`，除非用户明确要求且不是 main）
- ❌ 修改 `git config`（用户名、邮箱、hooks 路径等）
- ❌ `--no-verify` 跳过 hooks
- ❌ 直接往 `main` push（默认走 PR）
- ❌ 提交密钥、`.env`、个人简历数据、`node_modules`、构建产物
- ❌ 对已经推送过的 commit 做 `amend` / `rebase` 改写历史
- ❌ 未经询问就删除用户的分支或未跟踪文件

## 3. 分支

```
main ──► feat/<描述> | fix/<描述> | docs/<描述> | refactor/<描述> | chore/<描述> | hotfix/<描述>
```

- 新功能从 `main` 拉分支；分支名小写短横线，如 `feat/section-modules`
- 用户没要求建分支时，**在当前分支提交**，不要自作主张切分支
- 合并后用 Squash and merge，合并后删除分支

## 4. 提交信息

```
<type>(<scope>): <subject>

<body：为什么这么改>

<footer：Closes #12 / BREAKING CHANGE: ...>
```

| type | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | 修 bug |
| `test` | 测试相关 |
| `docs` | 文档 |
| `refactor` | 重构（行为不变） |
| `perf` | 性能优化 |
| `style` | 纯格式 |
| `chore` | 构建/依赖/工具 |
| `ci` | CI 配置 |
| `build` | 构建系统 |

**subject 规则**：祈使句、不超过 50 字符、不加句号；中文直接写（英文才谈首字母小写）。

```
feat(editor): 新增模块显隐开关
fix(preview): 修正页数在内容变短后不回落
docs: 补充 Git 执行手册
```

**body 写「为什么」**：背景、取舍、影响面；diff 已经说明了「改了什么」。
**footer** 用 `Closes #18` 关联 issue；破坏性变更写 `BREAKING CHANGE: 旧 JSON 需迁移`。

## 5. 提交前验证（按改动性质选）

```bash
npx vue-tsc --noEmit            # 必跑：类型检查
npx vitest run                  # 必跑：单元测试
npx eslint src/ e2e/            # 必跑：Lint
npm run build                   # 必跑：构建
npx playwright test             # 涉及预览/模板/编辑器的改动加跑
```

任何一项失败 → 先修，别提交。

## 6. 标准提交流程

```bash
# 1) 精确暂存（列路径，不用 -A）
git add src/components/AutoTextarea.vue src/components/EditorPanel.vue

# 2) 复核暂存内容，确认没有夹带
git diff --staged --stat
git diff --staged -- <关键文件>

# 3) 提交（多行用 -m 多次或 heredoc）
git commit -m "feat(editor): 新增模块显隐开关" -m "隐藏只影响渲染，数据保留；状态随 _meta.hiddenSections 落盘。"

# 4) 确认结果
git log -1 --stat
```

**不要自动 push**；需要 push 时单独确认。

## 7. PR（用户要求时）

1. `git push -u origin <branch>`
2. PR 标题 = 最终 squash 后的 commit message
3. 描述用 [PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md)，并同步存一份到 `docs/pr-descriptions/PR-<N>-<slug>.md`
4. 合并方式：**Squash and merge**

## 8. 版本与发布（用户要求时）

SemVer：破坏性 `MAJOR`、新功能 `MINOR`、修复 `PATCH`。

```bash
# 1) 更新 CHANGELOG.md
# 2) 同步 package.json version
git tag -a v2.3.0 -m "Release v2.3.0"
git push origin v2.3.0
```

## 9. 出问题时

| 情况 | 正确做法 |
|---|---|
| 提交信息写错、尚未 push | 询问用户是否 `git commit --amend` |
| 已 push 发现写错 | 不 amend，补一个 `fix:` 提交 |
| rebase 冲突 | `git rebase --abort` 后向用户报告，不硬来 |
| 误把文件加入暂存 | `git restore --staged <file>`，不删工作区文件 |
| hook 失败 | 修代码后重新提交，不加 `--no-verify` |

## 10. 提交后的汇报格式

给用户一条简短回执即可：

```
已提交 abc1234：feat(editor): 新增模块显隐开关（12 files, +480 / -60）
未推送。需要我推送到 origin/feat/xxx 吗？
```

不要贴完整 diff，不要自动执行下一步。
