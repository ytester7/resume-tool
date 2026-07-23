# resume-tool · 简历制作工具

> 一个基于 Vue 3 + TypeScript 的本地优先简历编辑器：13 套模板、三级拖拽排序、多 Tab 会话、实时预览，支持 `file://` 双击打开与 PDF 导出。

<!-- 在此添加截图 -->
<!-- 建议放置一张编辑器 + 预览面板的主界面截图，可使用 ![](docs/screenshot-main.png) 语法 -->

## 在线演示

<!-- 在此添加在线演示链接 -->
<!-- 若部署了在线 demo，可在此填写链接：在线 Demo：<https://your-demo-url> -->

当前版本支持本地直接使用：下载 Release 构建产物，解压后双击 `index.html` 即可在浏览器中打开（基于 `base: './'` 的 `file://` 部署）。

## 功能特性

| # | 功能 | 说明 |
|---|------|------|
| 1 | 13 套简历模板 | Classic / Minimal / Gradient / Creative / DataDriven / QaPro / CardStyle / ChineseElegant（8 套单列可变序）+ Modern / Executive / European / Tech / TechGradient（5 套固定布局） |
| 2 | 三级拖拽排序 | 区块级（整体顺序）+ 列表项级（技能/经历/教育排序）+ 子项级（工作内容条目独立排序） |
| 3 | 多 Tab 会话管理 | 类 IDE 多 Tab 编辑，每个 Tab 独立简历数据 + 模板 + sectionOrder，dirty 标记 + 关闭确认 |
| 4 | 实时预览 | 编辑器与预览面板完全解耦，所见即所得 |
| 5 | localStorage 自动兜底 + 启动恢复 | 编辑自动存 localStorage，崩溃/刷新后启动时弹窗恢复"孤儿 Tab" |
| 6 | File System Access API + 降级方案 | 现代浏览器原生文件读写，不支持时降级到 `input[type=file]` + Blob 下载 |
| 7 | 键盘快捷键 | Ctrl+S 保存 / Ctrl+O 打开 / Ctrl+P 导出 PDF / Ctrl+Shift+N 新建 / Ctrl+Shift+S 另存为 / `[` `]` 切换模板 |
| 8 | PDF 导出 | 基于 html2pdf.js 的 A4 高清导出 |
| 9 | `file://` 部署支持 | `base: './'` 构建产物可双击 `index.html` 直接打开 |
| 10 | 旧版 JSON 兼容 | 向后兼容无 `_meta` 的旧格式文件 |

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript（strict 模式） |
| 构建工具 | Vite 5 |
| 状态管理 | Pinia |
| 拖拽 | vuedraggable |
| 单元测试 | Vitest + @vue/test-utils + jsdom |
| E2E 测试 | Playwright |
| PDF 导出 | html2pdf.js |
| 代码质量 | vue-tsc 类型检查 |

## 快速开始

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9（或 pnpm / yarn 等效包管理器）
- 现代浏览器（推荐 Chrome 86+，详见[浏览器兼容性](#浏览器兼容性)）

### 安装与运行

```bash
# 1. 克隆仓库
git clone <repo-url>
cd resume-tool

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build

# 5. 本地预览构建产物
npm run preview
```

开发服务器默认运行在 `http://localhost:5173`。

## 使用说明

### 新建简历

- 点击工具栏"新建"按钮，或使用快捷键 `Ctrl+Shift+N` 创建一个新的空白 Tab。
- 每个 Tab 拥有独立的简历数据、模板选择与区块顺序。

### 选择模板

- 在编辑面板顶部的模板区块中选择模板。
- 使用快捷键 `[` / `]` 在模板列表中向前 / 向后切换。
- 单列可变序模板（8 套）支持区块顺序自定义；固定布局模板（5 套）使用预设布局。

### 编辑内容

- 在左侧编辑面板按区块填写：基本信息、技能、工作经历、项目经历、教育经历、自我评价、个人总结等。
- 编辑内容会实时同步到右侧预览面板。

### 拖拽排序

- **区块级**：在编辑面板的"区块顺序"区域拖动调整整体顺序（仅单列可变序模板生效）。
- **列表项级**：在技能 / 工作经历 / 教育经历等列表中拖动调整条目顺序。
- **子项级**：工作经历下的"工作内容"条目可独立排序。

### 保存与导出

- **保存**：`Ctrl+S` 写回当前打开的文件（首次保存或另存时使用 `Ctrl+Shift+S`）。
- **打开**：`Ctrl+O` 打开本地 `.json` 简历文件。
- **导出 PDF**：`Ctrl+P` 调用 html2pdf.js 生成 A4 高清 PDF。
- 编辑过程会自动写入 localStorage 兜底，浏览器崩溃或意外刷新后，下次启动会弹窗提示恢复"孤儿 Tab"。

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + S` | 保存当前简历 |
| `Ctrl + Shift + S` | 另存为 |
| `Ctrl + O` | 打开 JSON 文件 |
| `Ctrl + P` | 导出 PDF |
| `Ctrl + Shift + N` | 新建简历 Tab |
| `[` | 切换到上一个模板 |
| `]` | 切换到下一个模板 |

## 项目结构

```
resume-tool/
├── src/
│   ├── components/
│   │   ├── sections/          # 8 个编辑区块组件
│   │   │   ├── BasicInfoSection.vue
│   │   │   ├── EducationSection.vue
│   │   │   ├── EvaluationSection.vue
│   │   │   ├── ExperienceSection.vue
│   │   │   ├── ProjectsSection.vue
│   │   │   ├── SkillsSection.vue
│   │   │   ├── SummarySection.vue
│   │   │   └── TemplateSection.vue
│   │   ├── templates/         # 13 个模板 + 6 个共享子组件
│   │   │   ├── shared/        # ContactItems / SkillList / ExperienceItem / ProjectItem / EducationItem / EvaluationList
│   │   │   ├── ClassicLayout.vue … TechGradientLayout.vue
│   │   ├── EditorPanel.vue    # 编辑面板
│   │   ├── PreviewPanel.vue   # 预览面板（异步加载模板）
│   │   ├── TabBar.vue         # 多 Tab 管理
│   │   ├── Toolbar.vue        # 顶部工具栏
│   │   ├── DraggableList.vue  # 通用拖拽列表
│   │   ├── ConfirmDialog.vue  # 确认对话框
│   │   ├── Toast.vue          # 通知组件
│   │   └── AppIcon.vue        # 图标组件
│   ├── composables/           # 6 个组合式函数
│   │   ├── useAutoSave.ts            # 自动保存到 localStorage
│   │   ├── useConfirm.ts             # 确认对话框
│   │   ├── useKeyboardShortcuts.ts   # 全局快捷键
│   │   ├── usePdfExport.ts           # PDF 导出
│   │   ├── useSectionOrder.ts        # 区块顺序管理
│   │   └── useStartupRecovery.ts     # 启动恢复孤儿 Tab
│   ├── stores/                # 3 个 Pinia store
│   │   ├── fileSystem.ts      # 文件读写（File System Access API + 降级）
│   │   ├── tabs.ts            # 多 Tab 会话管理
│   │   └── ui.ts              # UI 状态（toast / confirm）
│   ├── types/
│   │   └── resume.ts          # 简历类型定义
│   ├── utils/                 # 工具函数（解析 / 序列化 / 校验 / 错误 / 图标 / sanitize）
│   └── styles/
│       └── main.css           # 全局样式
├── e2e/                       # Playwright E2E 测试
│   ├── smoke.spec.ts
│   ├── drag-sort.spec.ts
│   └── multi-tab.spec.ts
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## 测试

本项目重视测试稳定性，单元测试与 E2E 测试全绿。

```bash
# 单元测试（Vitest，单次运行）
npm run test

# 单元测试（watch 模式）
npm run test:watch

# 单元测试覆盖率
npm run test:coverage

# E2E 测试（Playwright，首次运行会自动安装浏览器）
npx playwright install
npm run e2e
```

测试概览：

| 类别 | 数量 |
|------|------|
| 单元测试文件 | 23 个 |
| 单元测试用例 | 181 个 |
| E2E 测试用例 | 10 个 |
| 测试覆盖率 | ~85% |

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome / Edge ≥ 86 | ✅ 完整支持（File System Access API 原生读写） |
| Firefox / Safari 现代版本 | ⚠️ 降级方案（`input[type=file]` 打开 + Blob 下载保存） |
| 所有现代浏览器 | ✅ 编辑 / 预览 / 拖拽 / PDF 导出 / localStorage 兜底均可用 |

> 在不支持 File System Access API 的浏览器中，"保存"会降级为下载文件，"另存为"始终走下载流程。

## 许可证

[MIT License](./LICENSE)

> 注：仓库尚未包含 `LICENSE` 文件，正式开源发布前请补充。

## 贡献指南

欢迎提交 Issue 与 Pull Request。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发环境、代码规范、测试要求与 PR 流程。
