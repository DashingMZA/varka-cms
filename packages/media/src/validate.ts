/**
 * Upload security: magic-byte sniffing so MIME from the client is not trusted.
 * Only real image containers (and optional PDF) are accepted.
 */

export type DetectedMedia = {
  mimeType: string;
  extension: string;
  kind: 'image' | 'pdf';
};

/** Reject path traversal / null bytes in user-supplied names */
export function assertSafeUploadName(filename: string): void {
  if (!filename || filename.includes('\0')) {
    throw new Error('Invalid filename');
  }
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Filename must not contain path segments');
  }
}

function matchAt(buf: Buffer, offset: number, sig: number[]): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

/**
 * Detect real file type from magic bytes. Does not trust client Content-Type.
 */
export function detectMediaType(body: Buffer): DetectedMedia | null {
  if (!body || body.length < 12) return null;

  // JPEG
  if (matchAt(body, 0, [0xff, 0xd8, 0xff])) {
    return { mimeType: 'image/jpeg', extension: 'jpg', kind: 'image' };
  }
  // PNG
  if (matchAt(body, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', extension: 'png', kind: 'image' };
  }
  // GIF87a / GIF89a
  if (
    matchAt(body, 0, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matchAt(body, 0, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return { mimeType: 'image/gif', extension: 'gif', kind: 'image' };
  }
  // WebP: RIFF....WEBP
  if (
    matchAt(body, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matchAt(body, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return { mimeType: 'image/webp', extension: 'webp', kind: 'image' };
  }
  // PDF
  if (matchAt(body, 0, [0x25, 0x50, 0x44, 0x46])) {
    return { mimeType: 'application/pdf', extension: 'pdf', kind: 'pdf' };
  }

  // SVG is text — easy XSS vector; reject by default for upload security.
  const head = body.subarray(0, Math.min(256, body.length)).toString('utf8').trimStart();
  if (head.startsWith('<?xml') || head.startsWith('<svg') || /<svg[\s>]/i.test(head)) {
    return null;
  }

  return null;
}

export function assertAllowedUpload(body: Buffer, claimedMime?: string): DetectedMedia {
  const detected = detectMediaType(body);
  if (!detected) {
    throw new Error(
      'File rejected: only real JPEG, PNG, GIF, WebP images (or PDF) are allowed. SVG and unknown binaries are blocked.',
    );
  }
  if (claimedMime && claimedMime !== 'application/octet-stream' && claimedMime !== detected.mimeType) {
    const norm = (m: string) => (m === 'image/jpg' ? 'image/jpeg' : m);
    if (norm(claimedMime) !== norm(detected.mimeType)) {
      throw new Error(
        `MIME mismatch: claimed ${claimedMime}, detected ${detected.mimeType}`,
      );
    }
  }
  return detected;
}
