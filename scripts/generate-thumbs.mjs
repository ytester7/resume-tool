/**
 * 生成模板缩略图（开发脚本）。
 *
 * 用法：npm run thumbs
 * 产物：src/assets/template-thumbs/{template}.jpg（240×300）
 *
 * 思路：起一个临时 Vite server → 打开欢迎页 → 载入第一套示例 →
 * 依次按 `]` 切换模板 → 截取 A4 画布上半部分 → 在浏览器里压缩成 JPEG。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src/assets/template-thumbs');

const TEMPLATE_ORDER = [
  'classic', 'minimal', 'gradient', 'creative', 'data-driven', 'qa-pro',
  'card-style', 'chinese-elegant', 'modern', 'executive', 'european',
  'tech', 'tech-gradient',
];

const THUMB_W = 240;
const THUMB_H = 300;

async function toJpeg(page, pngBuffer) {
  const dataUrl = 'data:image/png;base64,' + pngBuffer.toString('base64');
  const jpeg = await page.evaluate(async ({ dataUrl, w, h }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return canvas.toDataURL('image/jpeg', 0.82);
  }, { dataUrl, w: THUMB_W, h: THUMB_H });
  return Buffer.from(jpeg.split(',')[1], 'base64');
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const server = await createServer({
    root,
    server: { port: 5179, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const base = 'http://localhost:5179';

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });

  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    const sampleCard = page.locator('.sample-card').first();
    if (await sampleCard.count()) {
      await sampleCard.click();
    } else {
      await page.click('.tab-new-btn');
    }
    await page.waitForSelector('.preview-canvas .resume');
    await page.addStyleTag({ content: '.toast-container{display:none !important}' });
    await page.waitForTimeout(700);

    for (let i = 0; i < TEMPLATE_ORDER.length; i++) {
      const name = TEMPLATE_ORDER[i];
      if (i > 0) {
        await page.keyboard.press(']');
        await page.waitForTimeout(650);
      }
      const box = await page.locator('.preview-canvas').boundingBox();
      if (!box) throw new Error('找不到预览画布');
      const png = await page.screenshot({
        clip: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: Math.min(box.height, box.width * 1.25),
        },
      });
      const jpeg = await toJpeg(page, png);
      fs.writeFileSync(path.join(outDir, `${name}.jpg`), jpeg);
      console.log(`✓ ${name}.jpg  ${(jpeg.length / 1024).toFixed(1)}KB`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(`\n完成：${TEMPLATE_ORDER.length} 张缩略图 → src/assets/template-thumbs/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
