# PR · dev → main：编辑器 v2.3 + 13 套模板缺字段适配

**分支**：`dev` → `main`
**Commit**：`a481446` `20e00a0` `129a298` `ddccf7f` `f8975ba` `e685a74` `2e5d57d` `c488be0` + 两个合并提交
**规模**：127 files, +9020 / −768

**创建链接**：https://github.com/ytester7/resume-tool/compare/main...dev?expand=1

> 复制下面 `---` 之间的全部内容粘贴到 PR 描述框即可。

---

## 变更说明

本 PR 将 `dev` 汇总到 `main`，包含两部分工作：

1. **编辑器 v2.3**：导入（PDF / Word / JSON / TXT）、Word / 打印 / 图片 PDF 三种导出、简历健康度、JD 匹配、撤销 / 重做、模块显隐、证件照、欢迎页与示例、模板缩略图。
2. **13 套模板的缺字段适配**：数据源字段缺失或为空时，不再出现空标题、空侧栏、半页空白、`26岁 岁` 等错位；导入层统一补全数据结构，展示层统一过滤空记录。

## 变更类型

- [x] feat: 新功能
- [x] fix: Bug 修复
- [x] docs: 文档

## 变更内容

### 1. 编辑器 v2.3

- **导入**：`importFile.ts` 按扩展名分流，PDF 走 `pdfjs-dist`、Word 走 `mammoth`、TXT/Markdown 走本地规则解析；`ImportDialog` 展示识别完整度与警告，确认后建 Tab。
- **导出**：html2pdf 图片 PDF、`docx` 生成 Word、浏览器打印输出可选中文字。
- **编辑体验**：健康度五维评分、JD 关键词匹配、按 Tab 的撤销重做、模块显隐（数据保留）、证件照上传与裁剪。
- **其他**：欢迎页与三套示例简历、13 套模板缩略图、A4 分页预览、GitHub Pages 部署 workflow。

### 2. 模板缺字段适配

- 新增 `src/utils/resumeView.ts`：统一空值判断、年龄/年限单位格式化、空记录过滤、区块内容判断与联系方式条目生成。
- `parseResume` 深层归一化：缺失数组补空、逐条补 id 与字段、`items` 支持多行字符串 / 数组两种来源、`evaluation` 宽容解析，同时保留 v2.3 的 `photo` / `targetJd` / `hiddenSections`。
- 共享组件：经历/项目/教育不再渲染空 header、空角色行、空 meta；技能表格按整列是否有值决定列并固定列宽；评价列表过滤空白条目。
- 13 套模板：空 header、空侧栏、空栏位、0 值统计全部隐藏；European 单栏折叠；QaPro/Executive/TechGradient 支持照片头像且无姓名时不显示 `?`；年龄/年限只在联系方式区展示一次。
- 自定义区块只有标题、没有正文时不再渲染空壳。

## 自查清单

- [x] `npx vue-tsc --noEmit` 类型检查通过
- [x] `npx vitest run` 单元测试通过（45 files / 495 tests，串行模式）
- [x] `npx eslint src/ e2e/` 无 error（83 warnings 均为既有历史代码）
- [x] `npm run build` 构建成功
- [x] 新增功能已附带测试（覆盖率未单独统计）
- [x] 本次新增/修改代码未引入 `@ts-ignore`
- [x] 异步组件用 `defineAsyncComponent` 包装
- [x] 未修改 `resume-builder/` 和 `docs/superpowers/`
- [x] Commit message 符合 Conventional Commits
- [x] `npx playwright test` E2E 通过（20 passed）

## 影响面与兼容性

- `photo` / `hiddenSections` / `targetJd` 均为可选字段，旧 JSON 缺失时按原行为处理，`_meta.version` 仍为 `2.0`。
- 模板适配只改变渲染层与导入归一化，不改变存档字段结构；空记录仍保留给编辑器继续填写，预览时过滤。
- 新增导入/导出依赖均已动态导入，不影响首屏。

## 已知取舍

1. 分页仍按内容高度估算，PDF 断页位置可能与预览差一个块的高度。
2. 隐藏模块仍计入健康度（按完整数据打分）。
3. 模板适配与 v2.3 在 5 个文件上有历史重叠，已在 `dev` 合并时解决冲突并通过全量校验。
