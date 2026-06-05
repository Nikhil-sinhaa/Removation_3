import fs from 'fs';
import path from 'path';

/**
 * Returns a URL path to a style reference image for the given preset + room type.
 * Tries room-specific folder first, falls back to preset root, then placeholder.
 */
export function getStyleReferenceImage(presetId: string, roomType: string): string {
  const base = path.join(process.cwd(), 'public', 'style-references');

  // Try room-specific folder first
  const roomFolder = path.join(base, presetId, roomType);
  if (fs.existsSync(roomFolder)) {
    const images = fs.readdirSync(roomFolder).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (images.length > 0) {
      const random = images[Math.floor(Math.random() * images.length)];
      return `/style-references/${presetId}/${roomType}/${random}`;
    }
  }

  // Fall back to preset root folder
  const presetFolder = path.join(base, presetId);
  if (fs.existsSync(presetFolder)) {
    const images = fs.readdirSync(presetFolder).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    if (images.length > 0) {
      const random = images[Math.floor(Math.random() * images.length)];
      return `/style-references/${presetId}/${random}`;
    }
  }

  // Final fallback
  return '/style-references/placeholder.jpg';
}
