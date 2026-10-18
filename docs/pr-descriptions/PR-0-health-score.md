# PR-0 · 简历健康度评分

**分支**：`feat/health-score` → `main`　**Commit**：`a481446` + `20e00a0`

**创建链接**：https://github.com/ytester7/resume-tool/pull/new/feat/health-score

> 复制下面 `---` 之间的全部内容粘贴到 PR 描述框即可。

---

## 变更说明

为简历编辑器补上**内容质量反馈能力**——此前用户填完字段后无从判断"还缺什么"，只能靠主观判断，导致简历详略失衡。

同时修复一处会误导用户的计数缺陷。

## 变更内容

### 1. feat(editor): 简历健康度评分

新增 `src/utils/healthScore.ts` 纯函数模块，从五个维度打分（总分 100）：

| 维度 | 分值 | 判定内容 |
|---|---|---|
| 完整性 | 25 | 必填字段是否齐备 |
| 量化度 | 25 | 经历描述是否含数字与单位 |
| 充实度 | 20 | 各区块条目数量是否达标 |
| 关键词 | 15 | 是否命中岗位相关技术词 |
| 规范性 | 15 | 时间格式、邮箱、手机号格式 |

接入 `EditorPanel.vue` 顶部卡片：总分 + 等级徽章（优秀/良好/合格/待改进）+ 五条维度进度条。

每条改进建议**可点击定位**到对应编辑区块并高亮闪烁 1.2s，复用既有的 `data-health-target` 属性与 `.health-flash` 动画，不引入新的定位通道。

### 2. fix(autosave): 启动恢复计数误导

`useStartupRecovery.ts` 恢复孤儿 Tab 时，toast 一直用入参总数 `orphans.length` 作为成功数。当部分数据损坏、`parseResumeFile` 抛错被 catch 静默跳过时，用户会看到"已恢复 3 个简历"而实际只打开 1 个——既误导，也掩盖了数据损坏。

改为累加实际成功数，并区分三种提示：
- 全部失败 → warning 提示数据可能已损坏
- 部分失败 → 明确给出成功数与丢弃数
- 全部成功 → 保持原有简洁文案

### 3. chore: `.workbuddy/` 加入 .gitignore

AI 助手本地记忆目录，不应入库。

## 自查清单

- [x] `npx vue-tsc --noEmit` 类型检查通过
- [x] `npx vitest run` 单元测试通过（27 files / 279 tests）
- [x] `npx eslint src/ e2e/` ESLint 无 error（72 warnings 均为既有历史代码）
- [x] `npm run build` 构建成功
- [x] 新增功能已附带测试（`healthScore.spec.ts` 519 行）
- [x] 无 `any` / `@ts-ignore`
- [ ] `npx playwright test` E2E —— **本机环境未能跑完，见下方说明**

## ⚠️ 关于 E2E 未完成

本机运行 Playwright 两次均在 12 分钟无输出后被终止（dev server 正常响应 200、chromium 已安装，疑似环境层面挂起，非用例失败）。

**风险评估：低**。本次改动仅涉及：
- 新增 `src/utils/healthScore.ts`（纯函数，无副作用）
- `EditorPanel.vue` 内部新增健康度卡片（位于区块顺序面板**之前**，编辑区块顺序未变）
- `useStartupRecovery.ts` 的 toast 文案分支

**未触碰**任何 E2E 依赖的选择器：`.toolbar` / `.tab-*` / `.preview-canvas` / `.template-card` / `.skill-edit-row` / `.exp-edit-card` / `.section-order-panel`。三个既有 spec（`smoke` / `multi-tab` / `drag-sort`）的断言对象均未变化。

建议合并前由 CI 或本地复跑一次 E2E 确认。

## 影响面

- 评分逻辑为纯函数，不改动数据结构与存储格式
- 旧简历 JSON 文件完全兼容（`_meta.version` 未变）
- 现有 13 套模板零改动

## 关联规划

本 PR 是 P0 体验止血迭代的起点，后续依次推出：
1. 示例简历填充（解决新用户打开一片空白）
2. 模板缩略图（13 套模板当前仅有文字列表）
3. 撤销/重做（当前缺失，误删条目需重打）
4. 打印通道（当前仅光栅化 PDF，中文断行易错位）
5. 分栏拖拽（编辑区宽度硬编码 380px）

详见 `docs/project-review-2026-10.md`。