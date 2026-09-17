/**
 * Image derivatives: keep original bytes untouched; generate WebP sizes.
 * sharp is optional — if missing, upload still succeeds without derivatives.
 */

export type SizeName = 'thumbnail' | 'medium' | 'large';

export type DerivativeSpec = {
  name: SizeName;
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

export type DerivativeResult = {
  name: SizeName;
  key: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: 'image/webp';
};

export type SizeMap = Partial<
  Record<
    SizeName | 'original',
    { key: string; width?: number; height?: number; sizeBytes?: number; mimeType?: string }
  >
>;

export function defaultDerivativeSpecs(): DerivativeSpec[] {
  const thumbW = Number(process.env.MEDIA_THUMB_WIDTH ?? 150);
  const thumbH = Number(process.env.MEDIA_THUMB_HEIGHT ?? 150);
  const medW = Number(process.env.MEDIA_MEDIUM_WIDTH ?? 300);
  const medH = Number(process.env.MEDIA_MEDIUM_HEIGHT ?? 300);
  const largeW = Number(process.env.MEDIA_LARGE_WIDTH ?? 1024);
  const largeH = Number(process.env.MEDIA_LARGE_HEIGHT ?? 1024);
  const qThumb = Number(process.env.MEDIA_WEBP_QUALITY_THUMB ?? 75);
  const q = Number(process.env.MEDIA_WEBP_QUALITY ?? 82);
  return [
    { name: 'thumbnail', maxWidth: thumbW, maxHeight: thumbH, quality: qThumb },
    { name: 'medium', maxWidth: medW, maxHeight: medH, quality: q },
    { name: 'large', maxWidth: largeW, maxHeight: largeH, quality: q },
  ];
}

type SharpLikeInstance = {
  rotate: () => SharpLikeInstance;
  resize: (
    w: number,
    h: number,
    opts: { fit: string; withoutEnlargement: boolean },
  ) => SharpLikeInstance;
  webp: (opts: { quality: number }) => SharpLikeInstance;
  toBuffer: (opts?: {
    resolveWithObject: boolean;
  }) => Promise<
    Buffer | { data: Buffer; info: { width: number; height: number; size: number } }
  >;
  metadata: () => Promise<{ width?: number; height?: number }>;
};

type SharpLike = {
  (input: Buffer): SharpLikeInstance;
};

async function loadSharp(): Promise<SharpLike | null> {
  try {
    const mod = await import(
      /* webpackIgnore: true */ /* turbopackOptional: true */ 'sharp'
    );
    return ((mod as { default?: SharpLike }).default ?? mod) as SharpLike;
  } catch {
    return null;
  }
}

export async function readImageMeta(
  body: Buffer,
): Promise<{ width?: number; height?: number }> {
  const sharp = await loadSharp();
  if (!sharp) return {};
  try {
    const meta = await sharp(body).metadata();
    return { width: meta.width, height: meta.height };
  } catch {
    return {};
  }
}

export async function generateWebpDerivatives(
  original: Buffer,
  baseKey: string,
): Promise<{ derivatives: DerivativeResult[]; skippedReason?: string }> {
  const sharp = await loadSharp();
  if (!sharp) {
    return { derivatives: [], skippedReason: 'sharp not installed' };
  }

  const specs = defaultDerivativeSpecs();
  const out: DerivativeResult[] = [];

  for (const spec of specs) {
    try {
      const pipeline = sharp(original)
        .rotate()
        .resize(spec.maxWidth, spec.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: spec.quality });

      const result = (await pipeline.toBuffer({ resolveWithObject: true })) as {
        data: Buffer;
        info: { width: number; height: number; size: number };
      };

      const key = `${baseKey.replace(/\.[^.]+$/, '')}-${spec.name}.webp`;
      const item: DerivativeResult & { body?: Buffer } = {
        name: spec.name,
        key,
        width: result.info.width,
        height: result.info.height,
        sizeBytes: result.info.size ?? result.data.length,
        mimeType: 'image/webp',
      };
      item.body = result.data;
      out.push(item);
    } catch {
      // skip failed size
    }
  }

  return { derivatives: out };
}

export type DerivativeWithBody = DerivativeResult & { body: Buffer };
