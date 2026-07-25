# Git 工作流规范

> 本项目采用 **GitHub Flow**（简化版），适合中小型项目的快速迭代。

## 分支策略

| 分支 | 用途 | 命名规则 | 保护规则 |
|---|---|---|---|
| `main` | 生产分支，始终可部署 | 固定 | 禁止 force push，必须通过 PR 合并 |
| `feat/*` | 新功能开发 | `feat/<简短描述>`，如 `feat/pdf-export` | — |
| `fix/*` | Bug 修复 | `fix/<简短描述>`，如 `fix/preview-async` | — |
| `docs/*` | 文档更新 | `docs/<简短描述>` | — |
| `refactor/*` | 代码重构 | `refactor/<简短描述>` | — |
| `chore/*` | 构建/配置/依赖 | `chore/<简短描述>` | — |
| `hotfix/*` | 紧急修复（直接从 main 拉出） | `hotfix/<简短描述>` | 合并后删分支 |

### 分支生命周期

```
main ──────────────────────────────────────────── ▲
  │                                                  │
  └─ feat/pdf-export ────── PR ──── review ── merge ┘
                                                │
                                           删除分支 ◄┘
```

- 功能分支生命周期尽量短（建议 ≤ 3 天）
- 合并后立即删除分支
- 长期未合并的分支及时 rebase 或关闭

## Commit 规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

- `type`：必填，见下表
- `scope`：可选，影响范围（如 `templates`、`editor`、`stores`）
- `subject`：必填，简短描述（祈使句，首字母小写，不加句号）
- `body`：可选，详细说明（每行 ≤ 100 字符）
- `footer`：可选，BREAKING CHANGE 或关闭 issue

### Type 清单

| type | 用途 | 示例 |
|---|---|---|
| `feat` | 新功能 | `feat: 实现 PDF 导出` |
| `fix` | Bug 修复 | `fix: PreviewPanel 异步组件渲染失败` |
| `test` | 测试相关 | `test: 添加 E2E 拖拽排序测试` |
| `docs` | 文档 | `docs: 添加 AI 工具约束文件` |
| `refactor` | 重构（不改行为） | `refactor: 抽取 DraggableList 通用组件` |
| `chore` | 构建/配置/工具 | `chore: 配置 ESLint + Prettier` |
| `style` | 代码格式 | `style: 统一缩进为 2 空格` |
| `perf` | 性能优化 | `perf: 模板懒加载减少首屏体积` |
| `ci` | CI 配置 | `ci: 添加 GitHub Actions 工作流` |
| `build` | 构建系统 | `build: 升级 Vite 到 6.x` |

### 写作要点

- **subject** 用祈使句：`实现 PDF 导出` ✅ / `实现了 PDF 导出` ❌
- **subject** 不超过 50 字符
- **body** 说明"为什么"而非"做了什么"（diff 已展示做了什么）
- **BREAKING CHANGE** 在 footer 标注：`BREAKING CHANGE: 模板配置格式变更，旧 JSON 需迁移`

### 示例

```
feat: 实现 PDF 导出（html2pdf + A4 + 高清缩放）

使用 html2pdf.js 动态导入，A4 纵向，scale:2 高清。
通过 defineAsyncComponent 懒加载，不影响首屏性能。

Closes #18
```

## Pull Request 流程

### 1. 创建 PR

```bash
# 从 main 创建功能分支
git checkout main
git pull
git checkout -b feat/your-feature

# 开发 + 提交
git add <files>
git commit -m "feat: ..."

# 推送
git push -u origin feat/your-feature
```

### 2. PR 标题

与最终 squash merge 的 commit message 一致：
```
feat: 实现 PDF 导出（html2pdf + A4 + 高清缩放）
```

### 3. PR 描述（使用模板）

见 `.github/PULL_REQUEST_TEMPLATE.md`。

### 4. Code Review 清单

Reviewer 必须确认：

- [ ] 类型检查通过（`npx vue-tsc --noEmit`）
- [ ] 单元测试通过（`npx vitest run`）
- [ ] ESLint 无 error（`npx eslint src/ e2e/`）
- [ ] 构建成功（`npm run build`）
- [ ] 新增功能有对应测试
- [ ] 无 `any` / `@ts-ignore`
- [ ] 异步组件用 `defineAsyncComponent` 包装
- [ ] 未修改 `resume-builder/` 和 `docs/superpowers/`
- [ ] Commit message 符合 Conventional Commits

### 5. 合并策略

| 策略 | 适用场景 |
|---|---|
| **Squash and merge**（默认） | 功能分支，将多个 commit 压缩为一个 |
| **Rebase and merge** | 需要保留独立 commit 历史 |
| **Create merge commit** | 大特性分支，需保留分支历史 |

本项目默认用 **Squash and merge**。

## 版本号规范（Semantic Versioning）

```
MAJOR.MINOR.PATCH
   2    .  0  .  0
```

| 版本位 | 何时递增 | 示例 |
|---|---|---|
| MAJOR | 不兼容的 API 变更 | v2.0.0 → v3.0.0 |
| MINOR | 向下兼容的新功能 | v2.0.0 → v2.1.0 |
| PATCH | 向下兼容的 Bug 修复 | v2.0.0 → v2.0.1 |

### Release 流程

1. 更新 `CHANGELOG.md`
2. 创建 git tag：`git tag -a v2.0.1 -m "Release v2.0.1"`
3. 推送 tag：`git push origin v2.0.1`
4. GitHub Release 页面发布（附 changelog）

## 常见操作

### 同步上游变更

```bash
git checkout main
git pull origin main
git checkout feat/your-feature
git rebase main  # 或 git merge main
```

### 修复 PR review 意见

```bash
# 在同一分支继续提交
git add <files>
git commit -m "fix: 修复 review 意见"
git push
# PR 自动更新
```

### 紧急修复（hotfix）

```bash
git checkout main
git pull
git checkout -b hotfix/critical-bug
# 修复 + 测试
git commit -m "fix: 修复关键 bug"
git push -u origin hotfix/critical-bug
# 创建 PR，优先 review
# 合并后，main 打 patch tag
```
