# 贡献指南

感谢你对 resume-tool 的关注！本文档说明如何参与本项目开发。

## 开发环境搭建

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9（或 pnpm / yarn）
- 现代浏览器（推荐 Chrome 86+ 用于完整功能测试）

### 步骤

```bash
# 1. Fork 仓库后克隆到本地
git clone https://github.com/<your-username>/resume-tool.git
cd resume-tool

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 运行单元测试（watch 模式便于开发）
npm run test:watch

# 5. 运行类型检查 + 构建
npm run build
```

首次运行 E2E 测试前需安装 Playwright 浏览器：

```bash
npx playwright install
```

## 代码规范

### TypeScript

- 项目启用 **strict 模式**（见 `tsconfig.json`），所有新代码必须通过类型检查。
- 构建命令 `npm run build` 会先执行 `vue-tsc --noEmit` 做类型检查，类型错误会阻断构建。
- 优先使用 Composition API + `<script setup lang="ts">` 语法。
- 为新增的公共 API、类型、工具函数补充类型注解，避免 `any`。

### 代码风格

- 遵循现有文件中的代码风格与目录组织约定。
- 新增组件按既有命名约定：组件文件使用 `PascalCase.vue`，composable 使用 `useXxx.ts`，store 使用小写文件名。
- 不要为未改动的代码添加无关注释或类型注解。

### Commit 信息格式

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范，提交信息格式：

```
<type>: <简短描述>
```

常用 type：

| type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `test` | 新增 / 修改测试 |
| `docs` | 文档变更 |
| `refactor` | 重构（不改变外部行为） |
| `chore` | 构建 / 工具 / 杂项 |
| `style` | 代码格式（不影响功能） |
| `perf` | 性能优化 |

示例：

```
feat: 实现 Minimal/Gradient/Creative/DataDriven 4 个单列可变序模板
fix: 修正 ui-components.spec.ts 中 toastInfo 调用签名
test: 补充 fileSystem mock 路径与 useAutoSave 主函数测试
docs: 补充 README 与贡献指南
```

## 测试要求

本项目要求 **新增功能必须附带测试**，Bug 修复建议附回归测试。

### 单元测试（Vitest）

- 测试文件与被测文件同目录，命名为 `*.spec.ts`（见现有 `src/**/*.spec.ts` 约定）。
- 覆盖核心逻辑：store / composable / 工具函数 / 组件交互。
- 运行：

  ```bash
  npm run test            # 单次运行
  npm run test:watch      # watch 模式
  npm run test:coverage   # 覆盖率报告
  ```

- 目标覆盖率不低于 80%，关键模块（utils / stores）尽量达到 90%+。

### E2E 测试（Playwright）

- E2E 测试位于 `e2e/` 目录，覆盖关键用户流程：冒烟流程、拖拽排序、多 Tab 管理。
- 运行：

  ```bash
  npm run e2e
  ```

- 新增用户可见功能（如新模板、新交互）需补充对应 E2E 用例。

### 提交前的检查清单

在提交 PR 前，请确保本地通过以下检查：

```bash
# 1. 类型检查 + 构建
npm run build

# 2. 单元测试全绿
npm run test

# 3. E2E 测试全绿
npm run e2e
```

## PR 流程

1. **Fork & 分支**：从 `main` 分支拉取新特性分支，命名建议 `feat/<short-desc>` 或 `fix/<short-desc>`。
2. **开发**：保证小步提交，每个 commit 符合 Conventional Commits 规范。
3. **测试**：补充单元 / E2E 测试，确保上述检查清单全部通过。
4. **自检**：在 PR 描述中说明：
   - 本次变更做了什么、为什么
   - 是否包含破坏性变更
   - 关联的 Issue 编号（如 `Closes #12`）
5. **提交 PR**：等待 review，根据评审意见迭代。通过后由维护者合并。

### 评审关注点

- 是否通过类型检查与全部测试
- 是否符合既有架构与命名约定
- 是否附带充分测试
- 是否引入了不必要的依赖或过度设计

## 行为准则

请保持友善、尊重的交流态度，聚焦技术讨论。对他人友好的反馈请认真对待，对评审意见有异议时基于事实与代码进行讨论。
