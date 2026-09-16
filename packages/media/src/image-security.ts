/**
 * Magic-byte validation — only real image payloads (not renamed executables).
 */

export type DetectedImage = {
  kind: 'jpeg' | 'png' | 'gif' | 'webp';
  mimeType: string;
};

export function detectImageMagic(buf: Buffer): DetectedImage | null {
  if (!buf || buf.length < 12) return null;

  // JPEG FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { kind: 'jpeg', mimeType: 'image/jpeg' };
  }

  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { kind: 'png', mimeType: 'image/png' };
  }

  // GIF87a / GIF89a
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return { kind: 'gif', mimeType: 'image/gif' };
  }

  // WebP: RIFF....WEBP
  if (
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { kind: 'webp', mimeType: 'image/webp' };
  }

  return null;
}

/** Reject polyglot / HTML disguised as image (basic). */
export function assertSafeImagePayload(buf: Buffer): DetectedImage {
  const detected = detectImageMagic(buf);
  if (!detected) {
    throw new Error('Not a real image file (magic bytes check failed)');
  }
  // Block obvious script/html prefixes after magic (rare polyglots)
  const sample = buf.subarray(0, Math.min(buf.length, 512)).toString('latin1');
  if (/<script/i.test(sample) || /<?php/i.test(sample)) {
    throw new Error('Image payload rejected (suspicious content)');
  }
  return detected;
}
