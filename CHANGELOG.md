# Changelog

本项目所有重要变更均会记录在本文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- **投递记录台账（Boss直聘安全档）**：工具栏公文包入口，纯本地、不连接任何招聘平台。
  - 记录岗位（公司/岗位/渠道/JD 快照/链接备忘），JD 来自用户粘贴（Boss直聘等平台仅作渠道标签）
  - 状态流转 意向→已投递→已沟通→约面→面试→offer/不合适，变更自动写入备注时间线
  - 顶部漏斗统计（总计/已投递/已沟通/约面面试/offer），数字全部本地计算
  - 「分析 JD」一键把记录里的 JD 填入当前简历的岗位匹配（本地关键词 + 可选 AI 深度分析）
  - 「派生简历版本」复制当前简历生成「公司·岗位」命名的岗位定制副本并绑定 JD（多岗位版本矩阵入口）
  - JSON 导入导出（按 id 去重合并），localStorage 持久化（`resume_applications_v1`），坏记录自动剔除
- **AI 聊天助手（提案式改简历）**：编辑器右下角浮动按钮打开侧边对话面板；AI 基于简历段落目录提出修改提案，
  以卡片形式展示「原文 → 改后 + 理由」，用户逐条**采纳 / 忽略**后才写入；采纳走整体快照替换，Ctrl+Z 可撤销。
  - 段落提案协议（`utils/ai/proposals.ts`，移植自 Reactive Resume 并适配本项目纯字符串字段）：
    段落 id = 目标路径 + 内容哈希，文本一变 id 即失效；采纳前二次校验「当前文本 === 提案时文本」，
    模型基于旧目录或用户已手改的段落自动落为失效而非盲写；支持替换与在其后插入新条目两种编辑。
  - 对话按简历 Tab 独立保存（localStorage，最近 20 条），快捷建议一键发起；
    已保存的目标 JD 自动作为上下文附带。
- **AI 设置（BYOK）**：工具栏新增设置齿轮，弹窗内配置 AI 服务商（DeepSeek / OpenAI 兼容接口 / OpenRouter / OpenAI / Ollama 本地模型），
  支持连接测试（测试通过才可保存）、Key 脱敏回显与一键清除；配置只存本地 localStorage（`resume_tool_settings_v1`）。
- **AI 解析导入**：导入确认弹窗内新增「AI 智能解析」，把原文交给用户配置的模型做严格抽取（绝不推断、不确定留空），
  返回与本地解析同一份草稿契约，弹窗无差别复用；AI 结果带「请核对」警示与徽标。
- **JD 深度分析**：岗位匹配卡片新增「AI 深度分析」，产出语义缺口、优势与可点击定位到区块的修改建议；
  本地关键词匹配分保持免费且仍是唯一数字结论（AI 不出分数）。
- **单条润色**：工作/项目经历条目行新增 AI 按钮，提供强化动词 / 突出成果 / 精简 / 自定义指令四种改写；
  输出契约 `{text, why, addsFacts}`，新增事实会提示核对；应用前校验原文未变，替换写入正常数据流（可撤销）。
- AI 基础设施：`utils/ai/`（client / providers / prompt / importParse / jdAnalysis / improve / proposals / assistant）、
  `stores/settings.ts`、`SettingsDialog.vue`、`AiImproveButton.vue`、`AssistantPanel.vue`；
  新增依赖 zod 用于校验模型输出；提示词移植自 Reactive Resume 的安全结构（安全前缀、数据块防注入、输出契约约束）。

### Changed

- 隐私承诺更新：README 功能表与导入/JD 弹窗文案由「零网络请求」调整为「未配置 AI 时零网络请求」；
  AI 相关按钮在未配置时不出现，所有 AI 调用均由用户显式点击触发。

## [2.3.0] - 2026-10-18

### Added

- **旧简历导入**：工具栏「导入」与欢迎页均支持 PDF / Word（.docx）/ JSON / TXT / Markdown。
  - PDF 用 pdfjs-dist 读取文本层（扫描件会明确提示不支持）；
  - Word 用 mammoth 浏览器构建抽取段落；
  - 文本统一走本地规则解析（`utils/importText.ts`）：识别姓名、联系方式、求职意向、概述、技能、工作经历（公司/职位/时间/条目/关键成果）、项目、教育、自我评价，未知标题归入自定义区块。
- **导入确认弹窗**（`ImportDialog.vue`）：展示姓名 / 岗位 / 联系方式、各区块数量、0–100 识别完整度、警告列表与原文预览，确认后才创建简历 Tab。
- **拖拽导入**：把 PDF / Word / JSON / TXT 直接拖进页面即可导入；JSON 直接打开，其余格式进入确认页。
- 导入解析器、PDF/DOCX 抽取器、导入流程与弹窗的单测；`e2e/import.spec.ts` 覆盖 TXT 拖拽、JSON 直开与不支持格式提示。

### Changed

- 打开按钮文案改为「导入」，欢迎页提示支持 PDF / Word 导入与拖拽。
- `tabs.open` 使用 `toRaw` 后再 `structuredClone`，避免导入草稿的响应式代理导致克隆失败。
- 版本号升至 2.3.0。

## [2.2.0] - 2026-10-18

### Added

- **欢迎页与示例简历**：无 Tab 时展示欢迎页，内置测试 / 后端 / 产品三套虚构示例，点击即可进入编辑；首次使用不再面对空白表单。
- **模板缩略图**：模板选择由文字按钮升级为真实排版缩略图（240×300 JPEG），由 `npm run thumbs` 从当前模板离屏渲染生成。
- **A4 分页预览**：预览画布固定 210mm 宽、297mm 高，按内容高度绘制分页线并显示「A4 · N 页」，超过 2 页给出精简提示。
- **可选中文字的 PDF**：新增浏览器打印通道（`print.css` + `window.print()`），导出结果为矢量文字，可选中、可被 ATS 解析；html2pdf 保留为「图片 PDF（兼容模式）」。
- **Word 导出**：基于 docx 生成单栏 .docx，保留概述、技能、经历、项目、教育、自我评价与自定义区块。
- **岗位 JD 匹配**：新增本地关键词抽取与覆盖率分析（`utils/jdMatch.ts`），展示匹配分、已覆盖关键词与缺失关键词，JD 随文件 `_meta.targetJd` 保存。
- **撤销 / 重做**：每个 Tab 独立快照栈（上限 40 步），支持 `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` 与工具栏按钮。
- **证件照**：基本信息新增照片上传，自动 3:4 居中裁剪并压缩为 360×480 JPEG；Executive / QA专业 / 科技渐变 三套模板支持照片位。
- **移动端视图切换**：窄屏下编辑与预览改为二选一，避免上下各占一半都看不清。
- **部署与截图**：新增 GitHub Pages 部署 workflow、README 截图与 `npm run thumbs` 脚本。

### Changed

- 预览画布宽度由 800px 改为 210mm，页面比例与 A4 一致。
- 新建 Tab 不再立即标记 dirty（切换 / 新建 Tab 不会误触自动保存与关闭确认）。
- Tab 标题随姓名自动更新；打开已存在的同名文件时切换到已有 Tab，而不是重复打开。
- 健康度卡片在空白简历上隐藏，填写后显示。
- 工具栏改为导出下拉菜单（打印 PDF / Word / 图片 PDF），并新增撤销 / 重做按钮。
- `resume-tool` 版本号升至 2.2.0，与 CHANGELOG 对齐。

### Fixed

- 修复 Firefox / Safari 下「保存」静默无响应的问题：现在自动降级为下载 JSON 并给出提示。
- 修复 Executive 模板侧栏技能列表被挤成竖排、等级标签溢出的问题。
- 修复预览区在窄屏下缺少独立滚动容器的问题。

## [2.1.0] - 2026-08-06

### Added

- **自定义区块**：编辑面板新增「自定义区块」区，可添加任意标题 + 多行内容的区块（如证书资质、语言能力、开源贡献）。
  - 自定义区块以 `custom:${id}` 参与 8 套可变序模板的区块排序（新增自动追加到末尾，删除自动清理顺序）。
  - 数据随 JSON 文件保存 / localStorage 恢复 / 孤儿 Tab 恢复完整闭环，旧文件向后兼容（`_meta.version` 保持 `2.0`）。
- **主题设置**：编辑面板新增「主题设置」区（主色预设 + 自定义取色器 + 字体下拉 + 恢复默认）。
  - 引入 CSS 变量 token 层（`--c-primary` / `--c-bg` / `--c-text` / `--c-text-muted` / `--c-border` / `--font-family`），13 套模板与共享组件全部以 `var(--xxx, 原值)` 替换，未设置主题时视觉零回归。
  - 主题随 `_meta.theme` 存档、随 localStorage 快照恢复、随 PDF 导出（作用于 `.preview-canvas` 子树）。
  - 模板「性格色」（如 Tech 辅助蓝、CardStyle 分区块彩色）保持硬编码不参与主题化。

### Changed

- `SectionKey` 扩展出 `SectionId = SectionKey | custom:${string}`，`sectionOrder` 相关类型放宽以支持自定义区块。
- `parseResumeFile` / `serializeResume` 支持 `customSections` 与 `theme` 字段的宽容解析与序列化。
- tabs store 新增 `addCustomSection` / `removeCustomSection` / `setTheme` action。
- 8 套单列模板标题渲染改用 `getSectionLabel`（自定义区块显示用户标题）。

### Fixed

- 无

## [2.0.0] - 2026-07-24

### Added

- 从 vanilla JS 迁移到 Vue 3 + TypeScript + Vite 脚手架，定义核心类型与 TS 严格模式。
- 13 套简历模板：
  - 8 套单列可变序：Classic / Minimal / Gradient / Creative / DataDriven / QaPro / CardStyle / ChineseElegant
  - 5 套固定布局：Modern / Executive / European / Tech / TechGradient
- 三级拖拽排序：
  - 区块级（整体顺序，单列可变序模板生效）
  - 列表项级（技能 / 经历 / 教育排序）
  - 子项级（工作内容条目独立排序）
- 多 Tab 会话管理（类 IDE 多 Tab 编辑），每个 Tab 独立数据 + 模板 + sectionOrder，dirty 标记 + 关闭确认。
- 实时预览面板（PreviewPanel 用 `defineAsyncComponent` 异步加载模板，与编辑器完全解耦）。
- localStorage 自动兜底 + 启动恢复：编辑自动持久化，崩溃 / 刷新后启动时弹窗恢复"孤儿 Tab"。
- File System Access API + 降级方案：现代浏览器原生文件读写，不支持时降级到 `input[type=file]` + Blob 下载。
- 键盘快捷键：`Ctrl+S` 保存 / `Ctrl+O` 打开 / `Ctrl+P` 导出 PDF / `Ctrl+Shift+N` 新建 / `Ctrl+Shift+S` 另存为 / `[` `]` 切换模板。
- PDF 导出（html2pdf.js + A4 + 高清缩放）。
- `file://` 部署支持：`base: './'` 构建产物可双击 `index.html` 直接打开。
- 旧版 JSON 文件向后兼容（兼容无 `_meta` 的旧格式文件）。
- 通用组件：DraggableList / ConfirmDialog / Toast / AppIcon。
- 6 个组合式函数：useAutoSave / useConfirm / useKeyboardShortcuts / usePdfExport / useSectionOrder / useStartupRecovery。
- 3 个 Pinia store：fileSystem / tabs / ui。
- 简历解析、序列化与校验工具（parseResume / validate / sanitize / errors / icons）。
- 测试体系：
  - 23 个单元测试文件 / 181 个用例全绿（Vitest + @vue/test-utils + jsdom）
  - 10 个 E2E 测试用例全绿（Playwright）
  - 测试覆盖率约 85%

### Changed

- 项目的整体架构从单文件 vanilla JS 重构为 Vue 3 + TS 模块化结构。
- 图标系统从字符串字典迁移到 TS 模块 + AppIcon 组件。

### Fixed

- 修正 `ui-components.spec.ts` 中 `toastInfo` 调用签名。
- 修正 `fileSystem` mock 路径与 `useAutoSave` 主函数测试。
- PreviewPanel 用 `defineAsyncComponent` 包装异步模板组件，E2E 全部通过。
