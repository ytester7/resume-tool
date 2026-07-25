# AGENTS.md — AI IDE / Agent 工作约束

> 本文件是所有 AI 编码助手（Claude Code、Cursor、GitHub Copilot、Trae 等）在本项目中工作的**唯一权威约束源**。
> 工具特定文件（`CLAUDE.md`、`.github/copilot-instructions.md`、`.cursor/rules/project.mdc`）均指向本文件。

## 项目概要

简历制作工具（resume-tool）：基于 Vue 3 + TypeScript 的本地优先简历编辑器，支持 13 套模板、三级拖拽排序、多 Tab 会话管理、PDF 导出。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3（`<script setup lang="ts">`） |
| 语言 | TypeScript（strict 模式） |
| 构建 | Vite |
| 状态管理 | Pinia |
| 拖拽 | vuedraggable（Sortable.js） |
| 测试 | Vitest（单元）+ Playwright（E2E） |
| PDF | html2pdf.js |
| 代码规范 | ESLint 9 flat config + Prettier |

## 目录结构

```
src/
├── components/
│   ├── sections/          # 8 个编辑区块组件（BasicInfo/Summary/Skills/...）
│   ├── templates/         # 13 个模板 + shared/ 6 个共享子组件
│   ├── EditorPanel.vue    # 编辑面板（整合 8 区块 + 区块顺序面板）
│   ├── PreviewPanel.vue   # 预览面板（defineAsyncComponent 懒加载 13 模板）
│   ├── TabBar.vue         # 多 Tab 管理
│   ├── Toolbar.vue        # 顶部工具栏
│   ├── DraggableList.vue  # 通用拖拽列表
│   ├── ConfirmDialog.vue  # 确认对话框
│   ├── Toast.vue          # 通知组件
│   └── AppIcon.vue        # 图标组件
├── composables/           # 组合式函数（useAutoSave/useSectionOrder/useKeyboardShortcuts/...）
├── stores/                # Pinia store（fileSystem/tabs/ui）
├── types/                 # 类型定义（resume.ts/icons.ts）
├── utils/                 # 工具函数（parseResume/sanitize/icons）
└── styles/                # 全局样式
e2e/                       # Playwright E2E 测试
```

## 分层架构（严格遵守）

```
types → utils → stores → composables → components → App
```

- **禁止逆向依赖**：`types/` 不依赖任何上层；`utils/` 不依赖 `stores/`；`stores/` 不依赖 `components/`
- **composables** 可依赖 `stores/` 和 `utils/`，不可依赖 `components/`
- **components** 可依赖所有下层

## 代码规范

### TypeScript

- `strict: true` + `noUnusedLocals` + `noUnusedParameters`
- 禁止 `any`（如必须使用，加 `// eslint-disable-next-line` 注释说明原因）
- 类型优先用 `interface`，联合类型/字面量类型用 `type`
- 公共函数必须有显式参数和返回值类型标注

### Vue 3 组件

- 统一使用 `<script setup lang="ts">`
- Props 用 `defineProps<{ ... }>()` 类型声明，不用 runtime 声明
- Emits 用 `defineEmits<{ ... }>()`
- 异步组件必须用 `defineAsyncComponent(() => import(...))` 包装，**禁止**裸函数 `() => import(...)`
- 组件文件名 PascalCase，模板中用 PascalCase 引用

### Pinia Store

- 用 Setup Store 风格（`defineStore('name', () => { ... })`）
- state 用 `ref()`，getters 用 `computed()`
- action 直接定义函数

### 样式

- 组件内样式用 `<style scoped>`
- 全局样式放 `src/styles/`
- 类名用 kebab-case

## 测试要求

| 类型 | 工具 | 位置 | 命名 |
|---|---|---|---|
| 单元测试 | Vitest | `*.spec.ts` 同目录 | `{filename}.spec.ts` |
| E2E | Playwright | `e2e/*.spec.ts` | `{feature}.spec.ts` |

- **新增功能必须附带测试**
- 单元测试覆盖率 ≥ 80%
- 测试先写测试 → 运行确认失败 → 实现 → 运行确认通过（TDD）
- 禁止删除已有测试用例来"修复"失败

## 验证命令（修改后必须全部通过）

```bash
npx vue-tsc --noEmit          # 类型检查，exit 0
npx vitest run                # 单元测试，全绿
npx eslint src/ e2e/          # ESLint，0 error
npm run build                 # 构建，成功
```

修改涉及预览/模板/编辑器交互时，额外运行：
```bash
npx playwright test           # E2E 测试，全绿
```

## Git 工作流

采用 GitHub Flow，完整规范见 [`.github/GIT_WORKFLOW.md`](./.github/GIT_WORKFLOW.md)。

### 分支策略

| 分支 | 用途 | 命名 |
|---|---|---|
| `main` | 生产分支 | 固定，禁止 force push |
| `feat/*` | 新功能 | `feat/<描述>` |
| `fix/*` | Bug 修复 | `fix/<描述>` |
| `docs/*` | 文档 | `docs/<描述>` |
| `hotfix/*` | 紧急修复 | `hotfix/<描述>` |

合并策略：默认 **Squash and merge**，合并后删除分支。

### Commit 规范

Conventional Commits 格式：

| type | 用途 |
|---|---|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `test:` | 测试相关 |
| `docs:` | 文档 |
| `refactor:` | 重构（不改变行为） |
| `chore:` | 构建/配置/工具 |
| `style:` | 代码格式（不影响逻辑） |
| `perf:` | 性能优化 |

## 禁止事项

1. **禁止修改** `resume-builder/`（原始旧代码，仅供参考）
2. **禁止修改** `docs/superpowers/`（内部开发计划文档）
3. **禁止** 在 `src/` 中引入新的全局依赖，除非确有必要
4. **禁止** 使用 `// @ts-ignore` 或 `// @ts-expect-error` 绕过类型错误
5. **禁止** 删除已有测试来让构建通过
6. **禁止** 在模板中使用裸函数 `() => import(...)` 作为异步组件

## 异步组件注意事项

本项目在 Phase 7 修复过一个严重 bug：PreviewPanel 用裸函数传给 `<component :is>` 导致渲染 `[object Promise]`。所有异步组件必须用 `defineAsyncComponent` 包装：

```ts
// ✅ 正确
const Comp = defineAsyncComponent(() => import('./Comp.vue'))

// ❌ 错误 — 会渲染为 [object Promise]
const Comp = () => import('./Comp.vue')
```

## 模板系统

13 个模板分两类：

| 类型 | 模板 | sectionOrder |
|---|---|---|
| 单列可变序（8） | classic/minimal/gradient/creative/data-driven/qa-pro/card-style/chinese-elegant | 支持 |
| 固定布局（5） | modern/executive/european/tech/tech-gradient | 忽略 |

所有模板复用 `src/components/templates/shared/` 下的 6 个共享子组件，禁止在单个模板中重复实现联系人/技能/经历等渲染逻辑。
