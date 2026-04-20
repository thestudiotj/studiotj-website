import { getPortfolio } from './portfolio'
import type { Photo, Collection } from './portfolio'

// ─── Discriminated union for cross-source photo lookup ────────────────────────

export type PortfolioPhotoRecord = {
  source: 'portfolio'
  photo: Photo
  collection: Collection | null
}

export type PhotoRecord = PortfolioPhotoRecord

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getShootPrefix(photoId: string): string {
  return photoId.split('-dsc-')[0]
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Look up a photo by ID from portfolio.json. */
export function getPhotoRecord(id: string): PhotoRecord | null {
  const portfolio = getPortfolio()
  if (portfolio) {
    const photo = portfolio.photos.find(p => p.id === id)
    if (photo) {
      const collection = portfolio.collections.find(c => c.photo_ids.includes(id)) ?? null
      return { source: 'portfolio', photo, collection }
    }
  }
  return null
}

/** All portfolio photos sharing the same shoot prefix, excluding the given photo. */
export function getShootPhotos(photoId: string): Photo[] {
  const prefix = getShootPrefix(photoId)
  const result: Photo[] = []

  for (const photo of getPortfolio()?.photos ?? []) {
    if (photo.id !== photoId && getShootPrefix(photo.id) === prefix) {
      result.push(photo)
    }
  }

  return result
}

/** "Location · Month Year" label, gracefully degrades to "Month Year" if location missing. */
export function getShootDisplayName(photo: { date?: string; location?: string }): string {
  const dateStr = photo.date
    ? new Date(photo.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : ''
  if (photo.location && dateStr) return `${photo.location} · ${dateStr}`
  return dateStr
}
