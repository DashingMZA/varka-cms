import { createRequire } from 'node:module';
import { assertSafeImagePayload, type DetectedImage } from './image-security';

export type SizeName = 'thumbnail' | 'medium' | 'large' | 'original';

export type GeneratedSize = {
  name: SizeName;
  key: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  body: Buffer;
};

export type ImageSizeConfig = {
  thumbnail: number;
  medium: number;
  large: number;
};

export const DEFAULT_IMAGE_SIZES: ImageSizeConfig = {
  thumbnail: 150,
  medium: 300,
  large: 1024,
};

function loadSharp():
  | ((input?: Buffer) => {
      metadata: () => Promise<{ width?: number; height?: number }>;
      resize: (o: {
        width: number;
        withoutEnlargement?: boolean;
      }) => {
        webp: (o?: { quality?: number }) => {
          toBuffer: () => Promise<Buffer>;
        };
      };
    })
  | null {
  try {
    const require = createRequire(import.meta.url);
    return require('sharp') as never;
  } catch {
    return null;
  }
}

function extFor(detected: DetectedImage): string {
  switch (detected.kind) {
    case 'jpeg':
      return 'jpg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
  }
}

function webpQuality(kind: 'thumb' | 'default'): number {
  const raw =
    kind === 'thumb'
      ? process.env.MEDIA_WEBP_QUALITY_THUMB
      : process.env.MEDIA_WEBP_QUALITY;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 40 && n <= 100) return Math.round(n);
  return kind === 'thumb' ? 75 : 80;
}

/**
 * Keep **original** bytes unchanged.
 * Generate thumbnail / medium / large as WebP (quality from env).
 *
 * WebP tradeoffs (quality ~40–100):
 * - 60–70: aggressive savings, visible artifacts on text/UI screenshots
 * - 75–82: good default for photos (thumb 75 / body 80)
 * - 90+: near-lossless size; diminishing returns vs JPEG
 */
export async function processImageUpload(
  body: Buffer,
  baseKeyWithoutExt: string,
  sizeConfig: ImageSizeConfig = DEFAULT_IMAGE_SIZES,
): Promise<{ sizes: GeneratedSize[]; primary: GeneratedSize; detected: DetectedImage }> {
  const detected = assertSafeImagePayload(body);

  const sharp = loadSharp();
  if (!sharp) {
    throw new Error(
      'sharp is required for size derivatives. Run: pnpm --filter @varka/media add sharp',
    );
  }

  const meta = await sharp(body).metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (srcW < 1 || srcH < 1) {
    throw new Error('Invalid image dimensions');
  }

  const originalExt = extFor(detected);
  const original: GeneratedSize = {
    name: 'original',
    key: `${baseKeyWithoutExt}.${originalExt}`,
    width: srcW,
    height: srcH,
    mimeType: detected.mimeType,
    sizeBytes: body.length,
    body,
  };

  const out: GeneratedSize[] = [original];
  const qThumb = webpQuality('thumb');
  const qDefault = webpQuality('default');

  const targets: { name: Exclude<SizeName, 'original'>; maxW: number }[] = [
    { name: 'thumbnail', maxW: sizeConfig.thumbnail },
    { name: 'medium', maxW: sizeConfig.medium },
    { name: 'large', maxW: sizeConfig.large },
  ];

  for (const t of targets) {
    const width = Math.min(t.maxW, srcW);
    const quality = t.name === 'thumbnail' ? qThumb : qDefault;
    const resized = await sharp(body)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    const m = await sharp(resized).metadata();
    out.push({
      name: t.name,
      key: `${baseKeyWithoutExt}-${t.name}.webp`,
      width: m.width ?? width,
      height: m.height ?? Math.round((srcH / srcW) * width),
      mimeType: 'image/webp',
      sizeBytes: resized.length,
      body: resized,
    });
  }

  return { sizes: out, primary: original, detected };
}
