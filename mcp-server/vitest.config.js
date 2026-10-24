import { defineConfig } from 'vitest/config';

// mcp-server 独立的 vitest 配置：没有它，vitest 会向上找到根目录的
// vitest.config.ts，在 CI（未安装根依赖）下直接崩掉。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
