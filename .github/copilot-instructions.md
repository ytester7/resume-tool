# GitHub Copilot Instructions

> 本项目的 AI 编码约束统一定义在 [`AGENTS.md`](../../AGENTS.md) 中（仓库根目录）。
> 在生成或修改代码前，请遵循 AGENTS.md 中的全部规范。

## 快速要点

- **技术栈**：Vue 3 `<script setup lang="ts">` + Vite + Pinia + Vitest + Playwright
- **路径别名**：`@/` → `src/`
- **验证命令**（修改后必须全部通过）：
  - `npx vue-tsc --noEmit` — 类型检查
  - `npx vitest run` — 单元测试（覆盖率 ≥ 80%）
  - `npx eslint src/ e2e/` — 代码规范（0 error）
  - `npm run build` — 构建
- **Commit**：Conventional Commits 格式（`feat:` / `fix:` / `test:` / `docs:` / `refactor:` / `chore:`）

## 关键约束

1. 异步组件必须用 `defineAsyncComponent(() => import(...))` 包装
2. TypeScript strict 模式，禁止 `any`（除非有明确注释说明）
3. 新增功能必须附带单元测试
4. 禁止修改 `resume-builder/` 和 `docs/superpowers/`
5. 分层依赖：`types → utils → stores → composables → components → App`，禁止逆向

完整规范见 [`AGENTS.md`](../../AGENTS.md)。
