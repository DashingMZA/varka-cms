/** Lightweight image dimension probe (PNG / JPEG / GIF / WebP) — no native deps. */

export function probeImageSize(buf: Buffer): { width: number; height: number } | null {
  if (!buf || buf.length < 24) return null;

  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  }

  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return {
      width: buf.readUInt16LE(6),
      height: buf.readUInt16LE(8),
    };
  }

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
        };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }

  // WebP (RIFF .... WEBP)
  if (
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    // VP8X
    if (buf.toString('ascii', 12, 16) === 'VP8X' && buf.length >= 30) {
      const w = 1 + buf[24] + (buf[25] << 8) + (buf[26] << 16);
      const h = 1 + buf[27] + (buf[28] << 8) + (buf[29] << 16);
      return { width: w, height: h };
    }
    // VP8 
    if (buf.toString('ascii', 12, 16) === 'VP8 ' && buf.length >= 30) {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  return null;
}
