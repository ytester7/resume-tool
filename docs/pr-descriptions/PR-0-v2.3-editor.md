# PR-0 · 编辑器 v2.3：导入导出、健康度、JD 匹配与模块显隐

**分支**：`feat/health-score` → `main`
**Commit**：`a481446` `20e00a0` `129a298` `ddccf7f` `f8975ba`
**规模**：105 files, +7631 / −487

**创建链接**：https://github.com/ytester7/resume-tool/pull/new/feat/health-score
**建议标题**：`feat: 编辑器 v2.3 — 导入导出、健康度、JD 匹配与模块显隐`

> 复制下面 `---` 之间的全部内容粘贴到 PR 描述框即可。

---

## 变更说明

这一版补齐了简历工具的完整闭环：**进得来（导入）、改得动（编辑体验）、出得去（导出）、管得住（模块显隐）**。

此前的问题是：只能用 JSON 打开、导出只有光栅化 PDF、填完内容不知道好坏、不想要的模块只能删数据。v2.3 把这几处一次性补上。

## 变更类型

- [x] feat: 新功能
- [x] fix: Bug 修复
- [x] docs: 文档

## 变更内容

### 1. 导入：PDF / Word / JSON / TXT

- `importFile.ts` 统一入口，按扩展名分流；PDF 走 `pdfjs-dist`、Word 走 `mammoth` 抽文本
- `importText.ts` 用本地规则把纯文本解析成 `ResumeData`（识别姓名/联系方式/区块标题/条目）
- `ImportDialog.vue` 解析确认弹窗：展示识别到的字段、条目数、置信度，确认后才建 Tab
- `data/samples.ts` 三套示例简历，解决新用户打开一片空白

### 2. 导出：三条通道

| 通道 | 实现 | 适用 |
|---|---|---|
| PDF | `html2pdf.js`（A4、scale 2） | 通用投递 |
| Word | `docx` 库直接生成 `.docx` | 需要再编辑 |
| 打印 | 浏览器原生打印 + `print.css` | 矢量文字、ATS 可解析 |

### 3. 编辑体验

- **简历健康度**（`healthScore.ts`）：完整性 / 量化度 / 充实度 / 关键词 / 规范性五维打分，建议项可点击定位并高亮
- **JD 匹配**（`jdMatch.ts` + `JdMatchSection`）：粘贴 JD 后比对关键词命中与缺口，数据只存本地
- **撤销/重做**（`useUndoHistory.ts`）：按 Tab 维护快照栈，400ms 防抖合并连续输入
- **模块显隐**（`hiddenSections.ts`）：模块面板即最终简历结构，关掉的模块移入「已隐藏」折叠区，数据保留、可随时放回

### 4. 预览与输入体验

- 长文本字段换用 `AutoTextarea`（高度随内容自适应），左栏 88 个控件里原本 **37 个内容被截断，现在 0**
- 分页线由红色细虚线改为实线页缝 + 「第 N 页 / 共 N 页」胶囊
- **修复**：页数在内容变短后不回落——分页线是绝对定位子元素，会撑大 `scrollHeight`，改用元素盒高测量

### 5. 工程与文档

- 版本 2.3.0；新增 `@vueuse/core` / `docx` / `html2pdf.js` / `mammoth` / `pdfjs-dist`
- 13 套模板缩略图 + `scripts/generate-thumbs.mjs`
- GitHub Pages 部署 workflow
- `.github/GIT_AGENT.md` Git 执行手册，并让 CLAUDE.md / Cursor / Copilot 三个入口自动加载 Git 红线

## 自查清单

- [x] `npx vue-tsc --noEmit` 类型检查通过（0 error）
- [x] `npx vitest run` 单元测试通过（43 files / 405 tests）
- [x] `npx eslint src/ e2e/` 无 error（83 warnings 均为既有历史代码）
- [x] `npm run build` 构建成功
- [x] 新增功能已附带测试（导入解析、健康度、JD 匹配、模块显隐、AutoTextarea 均有 spec）
- [x] 无 `any` / `@ts-ignore`
- [x] 异步组件用 `defineAsyncComponent` 包装
- [x] 未修改 `resume-builder/` 和 `docs/superpowers/`
- [x] Commit message 符合 Conventional Commits
- [x] `npx playwright test`（smoke + features，11 passed）

## 影响面与兼容性

- 新增 `_meta.hiddenSections` 字段，旧 JSON 无此字段时按「全部显示」处理，向后兼容
- `_meta.version` 仍为 `2.0`，13 套模板零改动
- 模块隐藏只作用于渲染层，不改动 `ResumeData` 原有字段
- 导入/导出新增依赖，体积增加约 1.3MB（均已动态导入，不影响首屏）

## 已知取舍

1. **分页仍是估算**：预览按内容高度切页，PDF 导出走 html2pdf 的 `avoid-all`（整块下移），两者断页位置可能差一个块的高度。真正的对齐需要块级分页引擎，留作后续。
2. **隐藏模块仍计入健康度**：目前按完整数据打分，关掉项目经历仍可能提示"项目偏少"，是否剔除待产品确认。
3. **模块列表按 index 渲染过一版竞态**：原生 checkbox 在列表项复用时会串位，已改为无状态 `role="switch"` 按钮。
