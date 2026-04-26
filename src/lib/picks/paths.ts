const R2_BASE = "https://photos.studiotj.com";

export function resolveR2(imagePath: string): string {
  return `${R2_BASE}${imagePath}`;
}
