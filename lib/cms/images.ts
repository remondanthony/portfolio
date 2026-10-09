/**
 * Featured-image uploads.
 *
 * The file's type is read from its first bytes, never from its name or the
 * browser's say-so, and its dimensions from its header — next/image needs
 * both width and height, and taking them from the file means they are right.
 * JPEG, PNG and WebP only: the formats next/image optimises and every
 * browser shows.
 *
 * Uploads are never written to the server's disk in production. They travel
 * in the same GitHub commit as the article that uses them.
 */

/** Below Vercel's 4.5 MB request limit with room for the article and form overhead. */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export type ImageInfo = { ext: 'jpg' | 'png' | 'webp'; width: number; height: number };

function jpegSize(b: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC), carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

export function inspectImage(b: Buffer): ImageInfo | null {
  if (b.length < 30) return null;
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') {
    return { ext: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    const s = jpegSize(b);
    return s ? { ext: 'jpg', ...s } : null;
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { ext: 'webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { ext: 'webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') {
      return { ext: 'webp', width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    }
  }
  return null;
}

/** A descriptive, safe file name from whatever the uploader was called. */
export function imageName(original: string, fallback = 'cover') {
  const base = original.replace(/\.[^.]*$/, '').toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base || fallback;
}
