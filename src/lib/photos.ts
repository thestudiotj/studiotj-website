import { getPortfolio } from './portfolio'
import type { Photo, Collection } from './portfolio'
import { getAllJournalPhotos } from './journal'
import type { JournalPhoto } from './journal'

// ─── Discriminated union for cross-source photo lookup ────────────────────────

export type PortfolioPhotoRecord = {
  source: 'portfolio'
  photo: Photo
  collection: Collection | null
}

export type JournalPhotoRecord = {
  source: 'journal'
  photo: JournalPhoto
}

export type PhotoRecord = PortfolioPhotoRecord | JournalPhotoRecord

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getShootPrefix(photoId: string): string {
  return photoId.split('-dsc-')[0]
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Look up a photo by ID — portfolio first, journal second. */
export function getPhotoRecord(id: string): PhotoRecord | null {
  const portfolio = getPortfolio()
  if (portfolio) {
    const photo = portfolio.photos.find(p => p.id === id)
    if (photo) {
      const collection = portfolio.collections.find(c => c.photo_ids.includes(id)) ?? null
      return { source: 'portfolio', photo, collection }
    }
  }

  const journalPhoto = getAllJournalPhotos().find(p => p.id === id)
  if (journalPhoto) return { source: 'journal', photo: journalPhoto }

  return null
}

/** All portfolio + journal photos sharing the same shoot prefix, excluding the given photo. */
export function getShootPhotos(photoId: string): Array<Photo | JournalPhoto> {
  const prefix = getShootPrefix(photoId)
  const result: Array<Photo | JournalPhoto> = []

  for (const photo of getPortfolio()?.photos ?? []) {
    if (photo.id !== photoId && getShootPrefix(photo.id) === prefix) {
      result.push(photo)
    }
  }

  for (const photo of getAllJournalPhotos()) {
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
