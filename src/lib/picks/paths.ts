const R2_BASE = "https://photos.studiotj.com";

export function resolveR2(imagePath: string): string {
  const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${R2_BASE}${normalized}`;
}
