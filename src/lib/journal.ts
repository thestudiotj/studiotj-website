import fs from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JournalPhoto {
  id: string
  url: string
  thumbnail_url: string
  hero_url: string
  title: string
  aspect_ratio: number
  dominant_colors: string[]
  shoot_folder: string
  date: string
}

interface JournalData {
  version: string
  photos: JournalPhoto[]
}

// ─── Data access ──────────────────────────────────────────────────────────────

function readJournal(): JournalData | null {
  const filePath = path.join(process.cwd(), 'public', 'journal.json')
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as JournalData
  } catch {
    return null
  }
}

export function getJournalPhoto(id: string): JournalPhoto | null {
  return readJournal()?.photos.find(p => p.id === id) ?? null
}

export function getJournalPhotos(ids: string[]): JournalPhoto[] {
  const data = readJournal()
  if (!data) return []
  const map = new Map(data.photos.map(p => [p.id, p]))
  return ids.flatMap(id => {
    const photo = map.get(id)
    if (!photo) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[journal] Photo not found: ${id}`)
      }
      return []
    }
    return [photo]
  })
}
