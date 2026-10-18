# CLAUDE.md

@AGENTS.md

> 上一行是 Claude Code 的导入语法，启动时会**自动展开 AGENTS.md 全文**（skills 索引、Git 工作流、验证命令），
> 不是超链接、不需要手动打开。下面保留的是 Claude 侧最常用的速查，冲突时以 AGENTS.md 为准。
>
> 其它工具的自动加载点是：Cursor `.cursor/rules/project.mdc`（alwaysApply）、
> Copilot `.github/copilot-instructions.md`、Codex/通用 `AGENTS.md`。Git 详版手册：`.github/GIT_AGENT.md`。

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
