import { createRequire } from 'node:module';
import { assertSafeImagePayload } from './image-security';

export type SizeName = 'thumbnail' | 'medium' | 'large' | 'full';

export type GeneratedSize = {
  name: SizeName;
  key: string;
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  body: Buffer;
};

/** WordPress-like max widths */
const TARGETS: { name: SizeName; maxW: number }[] = [
  { name: 'thumbnail', maxW: 150 },
  { name: 'medium', maxW: 300 },
  { name: 'large', maxW: 1024 },
];

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
      webp: (o?: { quality?: number }) => { toBuffer: () => Promise<Buffer> };
    })
  | null {
  try {
    const require = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('sharp') as never;
  } catch {
    return null;
  }
}

/**
 * Validate real image → convert to WebP → generate thumbnail/medium/large/full.
 */
export async function processImageUpload(
  body: Buffer,
  baseKeyWithoutExt: string,
): Promise<{ sizes: GeneratedSize[]; primary: GeneratedSize }> {
  assertSafeImagePayload(body);

  const sharp = loadSharp();
  if (!sharp) {
    throw new Error(
      'sharp is required for WebP conversion. Run: pnpm --filter @varka/media add sharp',
    );
  }

  const img = sharp(body);
  const meta = await img.metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (srcW < 1 || srcH < 1) {
    throw new Error('Invalid image dimensions');
  }

  const out: GeneratedSize[] = [];

  // full WebP
  const fullBody = await sharp(body).webp({ quality: 82 }).toBuffer();
  const fullMeta = await sharp(fullBody).metadata();
  const full: GeneratedSize = {
    name: 'full',
    key: `${baseKeyWithoutExt}-full.webp`,
    width: fullMeta.width ?? srcW,
    height: fullMeta.height ?? srcH,
    mimeType: 'image/webp',
    sizeBytes: fullBody.length,
    body: fullBody,
  };
  out.push(full);

  for (const t of TARGETS) {
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

  return { sizes: out, primary: full };
}
