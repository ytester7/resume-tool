import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

export default tseslint.config(
  // 全局忽略
  {
    ignores: [
      'dist/',
      'node_modules/',
      'resume-builder/',
      'coverage/',
      'playwright-report/',
    ],
  },

  // 基础推荐配置
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // Vue 文件：使用 vue-eslint-parser，并在 <script lang="ts"> 中使用 TS parser
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
  },

  // 规则覆盖
  {
    rules: {
      // TypeScript 已通过类型检查覆盖未定义变量检测（tsconfig 仅作用于 .ts，
      // .vue 文件需在此显式关闭，否则 document/HTMLElement 等浏览器全局会误报）
      'no-undef': 'off',
      // noUnusedLocals 已由 tsconfig 处理，这里降级为 warn
      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      // 现有代码大量使用 any（File System Access API 等），降级为 warn
      '@typescript-eslint/no-explicit-any': 'warn',
      // 测试 mock 中存在空函数（addEventListener: () => {}）
      '@typescript-eslint/no-empty-function': 'warn',
      // vite-env.d.ts 使用 {} 类型声明 ImportMetaEnv
      '@typescript-eslint/no-empty-object-type': 'warn',
      // 测试 mock 中存在不含 yield 的 generator 函数（模拟 async iterator）
      'require-yield': 'warn',
      // sanitize.ts 正则中存在 \/ 转义
      'no-useless-escape': 'warn',
      // 现有单单词组件名（App / Toast / Toolbar / TabBar）
      'vue/multi-word-component-names': 'off',
      // 以下为可能与 prettier 冲突的格式化规则，统一关闭
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-closing-bracket-spacing': 'off',
    },
  },
);
