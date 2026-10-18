/** 图片处理工具：证件照裁剪 + 压缩 */

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * 计算居中裁剪区域（默认 3:4 竖版）。
 * 纯函数，便于单元测试。
 */
export function computeCropRect(width: number, height: number, ratio = 3 / 4): CropRect {
  if (width <= 0 || height <= 0) throw new Error('图片尺寸不合法');
  if (width / height > ratio) {
    const sw = height * ratio;
    return { sx: (width - sw) / 2, sy: 0, sw, sh: height };
  }
  const sh = width / ratio;
  return { sx: 0, sy: (height - sh) / 2, sw: width, sh };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export interface PhotoOptions {
  /** 输出宽度（px），默认 360 */
  maxWidth?: number;
  /** 输出高度（px），默认 480 */
  maxHeight?: number;
  /** JPEG 质量，默认 0.86 */
  quality?: number;
}

/**
 * 把用户选择的图片压缩成 3:4 证件照 data URL。
 * 输出尺寸控制在 360×480 以内，避免 localStorage 配额被一张照片吃满。
 */
export async function fileToPhotoDataUrl(file: File, options: PhotoOptions = {}): Promise<string> {
  const { maxWidth = 360, maxHeight = 480, quality = 0.86 } = options;
  const raw = await readAsDataUrl(file);
  const img = await loadImage(raw);
  const crop = computeCropRect(img.naturalWidth || img.width, img.naturalHeight || img.height);

  const scale = Math.min(maxWidth / crop.sw, maxHeight / crop.sh, 1);
  const outW = Math.max(1, Math.round(crop.sw * scale));
  const outH = Math.max(1, Math.round(crop.sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持图片处理');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', quality);
}
