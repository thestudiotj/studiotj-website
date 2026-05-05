const R2_PUBLIC_BASE = 'https://photos.studiotj.com'

export function imageUrl(heroPath: string): string {
  if (heroPath.startsWith('http://') || heroPath.startsWith('https://')) return heroPath
  const trimmed = heroPath.replace(/^\/+/, '')
  return `${R2_PUBLIC_BASE}/${trimmed}`
}
