# CLAUDE.md

> 本项目的 AI 编码约束统一定义在 [AGENTS.md](./AGENTS.md) 中。
> 在进行任何代码修改前，请先阅读 AGENTS.md。

## 快速要点

- **技术栈**：Vue 3 `<script setup lang="ts">` + Vite + Pinia + Vitest + Playwright
- **路径别名**：`@/` → `src/`
- **类型检查**：`npx vue-tsc --noEmit`（必须 exit 0）
- **单元测试**：`npx vitest run`（必须全绿，覆盖率 ≥ 80%）
- **E2E 测试**：`npx playwright test`（涉及预览/模板/编辑器时运行）
- **构建**：`npm run build`（必须成功）
- **Commit**：Conventional Commits（`feat:` / `fix:` / `test:` / `docs:` / `refactor:` / `chore:`）

## 关键约束

1. 异步组件必须用 `defineAsyncComponent` 包装，禁止裸函数 `() => import(...)`
2. 禁止修改 `resume-builder/` 和 `docs/superpowers/`
3. 禁止用 `@ts-ignore` 绕过类型错误
4. 新增功能必须附带测试
5. 分层依赖：`types → utils → stores → composables → components → App`，禁止逆向

完整规范见 [AGENTS.md](./AGENTS.md)。
