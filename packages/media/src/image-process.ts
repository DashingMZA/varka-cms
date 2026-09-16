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

/**
 * Keep **original** bytes unchanged (same format/dimensions).
 * Generate thumbnail / medium / large as WebP derivatives only.
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
    body, // untouched original
  };

  const out: GeneratedSize[] = [original];

  const targets: { name: Exclude<SizeName, 'original'>; maxW: number }[] = [
    { name: 'thumbnail', maxW: sizeConfig.thumbnail },
    { name: 'medium', maxW: sizeConfig.medium },
    { name: 'large', maxW: sizeConfig.large },
  ];

  for (const t of targets) {
    // Skip generating a derivative larger than source (still write entry pointing to original dims as webp scaled down only)
    const width = Math.min(t.maxW, srcW);
    const resized = await sharp(body)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: t.name === 'thumbnail' ? 75 : 80 })
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
