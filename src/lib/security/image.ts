import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** JPEG, PNG or WebP by magic bytes — never trust the file name or the browser's MIME type (plan 6.5). */
export function sniffImageType(bytes: Uint8Array): "jpeg" | "png" | "webp" | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b);
  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "webp";
  return null;
}

/**
 * Re-encodes to a square JPEG (≤ 600×600). sharp drops all metadata (EXIF, GPS) unless asked to keep it.
 * Crops around the most "interesting" area (usually the face).
 */
export async function processProfilePhoto(bytes: Uint8Array): Promise<Buffer> {
  return sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" })
    .rotate() // apply the EXIF orientation before the metadata is dropped
    .resize(600, 600, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}
