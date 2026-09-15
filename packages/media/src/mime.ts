const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};

/** Prefer browser MIME; fall back to extension when empty/octet-stream. */
export function sniffMime(browserType: string | undefined, filename: string): string {
  const t = (browserType ?? '').trim().toLowerCase();
  if (t && t !== 'application/octet-stream') return t;
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? (t || 'application/octet-stream');
}
