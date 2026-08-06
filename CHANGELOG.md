# Changelog

本项目所有重要变更均会记录在本文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
